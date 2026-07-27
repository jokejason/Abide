# 禾页健康餐 x 健身房合作平台 - 设计指南

## 品牌定位

- 产品定位：连接健身房与健康餐门店的 SaaS 平台
- 设计风格：活力、自然、专业、温暖
- 目标用户：健身爱好者、追求健康饮食的年轻群体

## 配色方案

### 主色板
- 主色（健康绿）：`#00B894` → Tailwind 自定义 `--primary`
- 辅助色（能量黄）：`#FDCB6E` → 用于高亮、能量指标
- 强调色（活力橙）：`#E17055` → 用于重要操作、消耗指标

### 中性色
- 背景色：`#F8F9FA` → `bg-[#F8F9FA]` 或 `bg-surface`
- 卡片背景：`#FFFFFF` → `bg-card`
- 边框色：`#E5E7EB` → `border-border`

### 文字色
- 主文字：`#2D3436` → `text-foreground`
- 次要文字：`#636E72` → `text-muted-foreground`
- 辅助文字：`#B2BEC3` → `text-muted-foreground/60`

### 语义色
- 成功/健康：`#00B894`
- 警告/注意：`#FDCB6E`
- 危险/消耗：`#E17055`
- 信息/链接：`#0984E3`

## 字体规范

- 标题 H1：`text-2xl font-bold`（32rpx 加粗）
- 标题 H2：`text-xl font-semibold`（28rpx 半粗）
- 正文：`text-base`（28rpx 常规）
- 辅助文字：`text-sm`（24rpx 常规）
- 标签/小字：`text-xs`（20rpx）

## 间距系统

- 页面边距：`px-4`（32rpx）
- 卡片内边距：`p-4`（32rpx）
- 组件间距：`gap-3`（24rpx）
- 列表项间距：`space-y-3`
- 紧凑间距：`gap-2`（16rpx）

## 组件使用原则

- 通用 UI 组件（按钮、输入框、弹窗、Tabs、Toast、Card 等）统一优先使用 `@/components/ui/*`
- 新页面开发前先拆分 UI 单元，再映射到组件库已有组件
- 禁止用 View/Text 手搓按钮、输入框、卡片、标签、弹层等通用 UI
- 图标使用 `lucide-react-taro`，通过 `color/size/strokeWidth` 属性控制

## 容器样式

- 卡片：`bg-white rounded-2xl shadow-sm p-4`
- 分组容器：`bg-white rounded-2xl p-4 mb-3`
- 页面容器：`min-h-screen bg-[#F8F9FA]`

## 导航结构

### TabBar（健身房小程序）
- 首页（训练概览）：`pages/index/index`
- 训练记录：`pages/training/index`
- 课程预约：`pages/course/index`
- 我的：`pages/profile/index`

### 普通页面
- 登录：`pages/login/index`
- 注册：`pages/register/index`

## 状态展示

- 空状态：居中图标 + 提示文字 + 操作按钮
- 加载态：使用 Skeleton 骨架屏
- 错误态：图标 + 错误描述 + 重试按钮

## 小程序约束

- 包体积控制在 2MB 以内
- 图片资源使用 TOS 对象存储 URL
- 列表使用虚拟滚动或分页加载
- TabBar 图标使用本地 PNG（81x81）
