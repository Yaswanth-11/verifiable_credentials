import key from "./key.js"
import salter from "./salter.js"
import digester from "./digester.js"

import issuer from "./issuer.js"
import holder from "./holder.js"
import verifier from "./verifier.js"

import JWS from "../lib/JWS.js"

const v2 = { ...JWS, key, salter, digester, issuer, holder, verifier }

export default v2
