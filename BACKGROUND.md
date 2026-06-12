# MiMoCode 动画背景插件

> 给 MiMoCode TUI 的首页添加可切换的动画终端背景。

## 一览

| 背景 | 关键词 | 描述 |
|------|--------|------|
| 星空 · 默认 | `starry` | 原版星空 + 流星 |
| 代码雨 | `matrix` | 经典绿色字符雨 |
| 极光 | `aurora` | 北极光色场渐变 |
| 等离子 | `plasma` | 等离子色场效果 |
| 赛博朋克 2077 | `cyberpunk` | 霓虹数据流 + 黄黑警戒带 + 横向 glitch |
| GBC · 群星 | `togeari` | 五颗角色色米字主星 + 频谱律动，致敬 Girls Band Cry |
| EVA · NERV | `nerv` | NERV 指挥界面：六边形网格 + 准星 + 仪表，偶发"使徒来袭"红黑告警 |

> **关于风格致敬 / 视觉灵感：** 部分背景的视觉风格受到 EVA（新世纪福音战士）、Girls Band Cry 等作品的启发，但所有画面均为**原创的终端字符艺术实现**，不含也不复刻任何受版权保护的素材（角色形象、logo、官方画面、乐谱等）。颜色搭配、动画节奏、图形元素均由代码从零构建。

## 使用

在 MiMoCode TUI 首页输入：

```
/background
```

打开背景选择器后：
- **方向键** 上下移动 → 实时预览
- **回车** → 选定（持久化保存，下次启动还在）
- **Esc** → 取消，恢复原样

也可以直接指定背景名：

```
/background cyberpunk
```

## 架构

```
packages/opencode/src/cli/cmd/tui/
├── background/
│   ├── cell-background.tsx   # 共享脚手架：makeCellBackground({ fps, init, paint })
│   ├── registry.tsx          # 背景注册表（单一真相源）
│   ├── matrix.tsx            # 代码雨
│   ├── aurora.tsx            # 极光
│   ├── plasma.tsx            # 等离子
│   ├── cyberpunk.tsx         # 赛博朋克
│   ├── togeari.tsx           # GBC 群星
│   └── nerv.tsx              # EVA NERV
├── component/
│   ├── dialog-background.tsx # 选择器对话框
│   └── starry-background.tsx # 原版星空（也被注册表引用）
└── routes/
    └── home.tsx              # 首页渲染逻辑
```

**核心设计：** `cell-background.tsx` 提供 `makeCellBackground`，每个背景只需实现一个 `paint(api, state)` 函数。`api.set(x, y, char, color)` 逐格绘制，底层自动合并相邻同色 chunk、管理帧循环和清理。

**注册表：** `registry.tsx` 是唯一需要改的文件。加一个新背景只需：
1. 写一个 `.tsx`，用 `makeCellBackground({ fps, init?, paint })`
2. 在 `registry.tsx` 加一行 `import` + 一行注册

新背景自动出现在 `/background` 列表和首页渲染中，无需改动其他文件。

## 添加新背景

```tsx
// my-background.tsx
import { makeCellBackground } from "./cell-background"

export const MyBackground = makeCellBackground({
  fps: 16,
  init: (w, h) => ({ /* 初始化状态 */ }),
  paint: (api, s) => {
    const { w, h, t, dt } = api
    // 用 api.set(x, y, 字符, api.rgb(r, g, b)) 逐格绘制
  },
})
```

```tsx
// registry.tsx 加两行
import { MyBackground } from "./my-background"
// ...
export const backgrounds = {
  // ...已有背景...
  mine: { title: "我的背景", component: MyBackground },
}
```

## 可调参数

- **帧率：** `makeCellBackground({ fps })` — 终端建议 12–20，色场类偏吃 CPU
- **色场类背景** 用实心块 `"█"` + 前景色填充
- **线条/稀疏类** 可用 Braille 子像素（参考原版星空的流星画法）

## License

MiMoCode itself is MIT-licensed by Xiaomi; see the [upstream repository](https://github.com/XiaomiMiMo/MiMo-Code).
