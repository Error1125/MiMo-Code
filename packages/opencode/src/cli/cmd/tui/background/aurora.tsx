import { makeCellBackground } from "./cell-background"

export const AuroraBackground = makeCellBackground({
  fps: 14,
  paint: (api) => {
    const { w, h, t } = api
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c1 = h * 0.42 + Math.sin(x * 0.05 + t * 0.5) * 4 + Math.sin(x * 0.13 - t * 0.3) * 2
        const c2 = h * 0.66 + Math.sin(x * 0.04 - t * 0.4) * 5 + Math.sin(x * 0.11 + t * 0.25) * 2
        let inten = Math.max(0, 1 - Math.abs(y - c1) / (h * 0.3)) + Math.max(0, 1 - Math.abs(y - c2) / (h * 0.34)) * 0.8
        inten *= 0.55 + 0.45 * Math.sin(x * 0.1 + t * 1.1)
        if (inten <= 0.02) continue // 光带之外留空（显示主题底色）
        const hue = 150 + 55 * Math.sin(x * 0.03 + t * 0.2) + (y / h) * 40
        const heightFade = 1 - (y / h) * 0.5
        const color = api.hsl(hue, 0.7, Math.min(0.5, (0.12 + inten * 0.5) * heightFade))
        api.set(x, y, "█", color)
      }
    }
  },
})
