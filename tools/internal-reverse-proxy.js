/**
 * internal-reverse-proxy.js —— 内网系统访问通道（供设计蒸馏取证使用）
 *
 * 【用途】
 *   当目标系统位于内网、且内置浏览器无法直连时，用本代理在本地开一条访问通道。
 *   典型症状：ERR_CERT_AUTHORITY_INVALID
 *   （内网多使用自建 CA 签发证书，内置浏览器不信任，且内嵌 Chromium 不提供"继续前往"入口）
 *
 * 【原理三步】
 *   ① 忽略上游证书校验：以 rejectUnauthorized:false 连接上游 HTTPS，绕开证书信任链问题；
 *   ② 以纯 HTTP 暴露在 127.0.0.1：浏览器访问 http://127.0.0.1:<PORT>，
 *      本地回环 + 明文 HTTP，不存在证书校验环节；
 *   ③ 改写响应内容：把页面中指向内网的绝对 URL 重写为本地地址，并将 WEB_HTTPS 中和为 false，
 *      否则前端会自行跳回 https://<内网> 从而再次失败。
 *      同时处理 location / origin / referer / Set-Cookie 的 Domain 与 Secure，并转发 WebSocket 升级。
 *
 * 【用法】
 *   TARGET=<内网地址> PORT=<独占端口> node tools/internal-reverse-proxy.js
 *   随后在浏览器打开： http://127.0.0.1:<独占端口>/<路径>
 *
 * 【注意】
 *   · PORT 必须独占：一个目标一个端口，不要与其它目标复用（会串台）；
 *   · 仅支持 HTTPS 上游（若目标为 http，需改用 http.request）；
 *   · 本脚本关闭了 TLS 证书校验，仅用于自有内网系统的设计蒸馏取证，请勿用于第三方系统。
 */

const http = require("http");
const https = require("https");
const { URL } = require("url");

const TARGET = process.env.TARGET;
const PORT = Number(process.env.PORT || 8899);

if (!TARGET) {
  console.error(
    "[proxy] 缺少 TARGET。用法：TARGET=<内网地址> PORT=<独占端口> node tools/internal-reverse-proxy.js"
  );
  process.exit(1);
}

const target = new URL(TARGET);
const localOrigin = "http://127.0.0.1:" + PORT;

// ① 不校验证书，绕过内网自建 CA 的信任链问题
const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

// ③ 前端若按 WEB_HTTPS=true 拼 https 地址，会跳回内网导致再次失败，故中和之
const REWRITES = [
  [/window\.gconfig\.WEB_HTTPS/g, "false"],
  [/WEB_HTTPS\s*:\s*true/g, "WEB_HTTPS:false"],
  [/"WEB_HTTPS"\s*:\s*true/g, '"WEB_HTTPS":false'],
];

function rewriteUrl(value) {
  if (!value) return value;
  const hostRe = new RegExp("^https?://" + target.host.replace(/\./g, "\\."), "i");
  const hostOnlyRe = new RegExp(
    "^https?://" + target.hostname.replace(/\./g, "\\.") + "(:\\d+)?",
    "i"
  );
  return value.replace(hostRe, localOrigin).replace(hostOnlyRe, localOrigin);
}

function patch(buffer, contentType) {
  if (!/text\/html|javascript|ecmascript|application\/json|text\/plain/i.test(contentType || "")) {
    return null;
  }
  let s = buffer.toString("utf8");
  let changed = false;
  for (const pair of REWRITES) {
    if (pair[0].test(s)) {
      s = s.replace(pair[0], pair[1]);
      changed = true;
    }
  }
  if (!changed) return null;
  return Buffer.from(s, "utf8");
}

const server = http.createServer((req, res) => {
  const headers = Object.assign({}, req.headers);
  headers.host = target.host;
  delete headers["accept-encoding"];
  if (headers.origin) headers.origin = rewriteUrl(headers.origin);
  if (headers.referer) headers.referer = rewriteUrl(headers.referer);

  const upstream = https.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || 443,
      path: req.url,
      method: req.method,
      headers: headers,
      agent: agent,
    },
    (up) => {
      const out = Object.assign({}, up.headers);
      if (out.location) out.location = rewriteUrl(out.location);
      if (out["set-cookie"]) {
        out["set-cookie"] = out["set-cookie"].map((c) =>
          c.replace(/;\s*Domain=[^;]+/i, "").replace(/;\s*Secure/i, "")
        );
      }
      const chunks = [];
      up.on("data", (c) => chunks.push(c));
      up.on("end", () => {
        let body = Buffer.concat(chunks);
        const patched = patch(body, out["content-type"]);
        if (patched) body = patched;
        out["content-length"] = String(body.length);
        delete out["transfer-encoding"];
        res.writeHead(up.statusCode, out);
        res.end(body);
      });
    }
  );

  upstream.on("error", (e) => {
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end("proxy error: " + e.message);
  });

  req.pipe(upstream);
});

// 转发 WebSocket 升级（SPA 的长连接 / 热更新依赖它）
server.on("upgrade", (req, socket, head) => {
  const headers = Object.assign({}, req.headers);
  headers.host = target.host;
  const up = https.request({
    hostname: target.hostname,
    port: target.port || 443,
    path: req.url,
    method: req.method,
    headers: headers,
    agent: agent,
  });
  up.on("upgrade", (upRes, upSocket, upHead) => {
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
        Object.entries(upRes.headers)
          .map(([k, v]) => k + ": " + v)
          .join("\r\n") +
        "\r\n\r\n"
    );
    if (upHead && upHead.length) socket.unshift(upHead);
    upSocket.pipe(socket);
    socket.pipe(upSocket);
  });
  up.on("error", () => socket.destroy());
  up.end();
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("[proxy] http://127.0.0.1:" + PORT + "  ->  " + TARGET + "  (WEB_HTTPS 已中和)");
});
