import { makeCellBackground } from "./cell-background"

// GIRLS BAND CRY 致敬：五颗角色色米字主星，漂浮在星空中，
// 按一段原创的"热闹明快"律动轮流点亮，底部频谱同步，副歌触发脉冲。
// 五个成员代表色：仁菜#D90E2C 桃香#85C9DC 昴#76BD53 智#E34D8D RUPA#EEDA01

type RGB = { r: number; g: number; b: number }
const C: RGB[] = [
  { r: 217, g: 14, b: 44 }, // 仁菜 红
  { r: 133, g: 201, b: 220 }, // 桃香 青
  { r: 118, g: 189, b: 83 }, // 昴 绿
  { r: 227, g: 77, b: 141 }, // 智 粉
  { r: 238, g: 218, b: 1 }, // RUPA 黄
]
const mix = (c: RGB, f: number): RGB => ({
  r: Math.min(255, (c.r * f) | 0),
  g: Math.min(255, (c.g * f) | 0),
  b: Math.min(255, (c.b * f) | 0),
})

type Star = { x: number; y: number; b: number; sp: number; ph: number; warm: boolean }
type Main = { m: number; bx: number; by: number; ax: number; ay: number; sx: number; sy: number; px: number; py: number; cx: number; cy: number }
type Bar = { v: number; m: number }
type State = {
  stars: Star[]
  mains: Main[]
  bars: Bar[]
  lvl: number[]
  pulse: number
  lastChorus: boolean
}

const STEP = 0.16 // 一个律动 step 的秒数（节奏感）

// 原创律动序列（热闹明快）：黄打底 / 绿规律敲 / 青粉主歌交替 / 副歌全员+脉冲
function groove(t: number): { act: number[]; chorus: boolean } {
  const s = Math.floor(t / STEP) % 32
  const act = [0, 0, 0, 0, 0]
  act[4] = 0.55
  if (s % 4 === 0) act[2] = 1.0
  else if (s % 2 === 0) act[2] = 0.5
  else act[2] = 0.15
  const chorus = s >= 24
  if (!chorus) {
    const lead = Math.floor(s / 4) % 2 === 0 ? 1 : 3
    act[lead] = 1.0
    act[lead === 1 ? 3 : 1] = 0.3
    act[0] = 0.25
    act[4] = 0.5
  } else {
    act[0] = 1.0
    act[1] = 0.85
    act[2] = 0.9
    act[3] = 0.85
    act[4] = 0.8
  }
  return { act, chorus }
}

