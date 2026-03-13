import digest from "../v2/digest.js"

import { COMBINED_serialization_FORMAT_SEPARATOR } from "./constants.js"

const compute = async token => {
  // ends ~ with no disclosures
  // ends discosure with one or more disclosures
  if (!token.includes(COMBINED_serialization_FORMAT_SEPARATOR)) {
    throw new Error("_sd_hash can only be computed over +sd-jwt")
  }
  return digest(token)
}

export const sd_hash = { compute }
