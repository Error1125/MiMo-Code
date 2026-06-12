import { makeCellBackground } from "./cell-background"

// EVA / NERV 指挥界面致敬（原创实现，非复刻任何官方画面）：
// 待机态——暗六边形网格 + 中央字符准星 + 作战数据仪表 + 滚动 hex；
// 告警态——"使徒来袭"全屏红黑斜纹 + 密铺 WARNING + 黄黑警戒条 + 剧烈闪烁。
// 所有文字为通用警示术语，所有图形为字符近似。

type RGB = { r: number; g: number; b: number }
const ORANGE: RGB = { r: 255, g: 140, b: 20 }
const RED: RGB = { r: 235, g: 30, b: 30 }
const AMBER: RGB = { r: 255, g: 190, b: 60 }
const YEL: RGB = { r: 245, g: 205, b: 30 }
const DIM: RGB = { r: 120, g: 70, b: 18 }
const mul = (c: RGB, f: number): RGB => ({
  r: Math.min(255, Math.max(0, (c.r * f) | 0)),
  g: Math.min(255, Math.max(0, (c.g * f) | 0)),
  b: Math.min(255, Math.max(0, (c.b * f) | 0)),
})

const HEXD = "0123456789ABCDEF"
const genHex = (n: number) => {
  let s = ""
  for (let i = 0; i < n; i++) s += HEXD[(Math.random() * 16) | 0]
  return s
}

type DataLine = { y: number; sp: number; txt: string }
type State = {
  alert: number // 0 待机 ~ 1 告警
  hold: number // 告警保持计时
  lastAuto: number // 上次自动触发的秒数
  lines: DataLine[]
}

// 文本写入：把字符串从 (x,y) 起逐格写入
function text(api: any, x: number, y: number, str: string, c: RGB) {
  for (let i = 0; i < str.length; i++) api.set(x + i, y, str[i], api.rgb(c.r, c.g, c.b))
}

