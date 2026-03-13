import * as jose from "jose"

import JWK from "./JWK.js"

const signer = async privateKeyJwk => {
  const privateKey = await jose.importJWK(privateKeyJwk)
  return {
    sign: async ({ protectedHeader, claimset }) => {
      return new jose.CompactSign(
        new TextEncoder().encode(JSON.stringify(claimset))
      )
        .setProtectedHeader(protectedHeader)
        .sign(privateKey)
    }
  }
}

const verifier = async publicKeyJwk => {
  const publicKey = await jose.importJWK(JWK.getPublicKey(publicKeyJwk))
  return {
    verify: async jws => {
      const result = await jose.compactVerify(jws, publicKey)
      return {
        protectedHeader: result.protectedHeader,
        claimset: JSON.parse(new TextDecoder().decode(result.payload))
      }
    }
  }
}

const JWS = { signer, verifier }

export default JWS
