import { base64url } from "jose"
import { Pair, Scalar, YAMLMap, YAMLSeq } from "yaml"

import { discloseTag } from "./constants.js"

import { redactSource } from "./disclose.js"

import { serializeDisclosure } from "./serializeDisclosure.js"

import { walkMap } from "./walkMap.js"

const updateTarget = (source, sourceItem, index, targetItem) => {
  if (sourceItem instanceof Pair) {
    let foundExistingDisclosure = source.items.find(item => {
      return item.key.value === "_sd"
    })
    if (!foundExistingDisclosure) {
      const disclosureKeyScalar = new Scalar("_sd")
      const disclosureKeySeq = new YAMLSeq()
      foundExistingDisclosure = new Pair(disclosureKeyScalar, disclosureKeySeq)
      source.items.push(foundExistingDisclosure)
    }
    foundExistingDisclosure.value.items.push(targetItem)
  } else {
    source.items[index] = targetItem
  }
}

const getDisclosureItem = async (salt, source, config) => {
  const json = serializeDisclosure(salt, source)
  const encoded = base64url.encode(json)
  // spy here...
  const disclosureHash = await config.digester.digest(encoded)
  config.disclosures[encoded] = disclosureHash
  const disclosureHashScalar = new Scalar(disclosureHash)
  if (source instanceof Pair) {
    return disclosureHashScalar
  } else {
    const disclosePair = new Pair("...", disclosureHashScalar)
    const discloseElement = new YAMLMap()
    discloseElement.add(disclosePair)
    return discloseElement
  }
}

const addDisclosure = async (source, index, sourceItem, config) => {
  const salt = await config.salter(sourceItem)
  if (!salt) {
    console.warn(JSON.stringify(sourceItem, null, 2))
    throw new Error("Unhandled salt disclosure...")
  }
  const item = await getDisclosureItem(salt, sourceItem, config)
  updateTarget(source, sourceItem, index, item)
}

const issuanceWalkMap = async (source, config) => {
  const indexList = []
  for (const index in source.items) {
    const sourcePair = source.items[index]
    if (sourcePair.value instanceof YAMLSeq) {
      await issuanceWalkList(sourcePair.value, config)
    }
    if (sourcePair.value instanceof YAMLMap) {
      await issuanceWalkMap(sourcePair.value, config)
    }
    if (sourcePair.key.tag === discloseTag) {
      await addDisclosure(source, index, sourcePair, config)
      indexList.push(parseInt(index, 10))
    }
  }
  redactSource(source, indexList)
}

const issuanceWalkList = async (source, config) => {
  const indexList = []
  for (const index in source.items) {
    const sourceElement = source.items[index]
    if (sourceElement instanceof YAMLSeq) {
      await issuanceWalkList(sourceElement, config)
    }
    if (sourceElement instanceof YAMLMap) {
      await issuanceWalkMap(sourceElement, config)
    }
    if (sourceElement.tag === discloseTag) {
      await addDisclosure(source, index, sourceElement, config)
      // indexList.push(parseInt(index, 10));
    }
  }
  redactSource(source, indexList)
}

const disclosureSorter = pair => {
  if (pair.key && pair.key.value === "_sd") {
    pair.value.items.sort((a, b) => {
      if (a.value >= b.value) {
        return 1
      } else {
        return -1
      }
    })
  }
}

const preconditionChecker = pair => {
  if (pair.key && pair.key.value === "_sd") {
    throw new Error("claims may not contain _sd")
  }
}

export const issuancePayload = async (doc, config) => {
  walkMap(doc, preconditionChecker)
  await issuanceWalkMap(doc, config)
  walkMap(doc, disclosureSorter)
  return JSON.parse(JSON.stringify(doc))
}
