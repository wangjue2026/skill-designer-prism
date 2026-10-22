# SASE 设备多选选择器 (SASE Device Multi-Selector)

## ⚠️ 高频违规速查（生成/复用代码前必看）

> AI 在生成或复用本组件代码前，必须先逐行核对此表，确保完全符合设计和性能标准。

| 规则 | ✅ 正确 | ❌ 常见错误 |
|:---|:---|:---|
| **树与对象联动 (性能关键)** | **双向不联动**：子对象（表格设备）勾选后，左侧分组树**不显示**选中或半选状态，仅用作过滤器。 | 勾选设备后，左侧树跟着变为选中或半选（大数据量下直接导致界面卡死）。 |
| **树内节点级联禁用** | **级联禁用**：勾选父分组后，其所有后代分组的复选框被置为未选中，树节点置灰 (opacity 0.4) 并禁用 (pointer-events: none)，提示已被父级选中。 | 勾选父分组后子分组仍处于可勾选状态，未被置灰或禁用。 |
| **表单 Label 文案** | 必须为 **选择设备** | 使用“设备”或“设备选择”。 |
| **表单 Label 布局** | **左对齐**，字号 12px/400，颜色 `#6F7785` | 右对齐、居中，或字号和颜色不符合规范。 |
| **主备设备联动** | 勾选主/备关系中的任意一台，其关联设备**自动同步勾选**。在已选列表中，备设备缩进并紧跟在主设备下方。 | 主备设备各自独立勾选，或备设备在列表中乱序。 |
| **继承禁用逻辑** | 勾选分组后，其底下的子分组及对应设备**自动禁用**且视为默认选中，提示“该对象所属的父级已被选中，无需单独选择”。 | 勾选父分组后子树/子设备没有禁用，导致多余的冗余数据传输。 |
| **弹窗物理尺寸** | 固定宽高为 **1200px x 640px** | 使用不固定宽度或 `max-w` 自适应高度，导致多页时页面跳动。 |

---

## 业务规范说明

SASE 设备多选选择器主要用于管理大批量网络节点、网关和终端设备的场景。该组件包含两部分：
1. **表单展示区**：展示 “选择设备” Label 以及触发弹窗的点击选择框（显示已选摘要）。
2. **多选弹出层 (1200x640)**：采用三栏式设计，左侧为分组树，中间为设备分页列表，右侧为已选汇总清单。

---

## 完整复用代码块

> 以下为开箱即用的完整 HTML、Alpine.js 与 CSS 实现。可以直接复制到页面中使用。

