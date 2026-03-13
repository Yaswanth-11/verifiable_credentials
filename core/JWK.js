import { generateKeyPair, exportJWK, calculateJwkThumbprint } from "jose"

const format = jwk => {
  const { kid, x5u, x5c, x5t, kty, crv, alg, key_ops, x, y, d, ...rest } = jwk
  return JSON.parse(
    JSON.stringify({
      kid,
      x5u,
      x5c,
      x5t,
      kty,
      crv,
      alg,
      key_ops,
      x,
      y,
      d,
      ...rest
    })
  )
}

export const getPublicKey = jwk => {  
  const { d, p, q, dp, dq, qi, oth, k, key_ops, ...publicKeyJwk } = jwk
  return format(publicKeyJwk)
}

const getExtractableKeyPair = async alg => {
  const keypair = await generateKeyPair(alg, { extractable: true })
  const publicKeyJwk = await exportJWK(keypair.publicKey)
  publicKeyJwk.alg = alg
  publicKeyJwk.kid = await calculateJwkThumbprint(publicKeyJwk)
  const secretKeyJwk = await exportJWK(keypair.privateKey)
  secretKeyJwk.alg = alg
  secretKeyJwk.kid = await calculateJwkThumbprint(secretKeyJwk)
  return {
    publicKeyJwk: format(publicKeyJwk),
    secretKeyJwk: format(secretKeyJwk)
  }
}

const JWK = { format, getPublicKey, generate: getExtractableKeyPair }

export default JWK
