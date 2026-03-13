import {driver} from '@digitalbazaar/did-method-jwk'

import sd from './index.js'

const alg1 = 'ES384';
//const claimset = './sampleClaims.yaml';

const didJwkDriver = driver();
const algorithm="ES256";
const purpose="verificationMethod";

const  {didDocument, keyPairs, methodFor} = await didJwkDriver.generate({algorithm});
//console.log(didDocument);
console.log(methodFor({purpose}));
//console.log(keyPairs);


const issuerRole = await sd.key.generate(alg1);
const publicKeyJwk=issuerRole.publicKeyJwk;

const doc=await didJwkDriver.publicKeyToDidDoc({publicKeyJwk});
console.log(doc);

const issuerId = doc.id;
const issuerKeyId = doc.verificationMethod.id;

const holderRole = await sd.key.generate(alg1); // or get it some other way.
const holderId = 'did:example:ebfeb1f712ebc6f1c276e12ec21'
const holderKeyId = `${holderId}#${holderRole.publicKeyJwk.kid}`


const claimset1 = `
"@context":
  - https://www.w3.org/ns/credentials/v2
  - https://www.w3.org/ns/credentials/examples/v2
id: http://university.example/credentials/3732
type:
  - VerifiableCredential
  - ExampleDegreeCredential
issuer:
  id: https://university.example/issuers/565049
  name:
    - value: test value 0
      lang: en
    - !sd
      value: test value 1
      lang: en
    - value: test value 2
      lang: en
    - !sd
      value: test value 3
      lang: en
    - value: test value 4
      lang: en
validFrom: 2015-05-10T12:30:00Z
credentialStatus:
  - id: https://vendor.example/status-list/urn:uuid:d31ada5d-1d3d-4f68-8587-8ff9bb3038d6#0
    type: StatusList2021Entry
    statusPurpose: revocation
    statusListIndex: "0"
    statusListCredential: https://vendor.example/status-list/urn:uuid:d31ada5d-1d3d-4f68-8587-8ff9bb3038d6
credentialSubject:
  id: did:example:ebfeb1f712ebc6f1c276e12ec21
  degree:
    type: ExampleBachelorDegree
    subtype: Bachelor of Science and Arts
`;

const vc = await sd.issuer({ 
  iss: issuerId, 
  kid: issuerKeyId,
  typ: `application/vc+ld+json+sd-jwt`,
  cty: `application/vc+ld+json`,
  secretKeyJwk: issuerRole.secretKeyJwk 
})
.issue({
  holder: holderKeyId,
  claimset:claimset1
})

console.log(vc);





import * as jose from "jose"


const signer = async privateKeyJwk => {
  const privateKey = await jose.importJWK(privateKeyJwk)
  return privateKey;
}

const sign= async ({ protectedHeader, claimset, privateKey}) => {
  return new jose.CompactSign(
    new TextEncoder().encode(JSON.stringify(claimset))
  )
    .setProtectedHeader(protectedHeader)
    .sign(privateKey)
}

const typ='jwt';
const alg='ES256';
const protectedHeader=[alg,typ];
const claimset2={
  iss:"https://issuer.example.com"
}

const some=await signer(issuerRole.secretKeyJwk);
const signed=await sign({protectedHeader,claimset:claimset2,privateKey:some});

console.log(signed);