export const TogeariBackground = makeCellBackground<State>({
  fps: 20,
  init: (w, h) => {
    const starN = Math.max(20, ((w * h) / 26) | 0)
    return {
      stars: Array.from({ length: starN }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        b: Math.random(),
        sp: 0.4 + Math.random() * 1.6,
        ph: Math.random() * 6.28,
        warm: Math.random() < 0.45,
      })),
      mains: [
        { m: 0, bx: 0.3, by: 0.3, ax: 0.06, ay: 0.06, sx: 0.13, sy: 0.17, px: 0, py: 1.2, cx: 0, cy: 0 },
        { m: 1, bx: 0.68, by: 0.24, ax: 0.05, ay: 0.07, sx: 0.1, sy: 0.15, px: 2.0, py: 0.5, cx: 0, cy: 0 },
        { m: 2, bx: 0.5, by: 0.48, ax: 0.07, ay: 0.05, sx: 0.16, sy: 0.11, px: 3.3, py: 2.1, cx: 0, cy: 0 },
        { m: 3, bx: 0.2, by: 0.56, ax: 0.05, ay: 0.07, sx: 0.12, sy: 0.18, px: 4.5, py: 3.0, cx: 0, cy: 0 },
        { m: 4, bx: 0.8, by: 0.54, ax: 0.06, ay: 0.06, sx: 0.14, sy: 0.13, px: 5.2, py: 4.4, cx: 0, cy: 0 },
      ],
      bars: Array.from({ length: w }, (_, i) => ({ v: 0.1, m: i % 5 })),
      lvl: [0, 0, 0, 0, 0],
      pulse: 0,
      lastChorus: false,
    }
  },
  paint: (api, s) => {
    const { w, h, t, dt } = api
    if (!s || !s.stars) return

    const g = groove(t)
    if (g.chorus && !s.lastChorus) s.pulse = 1
    s.lastChorus = g.chorus
    for (let m = 0; m < 5; m++) s.lvl[m] += (g.act[m] - s.lvl[m]) * Math.min(1, dt * 14)

    // 星点（脉冲时向外加速漂移，制造"向前冲刺"感）
    for (const st of s.stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * st.sp + st.ph)
      const b = st.b * tw * (0.55 + s.pulse * 1.3)
      if (s.pulse > 0.01) {
        const dx = st.x - w / 2
        const dy = st.y - h / 2
        st.x += dx * s.pulse * 0.045
        st.y += dy * s.pulse * 0.045
        if (st.x < 0 || st.x >= w || st.y < 0 || st.y >= h) {
          st.x = Math.random() * w
          st.y = Math.random() * h
        }
      }
      const x = st.x | 0
      const y = st.y | 0
      if (y < 2 || y >= h - 8) continue
      const lvl = Math.min(1, b)
      if (lvl < 0.15) continue
      const ch = lvl > 0.75 ? "✦" : lvl > 0.45 ? "·" : "."
      const col = st.warm ? { r: 255, g: 185, b: 175 } : { r: 195, g: 205, b: 255 }
      api.set(x, y, ch, api.rgb(mix(col, lvl).r, mix(col, lvl).g, mix(col, lvl).b))
    }

    // 五颗主星：漂浮 + 米字星芒 + 律动亮度
    const dirs = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [-1, -1], [1, -1], [-1, 1],
    ]
    for (const M of s.mains) {
      const c = C[M.m]
      const L = s.lvl[M.m]
      const cx = Math.round(M.bx * w + Math.sin(t * M.sx * 6.28 + M.px) * (M.ax * w))
      const cy = Math.round(M.by * h + Math.cos(t * M.sy * 6.28 + M.py) * (M.ay * h))
      const base = 0.35 + 0.65 * L + s.pulse * 0.5
      const R = Math.max(2, Math.round(2 + L * 3 + s.pulse * 2))
      const cl = mix(c, 1 + s.pulse * 0.3)
      for (const d of dirs) {
        const diag = d[0] !== 0 && d[1] !== 0
        const len = diag ? Math.max(1, Math.round(R * 0.7)) : R
        for (let k = 1; k <= len; k++) {
          const f = 1 - k / (len + 1)
          const a = Math.min(1, base * (0.25 + 0.75 * f))
          const ch = f > 0.6 ? "█" : f > 0.3 ? "▓" : "▒"
          api.set(cx + d[0] * k, cy + d[1] * k, ch, api.rgb(mix(cl, a).r, mix(cl, a).g, mix(cl, a).b))
        }
      }
      // 核心
      api.set(cx, cy, "✦", api.rgb(255, 255, 255))
    }

    // 底部频谱（每根属于一个成员色，按该成员律动强度跳动）
    const baseY = h - 1
    for (let x = 0; x < w; x++) {
      const B = s.bars[x] ?? (s.bars[x] = { v: 0.1, m: x % 5 })
      const c = C[B.m]
      const L = s.lvl[B.m]
      const target = 0.06 + L * (0.45 + Math.random() * 0.5) + s.pulse * 0.35
      B.v += (target - B.v) * Math.min(1, dt * 12)
      const cells = Math.max(1, Math.round(B.v * h * 0.32))
      for (let k = 0; k < cells; k++) {
        const y = baseY - k
        if (y < 0) break
        const f = 1 - (k / cells) * 0.55
        const ch = f > 0.66 ? "█" : f > 0.33 ? "▓" : "▒"
        api.set(x, y, ch, api.rgb(mix(c, f).r, mix(c, f).g, mix(c, f).b))
      }
    }

    s.pulse *= 0.95 // 衰减更慢 → 脉冲持续更久，冲刺感更明显
    if (s.pulse < 0.01) s.pulse = 0
  },
})
