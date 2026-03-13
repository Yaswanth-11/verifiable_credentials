import { parseDocument,
  Pair,
  Scalar,
  parse } from "yaml"

import { walkMap } from "./walkMap.js"
import { discloseTag } from "./constants.js";
import { yamlOptions } from "./yamlOptions.js"

const replacer = node => {
  // no op
}

export const parseCustomTags = data => {
  const doc = parseDocument(data, yamlOptions)
  walkMap(doc.contents, replacer)
  return doc
}
