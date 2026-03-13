import { discloseKey } from "./constants.js"
export class TestTagKey {
  constructor(value) {
    this.value = value
  }
  toJSON() {
    return { [discloseKey]: "..." }
  }
  toString() {
    return discloseKey
  }
}
