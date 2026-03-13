import { YAMLMap, YAMLSeq } from "yaml"
import { walkList } from "./walkList.js"

export const walkMap = (obj, replacer) => {
  if (obj === null) {
    return
  }
  for (const pair of obj.items) {
    if (pair.value instanceof YAMLSeq) {
      walkList(pair.value, replacer)
    } else if (pair.value instanceof YAMLMap) {
      walkMap(pair.value, replacer)
    }
    replacer(pair)
  }
}
