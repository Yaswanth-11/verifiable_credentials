import Issuer from "../lib/Issuer.js"
import YAML from "../YAML-SD/index.js"
import digester from "./digester.js"
import salter from "./salter.js"
import JWS from "../lib/JWS.js"

const issuer = options => {
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
    issue: async ({ claimset, holder,iat,exp }) => {
      if (options.secretKeyJwk) {
        options.signer = await JWS.signer(options.secretKeyJwk)
      }
      const role = new Issuer({
        alg: options.alg,
        iss: options.iss,
        kid: options.kid,
        typ: options.typ,
        cty: options.cty,
        salter: options.salter,
        digester: options.digester,
        signer: options.signer
      })
      return role.issue({
        holder,
        iat,
        exp,
        claims: YAML.load(claimset)
      })
    }
  } 
}

export default issuer
