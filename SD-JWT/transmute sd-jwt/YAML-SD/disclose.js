import { Pair, Scalar, YAMLMap, YAMLSeq, stringify } from "yaml"

import { discloseTag } from "./constants.js"

import { parseCustomTags } from "./parseCustomTags.js"
import { yamlOptions } from "./yamlOptions.js"

const fakePair = sourcePair => {
  let fake
  if (sourcePair.value instanceof Scalar) {
    fake = { value: new Scalar(false) }
  }
  if (sourcePair.value instanceof YAMLSeq) {
    fake = {
      value: fakeSequence(sourcePair.value.items.length)
    }
  }
  if (sourcePair.value instanceof YAMLMap) {
    fake = sourcePair
  }
  return fake
}

const discloseWalkMap = (source, target) => {
  const indexList = []
  for (const index in source.items) {
    const sourcePair = source.items[index]
    const targetPair =
      target.items.find(item => {
        return item.key.value === sourcePair.key.value
      }) || fakePair(sourcePair)

    if (
      sourcePair.value instanceof YAMLSeq &&
      targetPair.value instanceof YAMLSeq
    ) {
      discloseWalkList(sourcePair.value, targetPair.value)
    }
    if (
      sourcePair.value instanceof YAMLMap &&
      targetPair.value instanceof YAMLMap
    ) {
      discloseWalkMap(sourcePair.value, targetPair.value)
    }
    if (
      sourcePair.key.tag === discloseTag &&
      targetPair.value.value === false
    ) {
      indexList.push(parseInt(index, 10))
    }
  }
  redactSource(source, indexList)
}

const discloseWalkList = (source, target) => {
  const indexList = []
  for (const index in source.items) {
    const sourceElement = source.items[index]
    let targetElement = target.items[index]
    if (sourceElement instanceof YAMLSeq) {
      if (targetElement === undefined || targetElement.value === false) {
        targetElement = fakeSequence(sourceElement.items.length)
      }
      if (targetElement instanceof YAMLSeq) {
        discloseWalkList(sourceElement, targetElement)
      }
    }
    if (sourceElement instanceof YAMLMap) {
      if (targetElement instanceof YAMLMap) {
        discloseWalkMap(sourceElement, targetElement)
      }
    }
    if (sourceElement.tag === discloseTag) {
      if (targetElement.value === false) {
        indexList.push(parseInt(index, 10))
      }
    }
  }

  redactSource(source, indexList)
}

export const redactSource = (source, indexList) => {
  source.items = source.items.filter((_, i) => {
    discloseReplace(source.items[i])
    return !indexList.includes(i)
  })
}

const fakeSequence = length => {
  const fake = new YAMLSeq()
  fake.items = new Array(length).fill({
    value: false
  })
  return fake
}

const discloseReplace = source => {
  if (
    source instanceof Scalar ||
    source instanceof YAMLSeq ||
    source instanceof YAMLMap
  ) {
    const mutate = source
    delete mutate.toJSON
    delete mutate.sd
    delete mutate.tag
  } else if (source instanceof Pair) {
    const mutate = source
    // indicates performance opportunity...
    if (typeof mutate.key !== "string") {
      mutate.key.value = `${mutate.key.value}`
      delete mutate.key.tag
      delete mutate.value.toJSON
      delete mutate.value.sd
      delete mutate.value.tag
    }
  } else {
    console.log(source)
    throw new Error("discloseReplace, Unhandled disclosure case")
  }
}

export const disclose = (source, target) => {
  const doc1 = parseCustomTags(source)
  const doc2 = parseCustomTags(target)
  discloseWalkMap(doc1.contents, doc2.contents)
  return stringify(doc1, yamlOptions)
}
