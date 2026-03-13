import { discloseValue } from "./constants.js"

export class TestTagValue {
  constructor(value) {
    this.value = value
    this.key = discloseValue
  }
  toJSON() {
    return { [discloseValue]: "..." }
  }
  toString() {
    return discloseValue
  }
  // todo add a method for computing the disclosed hash here...
}
