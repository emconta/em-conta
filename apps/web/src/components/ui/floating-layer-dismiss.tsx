import * as React from "react"

const openFloatingLayers = new Set<symbol>()

export function setFloatingLayerOpen(id: symbol, open: boolean) {
  if (open) {
    openFloatingLayers.add(id)
    return
  }

  openFloatingLayers.delete(id)
}

export function useFloatingLayerDismissGuard() {
  React.useEffect(() => {
    function handlePointerDownCapture() {
      if (openFloatingLayers.size > 0) {
        document.body.dataset.floatingLayerWasOpenAtPointerDown = "true"
      }
    }

    function handleClick() {
      window.setTimeout(() => {
        delete document.body.dataset.floatingLayerWasOpenAtPointerDown
      }, 0)
    }

    document.addEventListener("pointerdown", handlePointerDownCapture, true)
    document.addEventListener("click", handleClick, true)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDownCapture, true)
      document.removeEventListener("click", handleClick, true)
    }
  }, [])
}

export function shouldPreventDialogDismissForFloatingLayer() {
  return document.body.dataset.floatingLayerWasOpenAtPointerDown === "true"
}