```html
<!-- SASE 设备选择器容器 (Alpine.js 状态管理) -->
<div x-data="{
         // 弹窗显隐控制
         modalOpen: false,

         // 搜索和过滤
         searchKeyword: '',
         selectedSearchKeyword: '',
         currentPage: 1,

         // 待选区激活状态 (树节点高亮)
         activeGroupId: null,

         // 三套核心选中状态变量 (独立维护)
         selectedDevices: [], // 仅记录用户主动勾选的设备ID
         selectedGroups: [],  // 仅记录用户主动勾选的分组ID
         disabledGroups: [],  // 记录由于父级分组被选中而自动禁用的子分组ID

         // 树的展开状态 (默认展开 root 和 guangdong)
         expandedNodes: ['root', 'guangdong'],

         // 最终确认的结果
         confirmedResult: {
           deviceIds: [],
           groupIds: []
         },

         // 模拟数据：分组树
         groupTree: [
           {
             id: 'root', name: '全部设备', children: [
               { id: 'uncategorized', name: '未分类', isLeaf: true },
               { id: 'shanghai', name: '上海', isLeaf: true },
               {
                 id: 'guangdong', name: '广东', children: [
                   { id: 'guangzhou', name: '广州办事处', isLeaf: true },
                   { id: 'shenzhen', name: '深圳办事处', isLeaf: true },
                   { id: 'dongguan', name: '东莞办事处', isLeaf: true },
                 ]
               },
               { id: 'guangxi', name: '广西', isLeaf: true },
             ]
           }
         ],

         // 模拟数据：设备列表
         devices: [
           // 未分类
           { id: 'unc-1', name: 'unc-device-1', type: null, group: 'uncategorized', groupName: '未分类', status: 'online' },
           { id: 'unc-2', name: 'unc-device-2', type: '主', group: 'uncategorized', groupName: '未分类', status: 'online', masterId: 'unc-3' },
           { id: 'unc-3', name: 'unc-device-3', type: '备', group: 'uncategorized', groupName: '未分类', status: 'offline', masterId: 'unc-2' },
           { id: 'unc-4', name: 'unc-device-4', type: null, group: 'uncategorized', groupName: '未分类', status: 'pending' },
           { id: 'unc-5', name: 'unc-device-5', type: null, group: 'uncategorized', groupName: '未分类', status: 'fault' },
           { id: 'unc-6', name: 'unc-device-6', type: null, group: 'uncategorized', groupName: '未分类', status: 'online' },
           { id: 'unc-7', name: 'unc-device-7', type: null, group: 'uncategorized', groupName: '未分类', status: 'online' },
           { id: 'unc-8', name: 'unc-device-8', type: '主', group: 'uncategorized', groupName: '未分类', status: 'online', masterId: 'unc-9' },
           { id: 'unc-9', name: 'unc-device-9', type: '备', group: 'uncategorized', groupName: '未分类', status: 'offline', masterId: 'unc-8' },
           { id: 'unc-10', name: 'unc-device-10', type: null, group: 'uncategorized', groupName: '未分类', status: 'online' },
           // 上海
           { id: 'sh-1', name: 'sh-device-1', type: null, group: 'shanghai', groupName: '上海', status: 'online' },
           { id: 'sh-2', name: 'sh-device-2', type: '主', group: 'shanghai', groupName: '上海', status: 'online', masterId: 'sh-3' },
           { id: 'sh-3', name: 'sh-device-3', type: '备', group: 'shanghai', groupName: '上海', status: 'offline', masterId: 'sh-2' },
           { id: 'sh-4', name: 'sh-device-4', type: null, group: 'shanghai', groupName: '上海', status: 'pending' },
           { id: 'sh-5', name: 'sh-device-5', type: null, group: 'shanghai', groupName: '上海', status: 'online' },
           { id: 'sh-6', name: 'sh-device-6', type: null, group: 'shanghai', groupName: '上海', status: 'online' },
           { id: 'sh-7', name: 'sh-device-7', type: '主', group: 'shanghai', groupName: '上海', status: 'fault', masterId: 'sh-8' },
           { id: 'sh-8', name: 'sh-device-8', type: '备', group: 'shanghai', groupName: '上海', status: 'offline', masterId: 'sh-7' },
           { id: 'sh-9', name: 'sh-device-9', type: null, group: 'shanghai', groupName: '上海', status: 'online' },
           { id: 'sh-10', name: 'sh-device-10', type: null, group: 'shanghai', groupName: '上海', status: 'online' },
           // 广州办事处
           { id: 'gz-1', name: 'gz-device-1', type: '主', group: 'guangzhou', groupName: '广州办事处', status: 'online', masterId: 'gz-2' },
           { id: 'gz-2', name: 'gz-device-2', type: '备', group: 'guangzhou', groupName: '广州办事处', status: 'offline', masterId: 'gz-1' },
           { id: 'gz-3', name: 'gz-device-3', type: null, group: 'guangzhou', groupName: '广州办事处', status: 'online' },
           { id: 'gz-4', name: 'gz-device-4', type: null, group: 'guangzhou', groupName: '广州办事处', status: 'pending' },
           { id: 'gz-5', name: 'gz-device-5', type: '主', group: 'guangzhou', groupName: '广州办事处', status: 'online', masterId: 'gz-6' },
           { id: 'gz-6', name: 'gz-device-6', type: '备', group: 'guangzhou', groupName: '广州办事处', status: 'offline', masterId: 'gz-5' },
           { id: 'gz-7', name: 'gz-device-7', type: null, group: 'guangzhou', groupName: '广州办事处', status: 'online' },
           { id: 'gz-8', name: 'gz-device-8', type: null, group: 'guangzhou', groupName: '广州办事处', status: 'fault' },
           { id: 'gz-9', name: 'gz-device-9', type: null, group: 'guangzhou', groupName: '广州办事处', status: 'online' },
           { id: 'gz-10', name: 'gz-device-10', type: null, group: 'guangzhou', groupName: '广州办事处', status: 'online' },
           // 深圳办事处
           { id: 'sz-1', name: 'sz-device-1', type: null, group: 'shenzhen', groupName: '深圳办事处', status: 'online' },
           { id: 'sz-2', name: 'sz-device-2', type: '主', group: 'shenzhen', groupName: '深圳办事处', status: 'online', masterId: 'sz-3' },
           { id: 'sz-3', name: 'sz-device-3', type: '备', group: 'shenzhen', groupName: '深圳办事处', status: 'offline', masterId: 'sz-2' },
           { id: 'sz-4', name: 'sz-device-4', type: null, group: 'shenzhen', groupName: '深圳办事处', status: 'pending' },
           { id: 'sz-5', name: 'sz-device-5', type: null, group: 'shenzhen', groupName: '深圳办事处', status: 'online' },
           { id: 'sz-6', name: 'sz-device-6', type: null, group: 'shenzhen', groupName: '深圳办事处', status: 'online' },
           { id: 'sz-7', name: 'sz-device-7', type: '主', group: 'shenzhen', groupName: '深圳办事处', status: 'fault', masterId: 'sz-8' },
           { id: 'sz-8', name: 'sz-device-8', type: '备', group: 'shenzhen', groupName: '深圳办事处', status: 'offline', masterId: 'sz-7' },
           { id: 'sz-9', name: 'sz-device-9', type: null, group: 'shenzhen', groupName: '深圳办事处', status: 'online' },
           { id: 'sz-10', name: 'sz-device-10', type: null, group: 'shenzhen', groupName: '深圳办事处', status: 'online' },
           // 东莞办事处
           { id: 'dg-1', name: 'dg-device-1', type: null, group: 'dongguan', groupName: '东莞办事处', status: 'online' },
           { id: 'dg-2', name: 'dg-device-2', type: '主', group: 'dongguan', groupName: '东莞办事处', status: 'online', masterId: 'dg-3' },
           { id: 'dg-3', name: 'dg-device-3', type: '备', group: 'dongguan', groupName: '东莞办事处', status: 'offline', masterId: 'dg-2' },
           { id: 'dg-4', name: 'dg-device-4', type: null, group: 'dongguan', groupName: '东莞办事处', status: 'online' },
           { id: 'dg-5', name: 'dg-device-5', type: null, group: 'dongguan', groupName: '东莞办事处', status: 'pending' },
           { id: 'dg-6', name: 'dg-device-6', type: null, group: 'dongguan', groupName: '东莞办事处', status: 'online' },
           { id: 'dg-7', name: 'dg-device-7', type: '主', group: 'dongguan', groupName: '东莞办事处', status: 'online', masterId: 'dg-8' },
           { id: 'dg-8', name: 'dg-device-8', type: '备', group: 'dongguan', groupName: '东莞办事处', status: 'offline', masterId: 'dg-7' },
           { id: 'dg-9', name: 'dg-device-9', type: null, group: 'dongguan', groupName: '东莞办事处', status: 'online' },
           { id: 'dg-10', name: 'dg-device-10', type: null, group: 'dongguan', groupName: '东莞办事处', status: 'fault' },
           // 广西
           { id: 'gx-1', name: 'gx-device-1', type: '主', group: 'guangxi', groupName: '广西', status: 'online', masterId: 'gx-2' },
           { id: 'gx-2', name: 'gx-device-2', type: '备', group: 'guangxi', groupName: '广西', status: 'offline', masterId: 'gx-1' },
           { id: 'gx-3', name: 'gx-device-3', type: null, group: 'guangxi', groupName: '广西', status: 'online' },
           { id: 'gx-4', name: 'gx-device-4', type: null, group: 'guangxi', groupName: '广西', status: 'pending' },
           { id: 'gx-5', name: 'gx-device-5', type: null, group: 'guangxi', groupName: '广西', status: 'online' },
           { id: 'gx-6', name: 'gx-device-6', type: null, group: 'guangxi', groupName: '广西', status: 'online' },
           { id: 'gx-7', name: 'gx-device-7', type: '主', group: 'guangxi', groupName: '广西', status: 'fault', masterId: 'gx-8' },
           { id: 'gx-8', name: 'gx-device-8', type: '备', group: 'guangxi', groupName: '广西', status: 'offline', masterId: 'gx-7' },
           { id: 'gx-9', name: 'gx-device-9', type: null, group: 'guangxi', groupName: '广西', status: 'online' },
           { id: 'gx-10', name: 'gx-device-10', type: null, group: 'guangxi', groupName: '广西', status: 'online' },
         ],

         // 模拟数据：主备关联关系
         masterBackupMap: {
           'unc-2': 'unc-3', 'unc-3': 'unc-2',
           'unc-8': 'unc-9', 'unc-9': 'unc-8',
           'sh-2': 'sh-3', 'sh-3': 'sh-2',
           'sh-7': 'sh-8', 'sh-8': 'sh-7',
           'gz-1': 'gz-2', 'gz-2': 'gz-1',
           'gz-5': 'gz-6', 'gz-6': 'gz-5',
           'sz-2': 'sz-3', 'sz-3': 'sz-2',
           'sz-7': 'sz-8', 'sz-8': 'sz-7',
           'dg-2': 'dg-3', 'dg-3': 'dg-2',
           'dg-7': 'dg-8', 'dg-8': 'dg-7',
           'gx-1': 'gx-2', 'gx-2': 'gx-1',
           'gx-7': 'gx-8', 'gx-8': 'gx-7',
         },

         // ===== 辅助计算函数 (Alpine.js 兼容) =====
         
         // 查找树中的节点
         findTreeNode(nodes, id) {
           for (const node of nodes) {
             if (node.id === id) return node;
             if (node.children) {
               const found = this.findTreeNode(node.children, id);
               if (found) return found;
             }
           }
           return null;
         },

         // 检查分组是否被选中
         isGroupChecked(groupId) {
           return this.selectedGroups.includes(groupId);
         },

         // 检查分组是否被级联禁用
         isGroupDisabled(groupId) {
           if (groupId === 'root') return false;
           const ancestors = this.getAncestorGroupIds(groupId);
           return ancestors.some(a => this.selectedGroups.includes(a));
         },

         // 检查分组是否处于半选 (部分选中) 状态 (无联动，始终返回 false)
         isGroupIndeterminate(groupId) {
           return false;
         },

         // 获取当前分组下的所有设备 ID
         getAllDevicesInGroup(groupId) {
           return this.devices.filter(d => d.group === groupId).map(d => d.id);
         },

         // 获取某分组的所有后代分组 ID
         getDescendantGroupIds(groupId) {
           const node = this.findTreeNode(this.groupTree, groupId);
           if (!node || !node.children) return [];
           const ids = [];
           const walk = (n) => {
             ids.push(n.id);
             if (n.children) n.children.forEach(walk);
           };
           node.children.forEach(walk);
           return ids;
         },

         // 获取某分组的所有祖先分组 ID
         getAncestorGroupIds(groupId) {
           const ancestors = [];
           const walk = (nodes, target) => {
             for (const node of nodes) {
               if (node.id === target) return true;
               if (node.children && walk(node.children, target)) {
                 ancestors.push(node.id);
                 return true;
               }
             }
             return false;
           };
           walk(this.groupTree, groupId);
           return ancestors;
         },

         // 检查设备是否因其父级分组选中而自动禁用
         isDeviceDisabledByGroup(device) {
           if (this.selectedGroups.includes(device.group)) return true;
           const ancestors = this.getAncestorGroupIds(device.group);
           return ancestors.some(a => this.selectedGroups.includes(a));
         },

         // 检查设备是否被选中 (包含个体勾选 + 分组勾选，且在 Alpine.js 中实现完全响应式)
         isDeviceChecked(deviceId) {
           if (this.selectedDevices.includes(deviceId)) return true;
           const device = this.devices.find(d => d.id === deviceId);
           if (!device) return false;
           if (this.selectedGroups.includes(device.group)) return true;
           const ancestors = this.getAncestorGroupIds(device.group);
           return ancestors.some(a => this.selectedGroups.includes(a));
         },


         // 检查表头全选框是否半选
         isHeaderIndeterminate() {
           const allIds = this.devices.map(d => d.id);
           if (allIds.length === 0) return false;
           const checkedCount = allIds.filter(id => this.isDeviceChecked(id)).length;
           return checkedCount > 0 && checkedCount < allIds.length;
         },

         // 计算实际生效的选中设备ID集合（个体选中 + 分组选中）
         getEffectiveSelectedDeviceIds() {
           const ids = new Set(this.selectedDevices);
           this.selectedGroups.forEach(gid => {
             this.getAllDevicesInGroup(gid).forEach(id => ids.add(id));
             this.getDescendantGroupIds(gid).forEach(did => {
               this.getAllDevicesInGroup(did).forEach(id => ids.add(id));
             });
           });
           return ids;
         },

         // 待选区设备列表的搜索过滤 (包含主备联动)
         getFilteredDevices() {
           let result = this.devices;

           // 1. 左树选中过滤
           if (this.activeGroupId) {
             const groupAndDescendants = new Set();
             groupAndDescendants.add(this.activeGroupId);
             this.getDescendantGroupIds(this.activeGroupId).forEach(id => groupAndDescendants.add(id));
             result = result.filter(d => groupAndDescendants.has(d.group));
           }

           // 2. 搜索框关键词过滤
           if (!this.searchKeyword.trim()) return result;
           const kw = this.searchKeyword.toLowerCase();
           const matched = new Set();
           result.forEach(d => {
             if (d.name.toLowerCase().includes(kw) || d.groupName.toLowerCase().includes(kw)) {
               matched.add(d.id);
               // 主备设备搜索联动：显示关联设备
               const linked = this.masterBackupMap[d.id];
               if (linked) matched.add(linked);
             }
           });
           return result.filter(d => matched.has(d.id));
         },

         // 获取搜索时匹配的分组ID集合
         getSearchMatchedGroupIds() {
           if (!this.searchKeyword.trim()) return null;
           const groupIds = new Set();
           this.getFilteredDevices().forEach(d => {
             groupIds.add(d.group);
             this.getAncestorGroupIds(d.group).forEach(a => groupIds.add(a));
           });
           return groupIds;
         },

         // 当前展开的分组ID集合
         getEffectiveExpandedNodes() {
           const matched = this.getSearchMatchedGroupIds();
           if (!matched) return this.expandedNodes;
           // 搜索时强制展开到匹配的分组
           const nodes = new Set(['root']);
           matched.forEach(gid => {
             nodes.add(gid);
             this.getAncestorGroupIds(gid).forEach(a => nodes.add(a));
           });
           return Array.from(nodes);
         },

         // 将过滤后的设备按主备关系分组
         getFilteredRowGroups() {
           const filtered = this.getFilteredDevices();
           const result = [];
           const processed = new Set();

           for (const device of filtered) {
             if (processed.has(device.id)) continue;

             const linkedId = this.masterBackupMap[device.id];
             if (linkedId) {
               const partner = filtered.find(d => d.id === linkedId);
               if (partner && !processed.has(partner.id)) {
                 if (device.type === '备') {
                   result.push({ key: partner.id, devices: [partner, device] });
                 } else {
                   result.push({ key: device.id, devices: [device, partner] });
                 }
                 processed.add(device.id);
                 processed.add(partner.id);
               } else {
                 result.push({ key: device.id, devices: [device] });
                 processed.add(device.id);
               }
             } else {
               result.push({ key: device.id, devices: [device] });
               processed.add(device.id);
             }
           }
           return result;
         },

         // 计算总页数
         getTotalPages() {
           const rowGroups = this.getFilteredRowGroups();
           return Math.max(1, Math.ceil(rowGroups.length / 10));
         },

         // 扁平化展示的分页后设备
         getPagedDevices() {
           const rowGroups = this.getFilteredRowGroups();
           const totalPages = this.getTotalPages();
           const safePage = Math.min(this.currentPage, totalPages);
           const start = (safePage - 1) * 10;
           const pagedGroups = rowGroups.slice(start, start + 10);
           return pagedGroups.flatMap(g => g.devices);
         },

         // 页码控制
         getPageNumbers() {
           const total = this.getTotalPages();
           const safePage = Math.min(this.currentPage, total);
           const pages = [];
           if (total <= 7) {
             for (let i = 1; i <= total; i++) pages.push(i);
           } else {
             pages.push(1);
             if (safePage > 4) pages.push('ellipsis');
             const start = Math.max(2, safePage - 1);
             const end = Math.min(total - 1, safePage + 1);
             for (let i = start; i <= end; i++) pages.push(i);
             if (safePage < total - 3) pages.push('ellipsis');
             pages.push(total);
           }
           return pages;
         },

         // 获取扁平化后待选的分组树（过滤和层级展开计算）
         getFlattenedTree() {
           const result = [];
           const matchedGroupIds = this.getSearchMatchedGroupIds();
           const expanded = this.getEffectiveExpandedNodes();

           const walk = (nodes, depth = 0, parentLines = []) => {
             nodes.forEach((node, index) => {
               const isLast = index === nodes.length - 1;
               const hasChildren = node.children && node.children.length > 0;
               const isLeaf = node.isLeaf || !hasChildren;

               if (matchedGroupIds && !matchedGroupIds.has(node.id)) {
                 return;
               }

               result.push({
                 id: node.id,
                 name: node.name,
                 depth: depth,
                 isLast: isLast,
                 isLeaf: isLeaf,
                 hasChildren: hasChildren,
                 parentLines: [...parentLines],
                 node: node
               });

               if (hasChildren && expanded.includes(node.id)) {
                 walk(node.children, depth + 1, [...parentLines, !isLast]);
               }
             });
           };

           walk(this.groupTree);
           return result;
         },

         // 已选列表中的个体设备 (按主备排序)
         getOrderedSelectedDevices() {
           const effectiveSelected = this.getEffectiveSelectedDeviceIds();
           const selectedDevs = this.devices.filter(d => this.selectedDevices.includes(d.id) && !this.isDeviceDisabledByGroup(d));
           
           // 已选搜索过滤
           let filtered = selectedDevs;
           if (this.selectedSearchKeyword.trim()) {
             const kw = this.selectedSearchKeyword.toLowerCase();
             filtered = filtered.filter(d => d.name.toLowerCase().includes(kw) || d.groupName.toLowerCase().includes(kw));
           }

           const result = [];
           const processed = new Set();
           for (const device of filtered) {
             if (processed.has(device.id)) continue;
             if (device.type === '主') {
               result.push(device);
               processed.add(device.id);
               const backupId = this.masterBackupMap[device.id];
               if (backupId) {
                 const backup = filtered.find(d => d.id === backupId);
                 if (backup) {
                   result.push(backup);
                   processed.add(backup.id);
                 }
               }
             } else if (device.type === '备') {
               const masterId = device.masterId;
               const master = masterId ? filtered.find(d => d.id === masterId) : null;
               if (!master) {
                 result.push(device);
                 processed.add(device.id);
               }
             } else {
               result.push(device);
               processed.add(device.id);
             }
           }
           return result;
         },

         // 已选列表中的分组条目
         getSelectedGroupEntries() {
           const groups = this.selectedGroups.map(gid => {
             const node = this.findTreeNode(this.groupTree, gid);
             const name = gid === 'root' ? '全部设备' : (node ? node.name : gid);
             const ancestorIds = this.getAncestorGroupIds(gid);
             let parentPath = '';
             if (ancestorIds.length > 0) {
               parentPath = '/' + ancestorIds.map(aid => {
                 if (aid === 'root') return '全部设备';
                 const n = this.findTreeNode(this.groupTree, aid);
                 return n ? n.name : aid;
               }).reverse().join('/');
             } else {
               parentPath = gid === 'root' ? '' : '/';
             }
             return { id: gid, name, parentPath };
           });

           // 已选搜索过滤
           if (this.selectedSearchKeyword.trim()) {
             const kw = this.selectedSearchKeyword.toLowerCase();
             return groups.filter(g => g.name.toLowerCase().includes(kw));
           }
           return groups;
         },

         // 计算已选总数
         getSelectedCount() {
           const individualCount = this.devices.filter(d => this.selectedDevices.includes(d.id) && !this.isDeviceDisabledByGroup(d)).length;
           return this.selectedGroups.length + individualCount;
         },

         // ===== 交互处理方法 =====

         // 展开/收起左树节点 (响应式更新)
         toggleExpand(nodeId) {
           const idx = this.expandedNodes.indexOf(nodeId);
           if (idx !== -1) {
             this.expandedNodes = this.expandedNodes.filter(id => id !== nodeId);
           } else {
             this.expandedNodes = [...this.expandedNodes, nodeId];
           }
         },

         // 待选区表格全选状态
         isAllSelected() {
           const allIds = this.devices.map(d => d.id);
           return allIds.length > 0 && allIds.every(id => this.isDeviceChecked(id));
         },

         // 待选区表格切换全选
         toggleSelectAll() {
           const allDevIds = this.devices.map(d => d.id);
           if (this.isAllSelected()) {
             this.selectedDevices = [];
             this.selectedGroups = [];
             this.disabledGroups = [];
           } else {
             this.selectedDevices = [...allDevIds];
             this.selectedGroups = [];
             this.disabledGroups = [];
           }
         },

         // 单选/反选设备 (主备联动)
         toggleDevice(deviceId) {
           const device = this.devices.find(d => d.id === deviceId);
           if (!device || this.isDeviceDisabledByGroup(device)) return;

           const idx = this.selectedDevices.indexOf(deviceId);
           const linkedId = this.masterBackupMap[deviceId];

           if (idx !== -1) {
             // 移除
             this.selectedDevices = this.selectedDevices.filter(id => id !== deviceId);
             if (linkedId) {
               this.selectedDevices = this.selectedDevices.filter(id => id !== linkedId);
             }
           } else {
             // 勾选 (使用重新赋值数组方式确保 Alpine.js 触发模板反应)
             this.selectedDevices = [...this.selectedDevices, deviceId];
             if (linkedId && !this.selectedDevices.includes(linkedId)) {
               this.selectedDevices = [...this.selectedDevices, linkedId];
             }
           }
         },

         // 勾选/反选分组 (无联动，仅在勾选时清除自身及后代分组下可能多余勾选的个体设备)
         toggleGroup(groupId) {
           const idx = this.selectedGroups.indexOf(groupId);
           const descendantIds = this.getDescendantGroupIds(groupId);
           
           // 获取该分组及后代分组下的所有设备 ID
           const allDeviceIds = [];
           this.getAllDevicesInGroup(groupId).forEach(id => allDeviceIds.push(id));
           descendantIds.forEach(did => {
             this.getAllDevicesInGroup(did).forEach(id => allDeviceIds.push(id));
           });

           if (idx !== -1) {
             // 取消勾选
             this.selectedGroups = this.selectedGroups.filter(id => id !== groupId);
             // 移除该分组及所有后代分组下的所有设备个体勾选
             this.selectedDevices = this.selectedDevices.filter(id => !allDeviceIds.includes(id));
           } else {
             // 勾选
             this.selectedGroups = [...this.selectedGroups, groupId];
             // 移除该分组及所有后代分组下的所有设备个体勾选，因为已被包含
             this.selectedDevices = this.selectedDevices.filter(id => !allDeviceIds.includes(id));
           }
         },

         // 在已选区域点击删除 (同步清理子设备)
         removeSelected(id, type) {
           if (type === 'group') {
             this.selectedGroups = this.selectedGroups.filter(gid => gid !== id);
             const descendantIds = this.getDescendantGroupIds(id);
             const allDeviceIds = [];
             this.getAllDevicesInGroup(id).forEach(did => allDeviceIds.push(did));
             descendantIds.forEach(did => {
               this.getAllDevicesInGroup(did).forEach(did => allDeviceIds.push(did));
             });
             this.selectedDevices = this.selectedDevices.filter(did => !allDeviceIds.includes(did));
           } else {
             this.selectedDevices = this.selectedDevices.filter(did => did !== id);
             const linked = this.masterBackupMap[id];
             if (linked) {
               this.selectedDevices = this.selectedDevices.filter(did => did !== linked);
             }
           }
         },

         // 清空所有选择
         clearAll() {
           this.selectedDevices = [];
           this.selectedGroups = [];
           this.disabledGroups = [];
         },

         // 确定确认
         handleConfirm() {
           this.confirmedResult.deviceIds = [...this.getEffectiveSelectedDeviceIds()];
           this.confirmedResult.groupIds = [...this.selectedGroups];
           this.modalOpen = false;
         },

         // 取消并还原状态
         handleCancel() {
           this.selectedGroups = [...this.confirmedResult.groupIds];
           this.disabledGroups = [];

           const confirmedDevicesSet = new Set(this.confirmedResult.deviceIds);
           const tempDevices = [];
           confirmedDevicesSet.forEach(id => {
             const d = this.devices.find(dev => dev.id === id);
             if (d && !this.isDeviceDisabledByGroup(d)) {
               tempDevices.push(id);
             }
           });
           this.selectedDevices = tempDevices;
           this.modalOpen = false;
         },

         getDisplayText() {
           const items = [];
           this.confirmedResult.groupIds.forEach(gid => {
             const group = this.findTreeNode(this.groupTree, gid);
             if (group) items.push(group.name);
           });
           this.confirmedResult.deviceIds.forEach(did => {
             const device = this.devices.find(d => d.id === did);
             // 如果其父级分组已经显示在列表中，则不再重复显示设备名称
             if (device && !this.confirmedResult.groupIds.includes(device.group)) {
               const ancestors = this.getAncestorGroupIds(device.group);
               const isParentGroupSelected = ancestors.some(a => this.confirmedResult.groupIds.includes(a));
               if (!isParentGroupSelected) {
                 items.push(device.name);
               }
             }
           });

           if (items.length === 0) return '';
           if (items.length <= 3) return items.join(', ');
           return items.slice(0, 3).join(', ') + '...等' + items.length + '项';
         }
       }">

    <!-- ===== 主页面布局 ===== -->
    <div class="flex-1 flex flex-col h-full overflow-hidden p-6 max-w-[800px] mx-auto justify-center">

      <!-- 页面介绍与 Tips -->
      <div class="mb-6">
        <h3 class="text-[16px] leading-[24px] text-[#2F3540] font-semibold">设备多选-基础版 (还原预览)</h3>
        <p class="text-[12px] leading-[20px] text-[#6F7785] mt-1">这是为了给您预览设备多选弹窗的基础版还原效果。点击下方配置输入框即可弹出设备多选窗口。</p>

        <div class="mt-4 bg-[#EDF1F7] rounded-[2px] px-3 py-3 border-l-4 border-[#1C6EFF]">
          <span class="text-[12px] leading-[20px] text-[#2F3540] font-semibold">体验要点：</span>
          <div class="mt-1 space-y-1 text-[12px] leading-[20px] text-[#6F7785]">
            <p>1. <strong>直接勾选</strong>：可在表格中勾选单个设备，也可在左树上直接勾选分组。</p>
            <p>2. <strong>禁用继承</strong>：当勾选了某一父级分组后，其底下的子分组及对应设备会被自动禁用且视为默认选中，提示“该对象所属的父级已被选中，无需单独选择”。</p>
            <p>3.
              <strong>主备联动</strong>：本设备数据包含主/备（Master/Backup）状态设备。勾选主备关系中的任意一台，其关联的另外一台会同步勾选。在分页和已选展示中，备设备会自动缩进并紧跟在主设备下方显示。
            </p>
          </div>
        </div>
      </div>

      <!-- 表单配置框区 -->
      <div class="border border-[#D3D7DE] rounded-container p-6 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div class="flex items-center gap-4">
          <span
            class="text-xs text-[#6F7785] w-[72px] text-left font-normal flex-shrink-0">选择设备</span>

          <!-- 点击触发弹窗的选择框 (高 32px) -->
          <div
            class="flex items-center justify-between h-[32px] px-3 border border-[#D3D7DE] rounded-[2px] bg-white cursor-pointer hover:border-[#1C6EFF] transition-colors group flex-1 min-w-0"
            @click="modalOpen = true">
            <!-- 未选中文本 -->
            <template x-if="getDisplayText() === ''">
              <span class="text-xs text-[#A1A7B3]">请选择</span>
            </template>
            <!-- 已选中文本 -->
            <template x-if="getDisplayText() !== ''">
              <span class="text-[12px] leading-[20px] text-[#2F3540] truncate flex-1 min-w-0"
                x-text="getDisplayText()"></span>
            </template>

            <!-- 列表图标 -->
            <svg class="w-4 h-4 text-[#6F7785] group-hover:text-[#1C6EFF] transition-colors flex-shrink-0 ml-2"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </div>
        </div>
      </div>

    </div>

    <!-- ===== 弹窗模态框 (遮罩层 45%) ===== -->
    <div class="fixed inset-0 bg-[rgba(30,35,43,0.45)] z-[1000] flex items-center justify-center" x-show="modalOpen"
      x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0"
      x-transition:enter-end="opacity-100" x-transition:leave="transition ease-in duration-150"
      x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0" style="display: none;">

      <!-- 弹窗容器 (宽度 1200px, 高度 640px) -->
      <div
        class="w-[1200px] h-[640px] bg-white rounded-container shadow-[0_4px_16px_rgba(30,35,43,0.14)] flex flex-col overflow-hidden"
        @click.away="handleCancel()">

        <!-- ===== 标题栏 (48px) ===== -->
        <div class="flex items-center justify-between px-4 h-[48px] shrink-0">
          <span class="text-[16px] font-semibold text-[#2F3540] m-0 leading-none">选择设备</span>
          <button
            class="w-6 h-6 flex items-center justify-center rounded-[2px] text-[#6F7785] hover:bg-[#EDF1F7] hover:text-[#2F3540] transition-colors"
            @click="handleCancel()">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- ===== 弹窗主体 ===== -->
        <div class="flex flex-1 min-h-0 gap-2 px-4">

          <!-- ===== 左侧：待选区 ===== -->
          <div class="flex-1 flex flex-col border border-[#D3D7DE] rounded-[2px] overflow-hidden">
            <div class="flex items-center px-3 h-[40px] shrink-0">
              <span class="text-[12px] font-semibold text-[#2F3540] leading-[20px]">待选</span>
            </div>

            <!-- 搜索框 -->
            <div class="px-3 pb-3 shrink-0">
              <div class="relative">
                <input type="text" placeholder="搜索设备名称/分组" x-model="searchKeyword" @input="currentPage = 1"
                  class="w-full h-[32px] pl-3 pr-9 text-[12px] leading-[20px] bg-white border border-[#D3D7DE] rounded-[2px] focus:border-[#1C6EFF] outline-none placeholder:text-[#A1A7B3] transition-colors text-[#2F3540]" />
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A7B3]">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
              </div>
            </div>

            <!-- 左树 + 右表 -->
            <div class="flex flex-1 min-h-0 border-t border-[#E1E5EB] overflow-hidden">

              <!-- 左侧分组树 (260px) -->
              <div class="w-[260px] shrink-0 border-r border-[#E1E5EB] flex flex-col bg-white">
                <div class="flex-1 overflow-y-auto custom-scrollbar py-1">

                  <template x-for="item in getFlattenedTree()" :key="item.id">
                    <div class="flex items-center h-[32px] cursor-pointer relative"
                      :class="isGroupDisabled(item.id) ? 'opacity-40 pointer-events-none' : 'hover:bg-[#F7F9FC]'"
                      :style="activeGroupId === item.id || selectedGroups.includes(item.id) ? 'background-color: #E8F4FF;' : ''"
                      @click="if(!isGroupDisabled(item.id)) activeGroupId = (activeGroupId === item.id ? null : item.id)">

                      <!-- 选中态左侧3px蓝色竖条 -->
                      <template x-if="activeGroupId === item.id || selectedGroups.includes(item.id)">
                        <span class="absolute left-0 top-0 bottom-0 w-[3px] rounded-r bg-[#1C6EFF] z-10"></span>
                      </template>

                      <!-- 树连线渲染 -->
                      <span class="flex shrink-0 items-start" :style="'width: ' + (item.depth * 24) + 'px'">
                        <template x-for="showLine in item.parentLines">
                          <span class="relative shrink-0" style="width: 24px; height: 32px;">
                            <span x-show="showLine" class="absolute w-px bg-[#E1E5EB]" style="left: 12px; top: 0; bottom: 0;"></span>
                          </span>
                        </template>
                        <template x-if="item.depth > 0">
                          <span class="relative shrink-0" style="width: 24px; height: 32px;">
                            <span class="absolute w-px bg-[#E1E5EB]" :style="'left: 12px; top: 0; height: ' + (item.isLast ? '16px' : '100%')"></span>
                            <span class="absolute h-px bg-[#E1E5EB]" style="left: 12px; top: 16px; width: 12px;"></span>
                          </span>
                        </template>
                      </span>

                      <!-- 展开/收起按钮 (+/-方形按钮) -->
                      <span class="w-5 h-5 flex items-center justify-center shrink-0 z-10" @click.stop="if(item.hasChildren && !isGroupDisabled(item.id)) toggleExpand(item.id)">
                        <template x-if="item.hasChildren">
                          <div class="w-4 h-4 flex items-center justify-center rounded-control border border-[#D3D7DE] select-none cursor-pointer"
                               :style="item.id === 'root' ? 'background-color: #F7F9FC;' : 'background-color: white;'">
                            <template x-if="getEffectiveExpandedNodes().includes(item.id)">
                              <!-- 减号 -->
                              <svg class="w-2.5 h-2.5 text-[#454C59]" viewBox="0 0 10 10" fill="none">
                                <path d="M1.5 5H8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                              </svg>
                            </template>
                            <template x-if="!getEffectiveExpandedNodes().includes(item.id)">
                              <!-- 加号 -->
                              <svg class="w-2.5 h-2.5 text-[#454C59]" viewBox="0 0 10 10" fill="none">
                                <path d="M1.5 5H8.5M5 1.5V8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                              </svg>
                            </template>
                          </div>
                        </template>
                        <template x-if="!item.hasChildren">
                          <span class="w-1 h-1 rounded-full bg-[#E1E5EB]"></span>
                        </template>
                      </span>

                      <!-- 复选框 -->
                      <div class="shrink-0 mr-1.5 z-10" @click.stop>
                        <template x-if="isGroupDisabled(item.id)">
                          <div class="relative group/tooltip pointer-events-auto">
                            <div class="w-3.5 h-3.5 border border-[#D3D7DE] bg-[#E1E5EB] rounded-control flex items-center justify-center cursor-not-allowed"></div>
                            
                            <!-- 悬浮 Tooltip 容器 -->
                            <div class="tooltip-panel absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden bg-[#2F3540] text-white text-[10px] rounded-[2px] px-2 py-1 whitespace-nowrap z-50 shadow-md">
                              该对象所属的父级已被选中，无需单独选择
                            </div>
                          </div>
                        </template>

                        <template x-if="!isGroupDisabled(item.id)">
                          <div class="w-3.5 h-3.5 border rounded-control flex items-center justify-center cursor-pointer transition-colors"
                               :class="selectedGroups.includes(item.id) ? 'bg-[#1C6EFF] border-[#1C6EFF]' : 'border-[#D3D7DE] bg-white hover:border-[#1C6EFF]'"
                               @click="toggleGroup(item.id)">
                            <template x-if="selectedGroups.includes(item.id)">
                              <svg class="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </template>
                          </div>
                        </template>
                      </div>

                      <!-- 文件夹图标 -->
                      <svg class="w-4 h-4 shrink-0 mr-1.5 z-10" viewBox="0 0 16 16" fill="none">
                        <path d="M1.5 3.5C1.5 2.67 2.17 2 3 2H6L7.5 3.5H13C13.83 3.5 14.5 4.17 14.5 5V12.5C14.5 13.33 13.83 14 13 14H3C2.17 14 1.5 13.33 1.5 12.5V3.5Z" fill="#FDAA1D" />
                        <path d="M1.5 5.5H14.5V12.5C14.5 13.33 13.83 14 13 14H3C2.17 14 1.5 13.33 1.5 12.5V5.5Z" fill="#FFC24B" />
                      </svg>

                      <!-- 分组名称 -->
                      <span class="text-xs leading-[20px] truncate flex-1 min-w-0 z-10"
                        :style="isGroupDisabled(item.id) ? 'color: #BEC3CC;' : 'color: #2F3540;'"
                        x-text="item.name"></span>
                    </div>
                  </template>

                </div>
              </div>

              <!-- 右侧设备表格 -->
              <div class="flex-1 min-w-0 flex flex-col bg-white">
                <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar">

                  <!-- 表头 -->
                  <div
                    class="flex items-center h-[32px] bg-[#EDF1F7] border-b border-[#E1E5EB] sticky top-0 z-10 select-none">
                    <div class="w-[40px] shrink-0 flex items-center justify-center relative">
                      <div
                        class="w-3.5 h-3.5 border rounded-[2px] flex items-center justify-center cursor-pointer transition-colors hover:border-[#1C6EFF]"
                        :class="isAllSelected() || isHeaderIndeterminate() ? 'bg-[#1C6EFF] border-[#1C6EFF]' : 'border-[#D3D7DE] bg-white'"
                        @click="toggleSelectAll()">
                        <template x-if="isAllSelected()">
                          <svg class="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </template>
                        <template x-if="!isAllSelected() && isHeaderIndeterminate()">
                          <svg class="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </template>
                      </div>
                      <span class="absolute right-0 top-1/2 -translate-y-1/2 w-px h-[16px] bg-[#E1E5EB]"></span>
                    </div>

                    <div class="w-[200px] shrink-0 flex items-center px-3 relative">
                      <span class="text-[12px] leading-[20px] text-[#454C59] font-normal truncate">设备名称</span>
                      <span class="absolute right-0 top-1/2 -translate-y-1/2 w-px h-[16px] bg-[#E1E5EB]"></span>
                    </div>

                    <div class="w-[90px] shrink-0 flex items-center px-3 relative">
                      <span class="text-[12px] leading-[20px] text-[#454C59] font-normal truncate">接入状态</span>
                      <span class="absolute right-0 top-1/2 -translate-y-1/2 w-px h-[16px] bg-[#E1E5EB]"></span>
                    </div>

                    <div class="flex-1 flex items-center px-3">
                      <span class="text-[12px] leading-[20px] text-[#454C59] font-normal truncate">所属分组</span>
                    </div>
                  </div>

                  <!-- 表格列表内容 -->
                  <div class="min-h-[200px]">
                    <template x-if="getFilteredDevices().length === 0">
                      <div class="flex flex-col items-center justify-center py-16">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" class="mb-3">
                          <rect x="16" y="18" width="32" height="28" rx="2" fill="#EDF1F7" stroke="#D3D7DE"
                            stroke-width="1.5" />
                          <rect x="24" y="46" width="16" height="3" rx="1" fill="#D3D7DE" />
                          <rect x="20" y="49" width="24" height="2" rx="1" fill="#E1E5EB" />
                          <circle cx="32" cy="32" r="6" fill="white" stroke="#D3D7DE" stroke-width="1.5" />
                          <path d="M30 32L31.5 33.5L34 30.5" stroke="#B0B5BD" stroke-width="1.2" stroke-linecap="round"
                            stroke-linejoin="round" />
                        </svg>
                        <div class="text-[12px] leading-[20px] text-[#6F7785]">暂无设备数据</div>
                      </div>
                    </template>

                    <template x-for="device in getPagedDevices()" :key="device.id">
                      <div class="flex items-center h-[40px] border-b border-[#E1E5EB] transition-colors"
                        :style="isDeviceDisabledByGroup(device) ? 'opacity: 0.4; background-color: transparent;' : (isDeviceChecked(device.id) ? 'background-color: #E8F4FF;' : '')"
                        :class="!isDeviceDisabledByGroup(device) && 'hover:bg-[#F7F9FC]'">

                        <!-- Checkbox -->
                        <div class="w-[40px] shrink-0 flex items-center justify-center">
                          <template x-if="isDeviceDisabledByGroup(device)">
                            <!-- 禁用 Tooltip 提示结构 -->
                            <div class="relative group/tooltip">
                              <div
                                class="w-3.5 h-3.5 border border-[#D3D7DE] bg-[#EDF1F7] rounded-[2px] flex items-center justify-center cursor-not-allowed">
                                <svg class="w-2.5 h-2.5 text-[#6F7785]" viewBox="0 0 24 24" fill="none"
                                  stroke="currentColor" stroke-width="3.5" stroke-linecap="round"
                                  stroke-linejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>

                              <!-- 模拟 Tooltip -->
                              <div
                                class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/tooltip:block bg-[#2F3540] text-white text-[10px] rounded-[2px] px-2 py-1 whitespace-nowrap z-50">
                                该对象所属的父级已被选中，无需单独选择
                              </div>
                            </div>
                          </template>

                          <template x-if="!isDeviceDisabledByGroup(device)">
                            <div
                              class="w-3.5 h-3.5 border rounded-[2px] flex items-center justify-center cursor-pointer transition-colors hover:border-[#1C6EFF]"
                              :class="isDeviceChecked(device.id) ? 'bg-[#1C6EFF] border-[#1C6EFF]' : 'border-[#D3D7DE] bg-white'"
                              @click="toggleDevice(device.id)">
                              <template x-if="isDeviceChecked(device.id)">
                                <svg class="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none"
                                  stroke="currentColor" stroke-width="3.5" stroke-linecap="round"
                                  stroke-linejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </template>
                            </div>
                          </template>
                        </div>

                        <!-- 设备名称 (带主备缩进和标签) -->
                        <div class="w-[200px] shrink-0 flex items-center gap-2 px-3">
                          <!-- 备设备缩进连线 -->
                          <template x-if="device.type === '备'">
                            <span class="relative shrink-0" style="width: 12px; height: 40px;">
                              <span class="absolute w-px bg-[#8F959E]" style="left: 0; top: 0; height: 50%;"></span>
                              <span class="absolute h-px bg-[#8F959E]" style="left: 0; top: 50%; width: 12px;"></span>
                            </span>
                          </template>

                          <!-- 网关图标 -->
                          <svg class="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
                            <rect x="2" y="4" width="12" height="8" rx="1.5" fill="#1C6EFF" />
                            <circle cx="5" cy="8" r="1.2" fill="white" />
                            <circle cx="8" cy="8" r="1.2" fill="white" />
                            <circle cx="11" cy="8" r="1.2" fill="white" />
                            <path d="M5 3V4" stroke="#1C6EFF" stroke-width="1.2" stroke-linecap="round" />
                            <path d="M8 3V4" stroke="#1C6EFF" stroke-width="1.2" stroke-linecap="round" />
                            <path d="M11 3V4" stroke="#1C6EFF" stroke-width="1.2" stroke-linecap="round" />
                          </svg>

                          <!-- 主备标签 -->
                          <template x-if="device.type">
                            <span
                              class="inline-flex items-center justify-center h-[18px] px-1 text-[10px] font-medium leading-none rounded-[2px] shrink-0"
                              :style="device.type === '主' ? 'color: #1C6EFF; background-color: #E8F4FF;' : 'color: #6F7785; background-color: #EDF1F7;'"
                              x-text="device.type"></span>
                          </template>

                          <!-- 名称 -->
                          <span class="text-[12px] leading-[20px] text-[#2F3540] truncate" x-text="device.name"></span>
                        </div>

                        <!-- 接入状态 -->
                        <div class="w-[90px] shrink-0 px-3">
                          <span
                            class="inline-flex items-center h-[20px] px-1.5 text-[12px] leading-[20px] rounded-[2px] border"
                            :style="{
                                  online: 'color: #12A679; background-color: #E6F7F0; border-color: #E6F7F0;',
                                  offline: 'color: #6F7785; background-color: #EDF1F7; border-color: #EDF1F7;',
                                  pending: 'color: #FDAA1D; background-color: #FFF5E0; border-color: #FFF5E0;',
                                  fault: 'color: #CF171D; background-color: #FCE8E8; border-color: #FCE8E8;'
                                }[device.status] || 'color: #6F7785; background-color: #EDF1F7; border-color: #EDF1F7;'">
                            <span class="w-1.5 h-1.5 rounded-full mr-1 shrink-0" :style="{
                                    online: 'background-color: #12A679;',
                                    offline: 'background-color: #6F7785;',
                                    pending: 'background-color: #FDAA1D;',
                                    fault: 'background-color: #CF171D;'
                                  }[device.status] || 'background-color: #6F7785;'"></span>
                            <span
                              x-text="{ online: '在线', offline: '离线', pending: '待接入', fault: '故障' }[device.status] || '未知'"></span>
                          </span>
                        </div>

                        <!-- 所属分组 -->
                        <div class="flex-1 px-3 text-[12px] leading-[20px] text-[#6F7785] truncate"
                          x-text="device.groupName"></div>

                      </div>
                    </template>
                  </div>

                </div>

                <!-- 分页控制栏 (40px) -->
                <div
                  class="flex items-center justify-between px-3 h-[40px] border-t border-[#E1E5EB] shrink-0 bg-white select-none">
                  <span class="text-[12px] leading-[20px] text-[#6F7785]">
                    共 <span x-text="getFilteredDevices().length"></span> 项
                  </span>

                  <div class="flex items-center gap-0.5">
                    <button
                      class="w-6 h-6 flex items-center justify-center text-[#6F7785] hover:text-[#2F3540] disabled:text-[#D3D7DE] disabled:cursor-not-allowed rounded-[2px]"
                      :disabled="currentPage <= 1" @click="currentPage = Math.max(1, currentPage - 1)">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>

                    <template x-for="p in getPageNumbers()">
                      <div>
                        <template x-if="p === 'ellipsis'">
                          <span
                            class="w-6 h-6 flex items-center justify-center text-[12px] leading-none text-[#6F7785]">...</span>
                        </template>
                        <template x-if="p !== 'ellipsis'">
                          <button
                            class="w-6 h-6 flex items-center justify-center rounded-full text-[12px] leading-none transition-colors"
                            :style="p === currentPage ? 'background-color: #1C6EFF; color: #fff;' : 'color: #2F3540;'"
                            @click="currentPage = p" x-text="p"></button>
                        </template>
                      </div>
                    </template>

                    <button
                      class="w-6 h-6 flex items-center justify-center text-[#6F7785] hover:text-[#2F3540] disabled:text-[#D3D7DE] disabled:cursor-not-allowed rounded-[2px]"
                      :disabled="currentPage >= getTotalPages()"
                      @click="currentPage = Math.min(getTotalPages(), currentPage + 1)">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>

          <!-- ===== 右侧：已选区 (340px) ===== -->
          <div class="w-[340px] shrink-0 flex flex-col border border-[#D3D7DE] rounded-[2px] overflow-hidden bg-white">
            <div class="flex items-center justify-between px-3 h-[40px] shrink-0">
              <span class="text-[12px] font-semibold text-[#2F3540] leading-[20px]">
                已选(<span x-text="getSelectedCount()"></span>)
              </span>
              <button
                class="flex items-center gap-1 text-[#6F7785] hover:text-[#CF171D] transition-colors disabled:opacity-40"
                @click="clearAll()" :disabled="getSelectedCount() === 0">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>

            <!-- 已选搜索框 -->
            <div class="px-3 pb-3 shrink-0">
              <div class="relative">
                <input type="text" placeholder="搜索已选设备" x-model="selectedSearchKeyword"
                  class="w-full h-[32px] pl-3 pr-8 text-[12px] leading-[20px] bg-white border border-[#D3D7DE] rounded-[2px] focus:border-[#1C6EFF] outline-none placeholder:text-[#A1A7B3] transition-colors text-[#2F3540]" />
                <div class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A7B3]">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
              </div>
            </div>

            <div class="flex-1 min-h-0 flex flex-col border-t border-[#E1E5EB] overflow-hidden">

              <!-- 表头 -->
              <div class="shrink-0 flex items-center h-[32px] bg-[#EDF1F7] border-b border-[#E1E5EB] px-3 select-none">
                <span class="flex-1 min-w-0 text-[12px] leading-[20px] text-[#454C59] font-medium">设备名称</span>
                <span class="w-[120px] shrink-0 text-[12px] leading-[20px] text-[#454C59] font-medium relative pl-3">
                  所属分组
                  <span class="absolute left-0 top-1/2 -translate-y-1/2 h-[16px] w-px bg-[#E1E5EB]"></span>
                </span>
                <span
                  class="w-[48px] shrink-0 text-[12px] leading-[20px] text-[#454C59] font-medium relative pl-3 text-center">
                  操作
                  <span class="absolute left-0 top-1/2 -translate-y-1/2 h-[16px] w-px bg-[#E1E5EB]"></span>
                </span>
              </div>

              <!-- 列表容器 -->
              <div class="flex-1 overflow-y-auto custom-scrollbar">

                <!-- 空状态 -->
                <template x-if="getSelectedGroupEntries().length === 0 && getOrderedSelectedDevices().length === 0">
                  <div class="flex flex-col items-center justify-center py-20">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" class="mb-3">
                      <rect x="12" y="16" width="40" height="36" rx="2" fill="#EDF1F7" />
                      <path d="M12 22V18C12 16.8954 12.8954 16 14 16H26L30 22H12Z" fill="#D3D7DE" />
                      <rect x="22" y="28" width="20" height="20" rx="2" fill="white" stroke="#D3D7DE"
                        stroke-width="1.5" />
                      <path d="M28 38L31 41L37 35" stroke="#B0B5BD" stroke-width="1.5" stroke-linecap="round"
                        stroke-linejoin="round" />
                    </svg>
                    <div class="text-[12px] leading-[20px] text-[#6F7785]">暂无已选设备</div>
                    <div class="text-[12px] leading-[20px] text-[#A1A7B3] mt-1">请在左侧勾选设备或分组</div>
                  </div>
                </template>

                <!-- 已选分组 -->
                <template x-for="group in getSelectedGroupEntries()" :key="'sel-g-'+group.id">
                  <div
                    class="flex items-center h-[40px] border-b border-[#E1E5EB] px-3 hover:bg-[#F7F9FC] transition-colors">
                    <div class="flex-1 min-w-0 flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M1.5 3.5C1.5 2.67 2.17 2 3 2H6L7.5 3.5H13C13.83 3.5 14.5 4.17 14.5 5V12.5C14.5 13.33 13.83 14 13 14H3C2.17 14 1.5 13.33 1.5 12.5V3.5Z"
                          fill="#FDAA1D" />
                        <path d="M1.5 5.5H14.5V12.5C14.5 13.33 13.83 14 13 14H3C2.17 14 1.5 13.33 1.5 12.5V5.5Z"
                          fill="#FFC24B" />
                      </svg>
                      <span class="text-[12px] leading-[20px] text-[#2F3540] truncate" x-text="group.name"></span>
                    </div>
                    <span class="w-[120px] shrink-0 text-[12px] leading-[20px] text-[#6F7785] truncate pl-3"
                      x-text="group.parentPath"></span>
                    <div class="w-[48px] shrink-0 flex items-center justify-center">
                      <button
                        class="w-4 h-4 flex items-center justify-center text-[#8F959E] hover:text-[#CF171D] transition-colors"
                        @click="removeSelected(group.id, 'group')">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                          stroke-linecap="round" stroke-linejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                </template>

                <!-- 已选设备 -->
                <template x-for="device in getOrderedSelectedDevices()" :key="'sel-d-'+device.id">
                  <div
                    class="flex items-center h-[40px] border-b border-[#E1E5EB] px-3 hover:bg-[#F7F9FC] transition-colors">
                    <div class="flex-1 min-w-0 flex items-center gap-1.5">
                      <!-- 备设备缩进连线 -->
                      <template x-if="device.type === '备'">
                        <span class="relative shrink-0" style="width: 8px; height: 40px;">
                          <span class="absolute w-px bg-[#8F959E]" style="left: 0; top: 0; height: 50%;"></span>
                          <span class="absolute h-px bg-[#8F959E]" style="left: 0; top: 50%; width: 8px;"></span>
                        </span>
                      </template>

                      <!-- 网关图标 -->
                      <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="4" width="12" height="8" rx="1.5" fill="#1C6EFF" />
                        <circle cx="5" cy="8" r="1.2" fill="white" />
                        <circle cx="8" cy="8" r="1.2" fill="white" />
                        <circle cx="11" cy="8" r="1.2" fill="white" />
                        <path d="M5 3V4" stroke="#1C6EFF" stroke-width="1.2" stroke-linecap="round" />
                        <path d="M8 3V4" stroke="#1C6EFF" stroke-width="1.2" stroke-linecap="round" />
                        <path d="M11 3V4" stroke="#1C6EFF" stroke-width="1.2" stroke-linecap="round" />
                      </svg>

                      <!-- 主备标签 -->
                      <template x-if="device.type">
                        <span
                          class="inline-flex items-center justify-center h-[18px] px-1 text-[10px] font-medium leading-none rounded-[2px] shrink-0"
                          :style="device.type === '主' ? 'color: #1C6EFF; background-color: #E8F4FF;' : 'color: #6F7785; background-color: #EDF1F7;'"
                          x-text="device.type"></span>
                      </template>

                      <span class="text-[12px] leading-[20px] text-[#2F3540] truncate" x-text="device.name"></span>
                    </div>
                    <span class="w-[120px] shrink-0 text-[12px] leading-[20px] text-[#6F7785] truncate pl-3"
                      x-text="'/' + device.groupName"></span>
                    <div class="w-[48px] shrink-0 flex items-center justify-center">
                      <button
                        class="w-4 h-4 flex items-center justify-center text-[#8F959E] hover:text-[#CF171D] transition-colors"
                        @click="removeSelected(device.id, 'device')">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                          stroke-linecap="round" stroke-linejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                </template>

              </div>
            </div>
          </div>

        </div>

        <!-- ===== 底栏 (56px) ===== -->
        <div class="flex items-center justify-between px-4 h-[56px] shrink-0 select-none">
          <!-- 设备列表外链 -->
          <button
            class="flex items-center gap-1.5 h-[32px] px-4 text-[14px] text-[#2F3540] border border-[#D3D7DE] rounded-[2px] hover:border-[#1C6EFF] hover:text-[#1C6EFF] transition-colors">
            <span>设备列表</span>
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </button>

          <!-- 确定取消按钮 -->
          <div class="flex items-center gap-2">
            <!-- 确定 (主按钮，在左) -->
            <button
              class="w-[72px] h-[32px] text-[14px] font-medium rounded-[2px] text-white bg-[#1C6EFF] hover:bg-[#4FA1FF] active:bg-[#1458CC] transition-colors cursor-pointer"
              @click="handleConfirm()">
              确定
            </button>
            <!-- 取消 (次按钮，在右) -->
            <button
              class="w-[72px] h-[32px] text-[14px] rounded-[2px] border border-[#D3D7DE] text-[#2F3540] hover:border-[#1C6EFF] hover:text-[#1C6EFF] active:bg-[#EDF1F7] transition-colors cursor-pointer"
              @click="handleCancel()">
              取消
            </button>
          </div>
        </div>

      </div>

    </div>

  </div>
```

### 推荐配合使用的全局 CSS 样式

```css
/* 自定义滚动条美化 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(120, 130, 145, 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
```
