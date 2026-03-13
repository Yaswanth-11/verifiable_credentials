import { YAMLMap, YAMLSeq } from "yaml"

import { walkMap } from "./walkMap.js"

export const walkList = (list, replacer) => {
  for (const index in list.items) {
    const element = list.items[index]
    if (element instanceof YAMLSeq) {
      walkList(element, replacer)
    } else if (element instanceof YAMLMap) {
      walkMap(element, replacer)
    }
    replacer(element)
  }
}
