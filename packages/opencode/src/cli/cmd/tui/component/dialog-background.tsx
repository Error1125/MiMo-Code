import { DialogSelect, type DialogSelectOption } from "../ui/dialog-select"
import { useDialog } from "../ui/dialog"
import { useKV } from "../context/kv"
import { backgrounds, DEFAULT_BACKGROUND } from "../background/registry"
import { onCleanup } from "solid-js"

export function DialogBackground() {
  const dialog = useDialog()
  const kv = useKV()
  const initial = kv.get("background")
  let confirmed = false

  // 没确认就退出（Esc）→ 还原到进来时的选择，撤销实时预览。
  onCleanup(() => {
    if (!confirmed) kv.set("background", initial)
  })

  const options: DialogSelectOption<string>[] = Object.entries(backgrounds).map(([key, entry]) => ({
    title: entry.title,
    value: key,
  }))

  return (
    <DialogSelect
      title="切换背景"
      options={options}
      current={typeof initial === "string" && initial in backgrounds ? initial : DEFAULT_BACKGROUND}
      onMove={(opt) => kv.set("background", opt.value)} // 边移动边实时预览
      onSelect={(opt) => {
        kv.set("background", opt.value)
        kv.set("background_image", undefined) // 选了动画背景就清掉静态图，避免优先级打架
        confirmed = true
        dialog.clear()
      }}
    />
  )
}
