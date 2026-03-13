import { YAMLMap,parse, stringify } from "yaml"

import { parseCustomTags } from "./parseCustomTags.js"
import { yamlOptions } from "./yamlOptions.js"

import { issuancePayload } from "./issuancePayload.js"
import { disclose } from "./disclose.js"
import { tokenToSchema } from "./tokenToSchema.js"

const dumps = data => {
  return stringify(data, yamlOptions)
}

const roughlyEqual = (a, b) => {
  return JSON.stringify(parse(a)) === JSON.stringify(parse(b))
}

const load = data => {
  const parsedData = parseCustomTags(data).contents
  if (parsedData === null) {
    throw new Error("parsed data cannot be null.")
  }
  return parsedData
}

const YAML = {
  load,
  tokenToSchema,
  issuancePayload,
  parseCustomTags,
  loads: parse,
  dumps,
  disclose,
  roughlyEqual
}

export default YAML
