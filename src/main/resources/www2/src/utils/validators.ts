import i18n from "@/i18n"

export default {
  ip(message?: string) {
    return {
      pattern: {
        value:
          /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d{1})/g,
        message: i18n.t(message || "This is not a valid IP address"),
      },
    }
  }
}