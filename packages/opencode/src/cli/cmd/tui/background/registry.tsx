import { StarryBackground } from "../component/starry-background"
import { MatrixBackground } from "./matrix"
import { AuroraBackground } from "./aurora"
import { PlasmaBackground } from "./plasma"
import { CyberpunkBackground } from "./cyberpunk"
import { TogeariBackground } from "./togeari"
import { NervBackground } from "./nerv"

export type BackgroundEntry = {
  title: string
  component: () => any
}

function StarryEntry() {
  return <StarryBackground meteor={() => true} />
}

// === Add a background: just add one line below { key: { title, component } }. ===
// It auto-appears in /background and is auto-rendered by home. No other edits.
export const backgrounds: Record<string, BackgroundEntry> = {
  starry: { title: "星空 · 默认", component: StarryEntry },
  matrix: { title: "代码雨", component: MatrixBackground },
  aurora: { title: "极光", component: AuroraBackground },
  plasma: { title: "等离子", component: PlasmaBackground },
  cyberpunk: { title: "赛博朋克 2077", component: CyberpunkBackground },
  togeari: { title: "GBC · 群星", component: TogeariBackground },
  nerv: { title: "EVA · NERV", component: NervBackground },
}

export const DEFAULT_BACKGROUND = "starry"
