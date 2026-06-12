import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import {
  RGBA,
  StyledText,
  type BoxRenderable,
  type TextChunk,
  type TextRenderable,
} from "@opentui/core";
import { useTheme, tint } from "@tui/context/theme";

// Paint API passed to each background's paint function.
// A cell has one char + a foreground color (terminal's real constraint).
// Color-field backgrounds fill cells with a solid block plus a fg color.
export type PaintAPI = {
  w: number;
  h: number;
  t: number; // seconds since mount
  dt: number; // seconds since last frame (clamped)
  set: (x: number, y: number, ch: string, fg: RGBA) => void;
  rgb: (r: number, g: number, b: number) => RGBA;
  hsl: (h: number, s: number, l: number) => RGBA;
  mute: (color: RGBA, alpha: number) => RGBA;
  bg: RGBA;
};

// Merge adjacent chunks with the same fg (same approach as StarryBackground).
function appendChunk(chunks: TextChunk[], text: string, fg?: RGBA) {
  const prev = chunks.at(-1);
  if (
    prev &&
    prev.fg &&
    fg &&
    prev.fg.equals(fg) &&
    prev.bg === undefined &&
    prev.attributes === 0
  ) {
    prev.text += text;
    return;
  }
  chunks.push({ __isChunk: true, text, fg, attributes: 0 });
}

function hslToRgb(h: number, s: number, l: number): RGBA {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return RGBA.fromInts(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  );
}

export type CellBackgroundOptions<S> = {
  fps?: number;
  init?: (w: number, h: number) => S;
  paint: (api: PaintAPI, state: S) => void;
};

export function makeCellBackground<S = undefined>(
  opts: CellBackgroundOptions<S>,
) {
  return function CellBackground() {
    const { theme } = useTheme();
    const [content, setContent] = createSignal<StyledText>(new StyledText([]));
    let box: BoxRenderable | undefined;
    let text: TextRenderable | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    let mounted = false;
    // current grid size; 0 means "not laid out yet" -> skip painting that frame
    let w = 0;
    let h = 0;
    let state: S = undefined as unknown as S;
    const start = performance.now();
    let lastT = 0;
    const fps = opts.fps ?? 16;

    const reinit = () => {
      state = opts.init ? opts.init(w, h) : (undefined as unknown as S);
    };

    // Read the real size every frame. Only (re)init state when the real size
    // actually changes. This avoids initializing against a fake 80x24 before
    // layout has run (the bug that made switching backgrounds overlap the UI).
    const syncSize = (): boolean => {
      if (!box) return false;
      const nw = box.width | 0;
      const nh = box.height | 0;
      if (nw <= 0 || nh <= 0) return false; // not laid out yet
      if (nw !== w || nh !== h) {
        w = nw;
        h = nh;
        reinit();
      }
      return true;
    };

    const render = () => {
      if (!syncSize()) return; // skip until we have a real size
      const now = (performance.now() - start) / 1000;
      let dt = now - lastT;
      lastT = now;
      if (dt > 0.1) dt = 0.1;
      if (dt < 0) dt = 0;
      const fgs: (RGBA | undefined)[] = new Array(w * h);
      const chars: string[] = new Array(w * h).fill(" ");
      const api: PaintAPI = {
        w,
        h,
        t: now,
        dt,
        set: (x, y, ch, fg) => {
          if (x < 0 || x >= w || y < 0 || y >= h) return;
          const i = y * w + x;
          chars[i] = ch;
          fgs[i] = fg;
        },
        rgb: (r, g, b) => RGBA.fromInts(r, g, b),
        hsl: hslToRgb,
        mute: (color, alpha) => tint(theme.background, color, alpha),
        bg: theme.background,
      };
      opts.paint(api, state);
      const chunks: TextChunk[] = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          const fg = fgs[i];
          if (chars[i] === " " || !fg) {
            // empty cell: no background color -> let upper UI show through
            appendChunk(chunks, " ");
          } else {
            appendChunk(chunks, chars[i], fg);
          }
        }
        if (y < h - 1)
          chunks.push({ __isChunk: true, text: "\n", attributes: 0 });
      }
      setContent(new StyledText(chunks));
    };

    onMount(() => {
      mounted = true;
      box?.on("resize", () => {
        // let render() pick up the new size on the next tick
      });
      timer = setInterval(
        () => {
          if (!mounted) return;
          render();
        },
        Math.max(16, Math.round(1000 / fps)),
      );
      render();
    });

    onCleanup(() => {
      mounted = false;
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    });

    createEffect(() => {
      if (!text) return;
      text.content = content();
    });

    return (
      <box
        ref={(item: BoxRenderable) => (box = item)}
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        zIndex={0}
      >
        <text
          ref={(item: TextRenderable) => {
            text = item;
            item.content = content();
          }}
          width="100%"
          height="100%"
          wrapMode="none"
          selectable={false}
        />
      </box>
    );
  };
}
