import { makeCellBackground } from "./cell-background"

export const PlasmaBackground = makeCellBackground({
  fps: 14,
  paint: (api) => {
    const { w, h, t } = api
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v =
          Math.sin(x * 0.055 + t * 0.9) +
          Math.sin(y * 0.085 - t * 0.7) +
          Math.sin((x + y) * 0.05 + t * 0.6) +
          Math.sin(Math.hypot(x - w / 2, y - h * 0.5) * 0.07 - t * 0.8)
        const color = api.hsl(v * 55 + t * 35, 0.62, 0.5)
        // 往主题底色混（0.6=颜色占比），让它是背景而不是广告牌
        api.set(x, y, "█", api.mute(color, 0.6))
      }
    }
  },
})
