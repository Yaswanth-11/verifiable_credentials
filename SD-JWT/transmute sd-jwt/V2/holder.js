import Holder from "../lib/Holder.js"
import YAML from "../YAML-SD/index.js"
import digester from "./digester.js"
import salter from "./salter.js"
import JWS from "../lib/JWS.js"

const holder = (options = {}) => {
  if (options.secretKeyJwk) {
    options.alg = options.secretKeyJwk.alg
  }
  if (!options.digester) {
    options.digester = digester()
  }
  if (!options.salter) {
    options.salter = salter()
  }
  if (!options.alg && options.signer) {
    throw new Error(
      "alg must be passed as an option or restricted via secretKeyJwk"
    )
  }
  return {
    issue: async ({ token, disclosure, audience, nonce }) => {
      if (options.secretKeyJwk) {
        options.signer = await JWS.signer(options.secretKeyJwk)
      }
      const role = new Holder(options)
      return role.present({
        credential: token,
        disclosure: YAML.load(disclosure),
        aud: audience,
        nonce: nonce
      })
    }
  }
}

export default holder
