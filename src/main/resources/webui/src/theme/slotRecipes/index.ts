import { alertSlotRecipe } from "./alert"
import { checkboxSlotRecipe } from "./checkbox"
import { comboboxSlotRecipe } from "./combobox"
import { dialogSlotRecipe } from "./dialog"
import { fieldSlotRecipe } from "./field"
import { menuSlotRecipe } from "./menu"
import { progressSlotRecipe } from "./progress"
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
  dialog: dialogSlotRecipe,
  menu: menuSlotRecipe,
  progress: progressSlotRecipe,
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
