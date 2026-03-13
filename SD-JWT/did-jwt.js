import {driver} from '@digitalbazaar/did-method-jwk'

const didJwkDriver = driver();
const algorithm="ES256";
const purpose="verificationMethod";
const  {didDocument, keyPairs, methodFor} = await didJwkDriver.generate({algorithm});
//console.log(didDocument);
//console.log(methodFor({purpose}));
console.log(keyPairs);