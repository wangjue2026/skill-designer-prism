# SeerDesign 字体与排版

## 目录
- [2.1 字体调用顺序](#21-字体调用顺序)
- [2.2 字重规范](#22-字重规范)
- [2.3 字号与行高映射表](#23-字号与行高映射表)
- [2.4 排版一致性审计要求](#24-排版一致性审计要求)

---

## 2.1 字体调用顺序

必须严格执行以下系统调用顺序，确保在不同操作系统下视觉体验的一致性：

```css
font-family: pingfang SC, helvetica neue, arial, hiragino sans gb, microsoft yahei ui, microsoft yahei, simsun, sans-serif;
```

### 字体选择优先级

1. **pingfang SC** - 苹方（macOS/iOS 首选）
2. **helvetica neue** - Helvetica Neue（macOS 备选）
3. **arial** - Arial（Windows 通用）
4. **hiragino sans gb** - 冬青黑体（macOS 中文）
5. **microsoft yahei ui** / **microsoft yahei** - 微软雅黑（Windows 中文）
6. **simsun** - 宋体（Windows 最终备选）
7. **sans-serif** - 系统默认无衬线字体

## 2.2 字重规范

**严禁随意设置字重数值，仅允许使用以下两种状态：**

| 名称 | 字重值 | 适用场景 |
|-----|-------|---------|
| **Regular (正文)** | 400 | 普通正文、说明文字、次要信息 |
| **Bold (标题)** | 600 | 各级标题、加重强调、重要信息 |

### 禁止使用的字重值

- ❌ 100 (Thin)
- ❌ 200 (Extra Light)
- ❌ 300 (Light)
- ❌ 500 (Medium)
- ❌ 700 (Bold) - 使用 600 替代
- ❌ 800 (Extra Bold)
- ❌ 900 (Black)

### 使用示例

```css
/* 正确 ✓ */
.body-text {
  font-weight: 400;
}

.heading {
  font-weight: 600;
}

/* 错误 ✗ */
.title {
  font-weight: 500; /* 禁止使用 */
}
```

## 2.3 字号与行高映射表

**行高必须遵循公式：行高 = 字号 + 8px**

| Token 名称 | 字号 (px) | 行高 (px) | 适用场景说明 |
|-----------|----------|----------|-------------|
| xs | 12 | 20 | 正文 / 解释文字 |
| md | 14 | 22 | 二级标题 |
| lg | 16 | 24 | 一级标题 |
| xl | 20 | 28 | 文章副标题 |
| 2xl | 24 | 32 | 文章标题 / 数据看板 |
| 3xl | 30 | 38 | 大标题 / 数据看板 |
| 4xl | 36 | 44 | 特大标题 |
| 5xl | 48 | 56 | 超大标题 / 数据看板 |
| 6xl | 56 | 64 | 巨型标题 |
| 7xl | 64 | 72 | 特大标题 / 数据看板 |

### 行高计算示例

```css
/* 12px 字号 → 20px 行高 (12 + 8 = 20) */
.text-xs {
  font-size: 12px;
  line-height: 20px;
}

/* 14px 字号 → 22px 行高 (14 + 8 = 22) */
.text-md {
  font-size: 14px;
  line-height: 22px;
}

/* 16px 字号 → 24px 行高 (16 + 8 = 24) */
.text-lg {
  font-size: 16px;
  line-height: 24px;
}
```

## 2.4 排版一致性审计要求

### 2.4.1 禁止硬编码

```css
/* ❌ 错误：硬编码非规范数值 */
.element {
  font-size: 13px;      /* 禁止 */
  font-weight: 500;     /* 禁止 */
  line-height: 18px;    /* 禁止（不符合字号+8px） */
}

/* ✓ 正确：使用变量或规范数值 */
.element {
  font-size: var(--font-size-md);  /* 14px */
  font-weight: var(--font-weight-regular);  /* 400 */
  line-height: var(--line-height-md);  /* 22px */
}
```

### 2.4.2 强制行高

- 所有文字必须显式声明 `line-height`
- 行高必须严格执行 **字号 + 8px** 的逻辑
- 不允许使用 `line-height: normal` 或 `line-height: 1.5`

### 2.4.3 字重自检

| 场景 | 正确字重 |
|-----|---------|
| 普通正文 | 400 |
| 说明文字 | 400 |
| 次要信息 | 400 |
| 各级标题 | 600 |
| 加重强调 | 600 |
| 重要信息 | 600 |

### 2.4.4 sm 尺寸对齐

当使用 `size="sm"` 的组件时，其内部文字默认对齐 xs (12px/20px) 规范：

```jsx
// AntD 组件 size="sm" 时的字体规范
<Button size="small">按钮</Button>  // 内部文字 12px/20px

// 对应 CSS
.ant-btn-sm {
  font-size: 12px;
  line-height: 20px;
}
```

---

## 附录：字体相关 CSS 变量定义

```css
:root {
  /* Font Family Stack */
  --font-family: pingfang SC, helvetica neue, arial, hiragino sans gb, microsoft yahei ui, microsoft yahei, simsun, sans-serif;

  /* Font Weights */
  --font-weight-regular: 400;
  --font-weight-bold: 600;

  /* Font Sizes & Line Heights */
  --font-size-xs: 12px;
  --line-height-xs: 20px;

  --font-size-md: 14px;
  --line-height-md: 22px;

  --font-size-lg: 16px;
  --line-height-lg: 24px;

  --font-size-xl: 20px;
  --line-height-xl: 28px;

  --font-size-2xl: 24px;
  --line-height-2xl: 32px;

  --font-size-3xl: 30px;
  --line-height-3xl: 38px;

  --font-size-4xl: 36px;
  --line-height-4xl: 44px;

  --font-size-5xl: 48px;
  --line-height-5xl: 56px;

  --font-size-6xl: 56px;
  --line-height-6xl: 64px;

  --font-size-7xl: 64px;
  --line-height-7xl: 72px;
}
```

### 使用示例

```css
body {
  font-family: var(--font-family);
  font-weight: var(--font-weight-regular);
}

h1, h2, h3 {
  font-weight: var(--font-weight-bold);
}

.text-body {
  font-size: var(--font-size-md);
  line-height: var(--line-height-md);
}

.text-heading {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-lg);
}
```

色彩相关 CSS 变量见 [色彩体系](design-color.md#附录色彩相关-css-变量定义)。
