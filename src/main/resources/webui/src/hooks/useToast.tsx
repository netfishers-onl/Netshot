import { toaster, ToastType } from "@/components/ui/toaster"

type ToastConfig<M extends object = object> = {
  title?: string
  description?: string
  id?: string
  duration?: number
  meta?: M
}

const DEFAULT_DURATION = 5000

export default function useToast() {
  function error(config: ToastConfig) {
    if (!config.title && !config.description) return

    return toaster.create({
      type: ToastType.Error,
      duration: config.duration ?? DEFAULT_DURATION,
      ...config,
    })
  }

  function success(config: ToastConfig) {
    return toaster.create({
      type: ToastType.Success,
      duration: config.duration ?? DEFAULT_DURATION,
      ...config,
    })
  }

  function info(config: ToastConfig) {
    return toaster.create({
      type: ToastType.Info,
      duration: config.duration ?? DEFAULT_DURATION,
      ...config,
    })
  }

  function script(config: ToastConfig) {
    return toaster.create({
      type: ToastType.Script,
      duration: null,
      ...config,
    })
  }

  function warning(config: ToastConfig) {
    return toaster.create({
      type: ToastType.Warning,
      duration: config.duration ?? DEFAULT_DURATION,
      ...config,
    })
  }

  function loading(config: ToastConfig) {
    return toaster.create({
      type: ToastType.Loading,
      duration: null,
      ...config,
    })
  }

  function isActive(id: string) {
    return toaster.isVisible(id)
  }

  function close(id: string) {
    toaster.dismiss(id)
  }

  return {
    error,
    success,
    info,
    warning,
    loading,
    script,
    close,
    isActive,
  }
}
