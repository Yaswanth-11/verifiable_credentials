import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';

import { ES256, digest, generateSalt } from './cryptoModule.js';

import {subtle,KeyObject} from 'node:crypto';

export async function jwkToPem(publicKeyJWK,privateKeyJWK) {

  const publicKey = await subtle.importKey(
    'jwk',
    publicKeyJWK,
    {
      name: 'ECDSA',
      namedCurve: 'P-256', // Must match the curve used to generate the key
    },
    true, // whether the key is extractable (i.e., can be used in exportKey)
    ['verify'],
  );

  const privateKey = await subtle.importKey(
    'jwk',
    privateKeyJWK,
    {
      name: 'ECDSA',
      namedCurve: 'P-256', // Must match the curve used to generate the key
    },
    true, // whether the key is extractable (i.e., can be used in exportKey)
    ['sign'],
  );

  const publicKeyExportedPem=KeyObject.from(publicKey).export({ format: "pem", type: "spki"}).toString();
  const privateKeyExportedPem=KeyObject.from(privateKey).export({ format: "pem", type: "pkcs8"}).toString();

  console.log("publicKeyExportedPem",publicKeyExportedPem);
  console.log("privateKeyExportedPem",privateKeyExportedPem);

  //return {publicKeyExportedPem,privateKeyExportedPem};

}

const createSignerVerifier = async () => {
    const { privateKey, publicKey } = await ES256.generateKeyPair();

    jwkToPem(publicKey,privateKey);

    return {
      signer: await ES256.getSigner(privateKey),
      verifier: await ES256.getVerifier(publicKey),
    };
  };


const ietfClaims=async () => {
  const { signer, verifier } = await createSignerVerifier();


  // Create SDJwt instance for use
  const sdjwt = new SDJwtVcInstance({
    signer,
    verifier,
    signAlg: 'EcDSA',
    hasher: digest,
    hashAlg: 'SHA-256',
    saltGenerator: generateSalt,
  });

  // Issuer Define the claims object with the user's information
  const claims = {
    firstname: 'John',
    lastname: 'Doe',
    ssn: '123-45-6789',
    id: '1234',
  };

  const newClaims={"given_name": "John",
  "family_name": "Doe",
  "email": "johndoe@example.com",
  "phone_number": "+1-202-555-0101",
  "address": {
    "street_address": "123 Main St",
    "locality": "Anytown",
    "region": "Anystate",
    "country": "US"
  },
  "birthdate": "1940-01-01",
  "is_over_18": true,
  "is_over_21": true,
  "is_over_65": true
};


  // Issuer Define the disclosure frame to specify which claims can be disclosed
  const disclosureFrame = {
    _sd: ['firstname', 'lastname', 'ssn'],
  };

  // Issue a signed JWT credential with the specified claims and disclosures
  // Return a Encoded SD JWT. Issuer send the credential to the holder
  const credential = await sdjwt.issue(
    {
      iss: 'Issuer', //issuer did
      nbf: new Date().getTime(), // The time before which the Verifiable Credential MUST NOT be accepted before validating
      iat: new Date().getTime(), // time of issuence of vc
      exp: new Date().getTime()+10000, //The expiry time of the Verifiable Credential after which the Verifiable Credential is no longer valid.

      vct: 'https://credentials.example.com/identity_credential', // https://credentials.example.com/identity_credential
      sub:'holder', // holder did
      ...claims,
    },
    disclosureFrame,
  );

  console.log(credential);

  // Holder Receive the credential from the issuer and validate it
  // Return a result of header and payload
  const valid = await sdjwt.validate(credential);

  console.log("signedCredentialValid",valid);

  // Holder Define the presentation frame to specify which claims should be presented
  // The list of presented claims must be a subset of the disclosed claims
  // the presentation frame is determined by the verifier or the protocol that was agreed upon between the holder and the verifier
  const presentationFrame = { firstname: true, id: true, ssn: true };

  // Create a presentation using the issued credential and the presentation frame
  // return a Encoded SD JWT. Holder send the presentation to the verifier
  const presentation = await sdjwt.present(
    credential,
    presentationFrame,
  );


  console.log("presentation",presentation);

  // Verifier Define the required claims that need to be verified in the presentation
  const requiredClaims = ['firstname', 'ssn', 'id'];

  // Verify the presentation using the public key and the required claims
  // return a boolean result
  const verified = await sdjwt.verify(presentation, requiredClaims);
  console.log(verified);
};