export const NervBackground = makeCellBackground<State>({
  fps: 18,
  init: (w, h) => ({
    alert: 0,
    hold: 0,
    lastAuto: 0,
    lines: Array.from({ length: Math.max(4, (h / 3) | 0) }, (_, i) => ({
      y: 4 + i * 3,
      sp: 2 + Math.random() * 4,
      txt: genHex(8) + " " + genHex(4),
    })),
  }),
  paint: (api, s) => {
    const { w, h, t, dt } = api
    if (!s) return

    // 自动触发告警：每 ~8 秒一次，40% 概率
    if (t - s.lastAuto > 8) {
      s.lastAuto = t
      if (Math.random() < 0.4) s.hold = 3.5
    }
    if (s.hold > 0) {
      s.hold -= dt
      s.alert += (1 - s.alert) * Math.min(1, dt * 8)
    } else {
      s.alert *= 0.9
      if (s.alert < 0.02) s.alert = 0
    }

    if (s.alert < 0.5) {
      // ===== 待机态 =====
      // 暗六边形网格（用字符近似：每隔几格放一个暗橙的 ⬡ 替代符 + 连点）
      for (let y = 2; y < h - 1; y += 3) {
        for (let x = 0; x < w; x += 6) {
          const off = ((y / 3) | 0) % 2 ? 3 : 0
          const fl = 0.5 + 0.5 * Math.sin(t * 0.5 + x * 0.1 + y * 0.2)
          api.set(x + off, y, "⬡", api.rgb(mul(DIM, 0.5 + fl * 0.5).r, mul(DIM, 0.5 + fl * 0.5).g, mul(DIM, 0.5 + fl * 0.5).b))
        }
      }

      // 中央字符准星
      const cx = (w / 2) | 0
      const cy = (h * 0.46) | 0
      const ringR = 6
      // 同心"环"：用字符点近似两圈
      for (let a = 0; a < 360; a += 18) {
        const rad = (a * Math.PI) / 180
        const x1 = cx + Math.round(Math.cos(rad) * ringR * 1.8)
        const y1 = cy + Math.round(Math.sin(rad) * ringR)
        api.set(x1, y1, "·", api.rgb(ORANGE.r, ORANGE.g, ORANGE.b))
        const x2 = cx + Math.round(Math.cos(rad) * ringR * 1.0)
        const y2 = cy + Math.round((Math.sin(rad) * ringR) / 1.8)
        api.set(x2, y2, "·", api.rgb(mul(ORANGE, 0.7).r, mul(ORANGE, 0.7).g, mul(ORANGE, 0.7).b))
      }
      // 旋转扫描臂
      const ang = t * 0.8
      for (let r = 1; r <= ringR * 1.8; r++) {
        const ax = cx + Math.round(Math.cos(ang) * r)
        const ay = cy + Math.round((Math.sin(ang) * r) / 1.8)
        api.set(ax, ay, "─", api.rgb(AMBER.r, AMBER.g, AMBER.b))
      }
      // 十字 + 中心目标框
      text(api, cx - 1, cy, "[ ]", RED)
      api.set(cx, cy, "◎", api.rgb(RED.r, RED.g, RED.b))

      // 顶栏
      text(api, 2, 1, "NERV", ORANGE)
      text(api, 7, 1, "MAGI//CASPER-MELCHIOR-BALTHASAR  STATUS:STANDBY", mul(AMBER, 0.7))
      // 右上时钟
      const hh = ("0" + ((8 + ((t / 3600) | 0)) % 24)).slice(-2)
      const mm = ("0" + (((t / 60) | 0) % 60)).slice(-2)
      const ss = ("0" + ((t | 0) % 60)).slice(-2)
      const clock = hh + ":" + mm + ":" + ss
      text(api, w - clock.length - 1, 1, clock, ORANGE)

      // 左侧仪表
      const left = [
        "SYNC RATIO  " + (40 + Math.sin(t * 0.7) * 8).toFixed(1) + "%",
        "EGO BORDER  " + (0.62 + Math.sin(t * 0.4) * 0.05).toFixed(2),
        "HARMONICS   " + ((Math.random() * 100) | 0) + "%",
        "A.T. FIELD  NEUTRAL",
        "LCL DENSITY " + (98 + Math.random() * 2).toFixed(1) + "%",
        "POWER       EXTERNAL",
      ]
      for (let i = 0; i < left.length && i < h - 6; i++) {
        text(api, 2, h - 8 + i, left[i], i < 3 ? ORANGE : mul(AMBER, 0.75))
      }

      // 右侧滚动 hex 数据
      for (const L of s.lines) {
        L.y -= L.sp * dt
        if (L.y < 3) {
          L.y = h - 3
          L.txt = genHex(8) + " " + genHex(4)
        }
        const yy = Math.round(L.y)
        if (yy > 2 && yy < h - 2) {
          const str = L.txt
          text(api, w - str.length - 1, yy, str, mul(ORANGE, 0.35))
        }
      }

      // 底部坐标
      text(api, 2, h - 1, "LAT35.31 LON139.41 DEPTH-200m PATTERN:ORANGE", mul(AMBER, 0.5))
    } else {
      // ===== 告警态：使徒来袭，全屏红黑接管 =====
      const blink = 0.6 + 0.4 * Math.sin(t * 18)
      const rc = mul(RED, blink)

      // 红黑斜纹铺底：斜向条带
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const band = ((x + y) % 8) < 4
          if (band) api.set(x, y, "▓", api.rgb(rc.r, rc.g, rc.b))
        }
      }

      // 六边形蜂巢叠加（暗）
      for (let y = 2; y < h; y += 3) {
        for (let x = 0; x < w; x += 6) {
          const off = ((y / 3) | 0) % 2 ? 3 : 0
          api.set(x + off, y, "⬡", api.rgb((10 * blink) | 0, 0, 0))
        }
      }

      // 密铺 WARNING
      for (let y = 2; y < h; y += 3) {
        const off = ((y / 3) | 0) % 2 ? 7 : 0
        for (let x = 2; x < w; x += 14) {
          text(api, x + off, y, "WARNING", { r: (10 * blink) | 0, g: 0, b: 0 })
        }
      }

      // 上下黄黑警戒条
      const yc = mul(YEL, blink)
      for (let x = 0; x < w; x++) {
        const on = (x % 4) < 2
        const ch = on ? "▰" : "▱"
        const col = on ? yc : { r: (15 * blink) | 0, g: (12 * blink) | 0, b: 0 }
        api.set(x, 0, ch, api.rgb(col.r, col.g, col.b))
        api.set(x, h - 1, ch, api.rgb(col.r, col.g, col.b))
      }

      // 中央告警条
      const bandTop = ((h - 5) / 2) | 0
      for (let y = bandTop; y < bandTop + 5; y++) {
        for (let x = 0; x < w; x++) api.set(x, y, " ", api.rgb(0, 0, 0))
      }
      // 告警条上下黄黑边
      for (let x = 0; x < w; x++) {
        const on = (x % 4) < 2
        const col = on ? yc : { r: 12, g: 9, b: 0 }
        api.set(x, bandTop, on ? "▰" : "▱", api.rgb(col.r, col.g, col.b))
        api.set(x, bandTop + 4, on ? "▰" : "▱", api.rgb(col.r, col.g, col.b))
      }
      // 中央大字（居中）
      const msg = "使徒, 来袭!"
      const sub = "EMERGENCY // PATTERN BLUE"
      text(api, ((w - msg.length) / 2) | 0, bandTop + 2, msg, mul(RED, blink))
      if (sub.length < w) text(api, ((w - sub.length) / 2) | 0, bandTop + 3, sub, mul(YEL, blink))

      // 角标
      text(api, 2, 2, "⚠ WARNING", mul(RED, blink))
      const wr = "警告 ⚠"
      text(api, w - wr.length - 1, 2, wr, mul(YEL, blink))

      // 偶发横向 glitch
      if (Math.random() < 0.3) {
        const gy = 2 + ((Math.random() * (h - 4)) | 0)
        for (let x = 0; x < w; x++) if (Math.random() < 0.6) api.set(x, gy, "█", api.rgb(0, 0, 0))
      }
    }
  },
})