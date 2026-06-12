import { makeCellBackground } from "./cell-background";

const KATA =
  "ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾚﾛﾜﾝ0123456789:.=*+<>";
const rk = () => KATA[(Math.random() * KATA.length) | 0];

type Col = { y: number; sp: number; len: number };
type State = { drops: Col[]; glyph: string[][] };

const mkCol = (h: number): Col => ({
  y: -Math.random() * Math.max(1, h),
  sp: 6 + Math.random() * 16,
  len: 6 + ((Math.random() * 16) | 0),
});
const mkGlyph = (h: number): string[] =>
  Array.from({ length: Math.max(1, h) }, () => rk());

export const MatrixBackground = makeCellBackground<State>({
  fps: 20,
  init: (w, h) => ({
    drops: Array.from({ length: Math.max(1, w) }, () => mkCol(h)),
    glyph: Array.from({ length: Math.max(1, w) }, () => mkGlyph(h)),
  }),
  paint: (api, s) => {
    const { w, h, dt } = api;
    if (!s || !s.drops) return; // 状态未就绪的那一帧直接跳过，避免读 undefined
    for (let x = 0; x < w; x++) {
      // 列兜底：尺寸变大、或某帧状态未对齐时，缺的列当场补，绝不读 undefined
      if (!s.drops[x]) s.drops[x] = mkCol(h);
      if (!s.glyph[x]) s.glyph[x] = mkGlyph(h);
      let col = s.glyph[x];
      if (col.length < h) {
        // 高度变大：补足缺的行
        for (let i = col.length; i < h; i++) col[i] = rk();
      }
      const d = s.drops[x];
      d.y += d.sp * dt;
      const head = Math.floor(d.y);
      if (head - d.len > h) {
        d.y = -Math.random() * 8;
        d.sp = 6 + Math.random() * 16;
        d.len = 6 + ((Math.random() * 16) | 0);
      }
      if (head >= 0 && head < h) col[head] = rk();
      for (let k = 0; k <= d.len; k++) {
        const y = head - k;
        if (y < 0 || y >= h) continue;
        const ch = col[y] ?? rk();
        if (k === 0) {
          api.set(x, y, ch, api.rgb(200, 255, 205)); // 字头：亮白偏绿
        } else {
          const g = 1 - k / d.len;
          api.set(
            x,
            y,
            ch,
            api.rgb(
              Math.round(20 * g),
              Math.round((120 + 135 * g) * g),
              Math.round(70 * g),
            ),
          );
        }
      }
    }
  },
});