export async function w3cJWT()
{

  const { signer, verifier } = await createSignerVerifier();

  // Create SDJwt instance for use
  const sdjwt = new SDJwtVcInstance({
    signer,
    verifier,
    signAlg: 'EcDSA',
    hasher: digest,
    hashAlg: 'SHA-256',
    saltGenerator: generateSalt,
  });

  // Issuer Define the claims object with the user's information
  const newClaims={given_name: "John",
  family_name: "Doe",
  email: "johndoe@example.com",
  phone_number: "+1-202-555-0101",
  address: {
    street_address: "123 Main St",
    locality: "Anytown",
    region: "Anystate",
    country: "US"
  },
  birthdate: "1940-01-01",
  is_over_18: true,
  is_over_21: true,
  is_over_65: true
};

// Issuer Define the disclosure frame to specify which claims can be disclosed
const disclosureFrame1 = {
  _sd: ['family_name', 'street_address', 'birthdate'],
  address:{
    _sd:['locality']
  }
};

// Issuer Define the claims object with the user's information
const Claims = {
  firstname: 'John',
  lastname: 'Doe',
  ssn: '123-45-6789',
  id: '1234',
  data: {
    firstname: 'John',
    lastname: 'Doe',
    ssn: '123-45-6789',
    list: [{ r: '1' }, 'b', 'c'],
  },
  data2: {
    hi: 'bye',
  },
};

// Issuer Define the disclosure frame to specify which claims can be disclosed
const disclosureFrame = {
  _sd: ['firstname', 'id', 'data2'],
  data: {
    _sd: ['list'],
    _sd_decoy: 2,
    list: {
      _sd: [0, 2],
      _sd_decoy: 1,
      0: {
        _sd: ['r'],
      },
    },
  },
  data2: {
    _sd: ['hi'],
  },
};

const vc ={
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://w3id.org/vdl/v1"
  ],
  "type": ["VerifiableCredential", "Iso18013DriversLicenseCredential"],
  "issuer": {
    "id": "did:key:z6MkjxvA4FNrQUhr8f7xhdQuP1VPzErkcnfxsRaU5oFgy2E5",
    "name": "NIRA"
  },
  "issuanceDate": "2023-11-15T10:00:00-07:00",
  "expirationDate": "2028-11-15T12:00:00-06:00",
  "name": "Driver's License",
  "image": "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUg...kSuQmCC",
  "description": "A license granting driving privileges in UG.",
  "credentialSubject": {
    "id": "did:example:12347abcd",
    "type": "LicensedDriver",
    "driversLicense": {
      "type": "Iso18013DriversLicense",
      "document_number": "542426814",
      "family_name": "TURNER",
      "given_name": "SUSAN",
      "portrait": "data:image/jpeg;base64,/9j/4AAQSkZJR...RSClooooP/2Q==",
      "birth_date": "1998-08-28",
      "issue_date": "2023-01-15T10:00:00-07:00",
      "expiry_date": "2028-08-27T12:00:00-06:00",
      "issuing_country": "UG",
      "age_over_21": false,
      "age_over_18": true,
      "age_over_25": false,
      "age_over_62": false,
      "age_over_65": false,
      "age_birth_year": 2004,
      "age_in_years":20
    }
  }
}


const VCdisclosureFrame = {
  credentialSubject:{
    driversLicense:{
       _sd:['family_name','birth_date','given_name']
    }
  }
};

//typ vc+ld+json+sd-jwt

const credential = await sdjwt.issue(
  {
    ...vc,
  },
  VCdisclosureFrame,
);


console.log(" credential : ",credential);



const credential1="eyJ0eXAiOiJ2YytzZC1qd3QiLCJhbGciOiJFY0RTQSJ9.eyJnaXZlbl9uYW1lIjoiSm9obiIsImVtYWlsIjoiam9obmRvZUBleGFtcGxlLmNvbSIsInBob25lX251bWJlciI6IisxLTIwMi01NTUtMDEwMSIsImFkZHJlc3MiOnsic3RyZWV0X2FkZHJlc3MiOiIxMjMgTWFpbiBTdCIsInJlZ2lvbiI6IkFueXN0YXRlIiwiY291bnRyeSI6IlVTIiwiX3NkIjpbIlc1VWoyZnZMV3JmRmhrWU1rT3FScUtLdUNWRVBBcnNaUnYySDVSVi1ST0UiXX0sImlzX292ZXJfMTgiOnRydWUsImlzX292ZXJfMjEiOnRydWUsImlzX292ZXJfNjUiOnRydWUsIl9zZCI6WyJNUWJYVW5Pb2lPZTZQZU15ejV5bTV0RDBrbEg2QV8zX0pLSmptamtjODZFIiwiYTNoNVRMVVZsSEtrY3Y0aGxvWXNCaWgzbkRBSmp3eTNoVDVpLWVsYkFZVSJdLCJfc2RfYWxnIjoiU0hBLTI1NiJ9.ZBoLpgh_4BhkhbtkJImD6kUxXoLLH2byWES7eN0ETvBvSNgjrqA0z5ZUTNRYwKod5ch62QYOOkuveUtN2z2eag~WyIwZmQ0MDBkYzIwMGU4NTZjIiwibG9jYWxpdHkiLCJBbnl0b3duIl0~WyI1MTE5ZDA1Mjg4OWEzY2IwIiwiZmFtaWx5X25hbWUiLCJEb2UiXQ~WyI0NDk2ZTBkMmM5Zjk1NzExIiwiYmlydGhkYXRlIiwiMTk0MC0wMS0wMSJd~"

  // Holder Receive the credential from the issuer and validate it
  // Return a result of header and payload
  const valid = await sdjwt.validate(credential);

  console.log("signedCredentialValid",valid); 

}


await w3cJWT();