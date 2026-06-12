import { makeCellBackground } from "./cell-background"

const DATA = "01<>[]{}/\\|=+ｱｶｻﾀﾅ#%$"
const rd = () => DATA[(Math.random() * DATA.length) | 0]
const BLOCK = "█▓▒░"

const YELLOW = (g: number) => ({ r: (255 * g) | 0, gr: (222 * g) | 0, b: (10 * g) | 0 })
const CYAN = (g: number) => ({ r: (20 * g) | 0, gr: (235 * g) | 0, b: (255 * g) | 0 })
const MAGENTA = (g: number) => ({ r: (255 * g) | 0, gr: (30 * g) | 0, b: (170 * g) | 0 })
const DKYEL = (g: number) => ({ r: (120 * g) | 0, gr: (95 * g) | 0, b: (0 * g) | 0 }) // 暗黄，警戒带底纹

// 警戒带里穿插的小元素
const MARKS = ["⚠", "▮", "╳", "//", "·", "SYS", "77", "!"]

type Stream = { x: number; y: number; sp: number; len: number; cyan: boolean }
type Glitch = { row: number; life: number; max: number; shift: number }
type State = {
  streams: Stream[]
  glitches: Glitch[]
  glitchCd: number
  phase: number
  marks: { pos: number; text: string }[] // 警戒带上的标记，随相位一起流动
}

const mkStream = (w: number, h: number): Stream => ({
  x: (Math.random() * w) | 0,
  y: -Math.random() * h,
  sp: 6 + Math.random() * 14,
  len: 4 + ((Math.random() * 8) | 0),
  cyan: Math.random() < 0.35,
})

export const CyberpunkBackground = makeCellBackground<State>({
  fps: 18,
  init: (w, h) => ({
    streams: Array.from({ length: Math.max(4, (w / 6) | 0) }, () => mkStream(w, h)),
    glitches: [],
    glitchCd: 1 + Math.random() * 2,
    phase: 0,
    // 沿宽度撒几个标记，间隔大致均匀
    marks: Array.from({ length: Math.max(2, (w / 22) | 0) }, (_, i) => ({
      pos: ((i + 0.5) * 22) | 0,
      text: MARKS[(Math.random() * MARKS.length) | 0],
    })),
  }),
  paint: (api, s) => {
    const { w, h, dt } = api
    if (!s || !s.streams) return
    const put = (x: number, y: number, ch: string, c: { r: number; gr: number; b: number }) =>
      api.set(x, y, ch, api.rgb(c.r, c.gr, c.b))

    // ---- 1) 黄黑警戒带（带流动 + 穿插元素）----
    s.phase += dt * 6
    const ph = Math.floor(s.phase)
    const drawStripe = (row: number, top: boolean) => {
      if (row < 0 || row >= h) return
      for (let x = 0; x < w; x++) {
        const on = ((x + ph + row) % 6) < 3
        if (on) put(x, row, "▰", YELLOW(0.95))
        else put(x, row, "▱", DKYEL(0.8)) // 黑的部分用暗黄底纹，更像实体胶带
      }
      // 只在带子的"内侧那一行"铺标记，避免太满
      if ((top && row === 1) || (!top && row === h - 2)) {
        for (const m of s.marks) {
          const x = ((m.pos - ph) % w + w) % w // 跟相位反向流动
          for (let i = 0; i < m.text.length; i++) {
            const xx = x + i
            if (xx >= 0 && xx < w) put(xx, row, m.text[i], { r: 20, gr: 20, b: 20 }) // 黑字压在黄带上
          }
        }
      }
    }
    drawStripe(0, true)
    drawStripe(1, true)
    drawStripe(h - 2, false)
    drawStripe(h - 1, false)

    // ---- 2) 稀疏霓虹数据流 ----
    for (const st of s.streams) {
      st.y += st.sp * dt
      if (st.y - st.len > h) {
        const n = mkStream(w, h)
        st.x = n.x
        st.y = -2
        st.sp = n.sp
        st.len = n.len
        st.cyan = n.cyan
      }
      const head = Math.floor(st.y)
      const pal = st.cyan ? CYAN : YELLOW
      for (let k = 0; k <= st.len; k++) {
        const y = head - k
        if (y < 2 || y >= h - 2) continue
        const g = k === 0 ? 1 : Math.pow(1 - k / st.len, 1.4)
        const c = k === 0 ? { r: 255, gr: 255, b: 220 } : pal(g)
        put(st.x, y, rd(), c)
      }
    }

    // ---- 3) 偶发横向 glitch（持续更久、更明显）----
    s.glitchCd -= dt
    if (s.glitchCd <= 0) {
      const n = 1 + ((Math.random() * 2) | 0)
      for (let i = 0; i < n; i++) {
        const life = 0.6 + Math.random() * 0.9 // 显著拉长：0.6~1.5 秒
        s.glitches.push({
          row: 2 + ((Math.random() * (h - 4)) | 0),
          life,
          max: life,
          shift: ((Math.random() * 10) | 0) - 5,
        })
      }
      s.glitchCd = 2.5 + Math.random() * 3
    }
    s.glitches = s.glitches.filter((gl) => {
      gl.life -= dt
      if (gl.life <= 0) return false
      // 生命周期内保持高填充密度，结尾淡出
      const fade = Math.min(1, gl.life / (gl.max * 0.4))
      for (let x = 0; x < w; x++) {
        if (Math.random() < 0.35) continue // 比之前更密（之前 0.55 跳过）
        const c = Math.random() < 0.5 ? MAGENTA(0.85 * fade + 0.15) : CYAN(0.85 * fade + 0.15)
        const xx = ((x + gl.shift) % w + w) % w
        put(xx, gl.row, BLOCK[(Math.random() * BLOCK.length) | 0], c)
      }
      return true
    })
  },
})
