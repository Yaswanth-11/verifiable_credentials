import Issuer from './lib/Issuer.js'
import Holder from './lib/Holder.js'
import Verifier from './lib/Verifier.js'
import JWK from './lib/JWK.js'
import JWS from './lib/JWS.js'
import Parse from './lib/Parse.js'

import YAML from './YAML-SD/index.js'

import v2 from './v2/index.js'

//export * from './types'

const sd = { ...v2, YAML, JWK, JWS, Issuer, Holder, Verifier, Parse }

export default sd