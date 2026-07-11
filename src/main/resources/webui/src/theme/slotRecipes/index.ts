import { alertSlotRecipe } from "./alert"
import { checkboxSlotRecipe } from "./checkbox"
import { comboboxSlotRecipe } from "./combobox"
import { datePickerSlotRecipe } from "./date-picker"
import { dialogSlotRecipe } from "./dialog"
import { fieldSlotRecipe } from "./field"
import { listboxSlotRecipe } from "./listbox"
import { menuSlotRecipe } from "./menu"
import { popoverSlotRecipe } from "./popover"
import { progressSlotRecipe } from "./progress"
import { radioCardSlotRecipe } from "./radioCard"
import { selectSlotRecipe } from "./select"
import { sliderSlotRecipe } from "./slider"
import { switchSlotRecipe } from "./switch"
import { tabsSlotRecipe } from "./tabs"
import { tagSlotRecipe } from "./tag"
import { toastSlotRecipe } from "./toast"
import { tooltipSlotRecipe } from "./tooltip"

export default {
  alert: alertSlotRecipe,
  checkbox: checkboxSlotRecipe,
  datePicker: datePickerSlotRecipe,
  dialog: dialogSlotRecipe,
  listbox: listboxSlotRecipe,
  menu: menuSlotRecipe,
  popover: popoverSlotRecipe,
  progress: progressSlotRecipe,
  radioCard: radioCardSlotRecipe,
  select: selectSlotRecipe,
  slider: sliderSlotRecipe,
  tabs: tabsSlotRecipe,
  tag: tagSlotRecipe,
  field: fieldSlotRecipe,
  combobox: comboboxSlotRecipe,
  toast: toastSlotRecipe,
  switch: switchSlotRecipe,
  tooltip: tooltipSlotRecipe,
}
