import * as Ed25519Multikey from "@digitalbazaar/ed25519-multikey";
import * as EcdsaMultikey from "@digitalbazaar/ecdsa-multikey";
import * as Bls12381Multikey from "@digitalbazaar/bls12-381-multikey";

import * as base58btc from "base58-universal";

import crypto from "crypto";

import EC from "eckles";
import jose from "node-jose";
import JWK from "./JWK.js";

import { generateDID } from "./DID.js";
import logger from "../utils/logger.js";

//import { pkcs8ToJwk } from "./pem2jwk.js";

import pkcs2Jwk from "./pem2jwk.js";

/**
 * Utility to create an Ed25519 key pair for the Holder.
 *
 * @param {string} seed - Base64 encoded seed string used for key pair generation.
 * @returns {Promise<Object>} - The generated key pair containing public/private keys, DID, and DID Document.
 * @throws {Error} - Throws error if Ed25519 key pair creation fails.
 */

export const createEDKeyPair = async (seed) => {
  try {
    logger.info(
      "createEDKeyPair | Initiating Ed25519 key pair creation process."
    );
    const seedBuffer = new Uint8Array(Buffer.from(seed, "utf-8"));

    const keyPair = await Ed25519Multikey.generate({ seed: seedBuffer });

    logger.info(
      "createEDKeyPair | Ed25519 key pair generated. Proceeding to generate DID."
    );

    const { did, didDocument } = await generateDID(keyPair, "Ed25519");

    keyPair.controller = didDocument.id;
    keyPair.id = didDocument.verificationMethod[0].id;

    logger.info(
      "createEDKeyPair | Ed25519 key pair creation and DID generation successful."
    );

    return { keyPair, did, didDocument };
  } catch (error) {
    logger.error("createEDKeyPair | Failed to create Ed25519 Key Pair.");
    throw error;
  }
};

/**
 * Utility to create an ec key pair for the Holder.
 *
 * @param {string} seed - The seed for key pair generation.
 * @returns {Promise<Object>} - The generated key pair.
 */

const convertJWKToECKeyPair = async (jwk) => {
  try {
    logger.info("convertJWKToECKeyPair |Converting JWK to EC key pair.");

    const keyPair = await EcdsaMultikey.fromJwk({ jwk, secretKey: true });

    logger.info(
      "convertJWKToECKeyPair | Key pair created. Retrieving public key and DID."
    );

    const { did, didDocument } = await generateDID(keyPair, "EC");

    keyPair.controller = didDocument.id;
    keyPair.id = didDocument.verificationMethod[0].id;

    logger.info(
      "convertJWKToECKeyPair | Successfully completed key pair generation."
    );

    return { keyPair, did, didDocument };
  } catch (error) {
    logger.error("convertJWKToECKeyPair | Error related to DID creation");
    throw error;
  }
};

/**
 * Utility to convert ec multikey to jwt
 *
 * @param {string} keypair - The EC multi key pair
 * @returns {Promise<Object>} - The generated jwt key pair.
 */

export const getJwkFromMultiKey = async (keypair, alg) => {
  try {
    logger.info("Converting EC key pair to JWK");
    let jwk;

    if (keypair.secretKey?.length == 64) {
      keypair.secretKey = keypair.secretKey.slice(32);
    }

    if (alg == "EC") {
      jwk = await EcdsaMultikey.toJwk({
        keyPair: keypair,
        secretKey: true,
      });
    } else if (alg == "ED") {
      jwk = await Ed25519Multikey.toJwk({
        keyPair: keypair,
        secretKey: true,
      });
    }

    return jwk;
  } catch (error) {
    logger.error("Error in Function getJwkFromMultiKey");
    throw error;
  }
};

/**
 * Convert PEM string to EC Key Pair.
 *
 * @param {string} pemString - The PEM string to be converted to an EC Key Pair.
 * @returns {Promise<Object>} - EC Key Pair including `keyPair`, `did`, and `didDocument`.
 * @throws {Error} - Throws error if PEM conversion fails.
 */
export const convertPEMToECKeyPair = async (pemString, isOpenssl) => {
  try {
    logger.info("convertPEMToECKeyPair | Converting PEM to EC key pair.");

    let ecJWK = "";
    let data;

    const keyObject = crypto.createPrivateKey({
      key: pemString,
      format: "pem",
      type: "sec1",
    });

    data = keyObject.export({ format: "jwk" });

    ecJWK = {
      key_ops: ["sign"],
      ext: true,
      kty: data.kty,
      x: data.x,
      y: data.y,
      crv: data.crv,
      d: data.d,
    };

    if (0) {
      if (isOpenssl) {
        const jwk = await EC.toJwk({ pem: pemString });

        logger.info(
          `convertPEMToECKeyPair | x and y values of jwk ${jwk.x} ${jwk.y}`
        );

        ecJWK = {
          key_ops: ["sign"],
          ext: true,
          kty: "EC",
          x: jwk.x,
          y: jwk.y,
          crv: "P-256",
          d: jwk.d,
        };
      } else {
        pkcs2Jwk.pkcs8ToJwk(pemString, (err, jwk) => {
          if (err) {
            throw err;
          }
          data = jwk;
        });

        ecJWK = {
          key_ops: ["sign"],
          ext: true,
          kty: data.kty,
          x: data.x,
          y: data.y,
          crv: data.crv,
          d: data.d,
        };
      }
    }

    if (false && "unwanted_code") {
      const privateKey = await jose.importPKCS8(pemString, "ES256");
      console.log(privateKey);
      pkcs2Jwk.ssleayToJwk(pemString, (err, jwk) => {
        if (err) {
          throw err;
        }
        data = jwk;
      });
      jose.JWK.asKey(pemString, "pem").then(function (result) {
        let res = result.toJSON(true);
        let output = JSON.stringify(res, null, 2);
        console.log(output);
      });
      const joseData = await jose.JWK.asKey(pemString, "pem");
      const data = joseData.toJSON(true);
      console.dir(data);
    }

    const ecKeyPair = await convertJWKToECKeyPair(ecJWK);
    logger.info(
      "convertPEMToECKeyPair | PEM to EC key pair conversion successful."
    );

    return ecKeyPair;
  } catch (error) {
    logger.error(
      "convertPEMToECKeyPair | Failed to convert PEM to EC Key Pair."
    );
    throw error;
  }
};

/**
 * Generate a BBS key pair.
 *
 * @param {string} seed - The seed used for BBS key pair generation.
 * @returns {Promise<Object>} - BBS key pair including `keyPair`, `did`, and `didDocument`.
 * @throws {Error} - Throws error if BBS key pair generation fails.
 */
export const createBBSKeyPair = async (seed) => {
  try {
    logger.info("Generating BBS key pair.");

    const algorithm = "BBS-BLS12-381-SHA-256";
    const seedBuffer = new Uint8Array(Buffer.from(seed, "utf-8"));

    const keyPair = await Bls12381Multikey.generateBbsKeyPair({
      algorithm,
      seedBuffer,
    });
    logger.info("Key pair created. Retrieving public key and DID.");

    const { did, didDocument } = await generateDID(keyPair, "BBS");

    keyPair.controller = didDocument.id;
    keyPair.id = didDocument.verificationMethod[0].id;

    logger.info("Successfully completed key pair generation.");

    return { keyPair, did, didDocument };
  } catch (error) {
    logger.error("Failed to generate BBS key pair.", {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Generate an EC Key Pair.
 *
 * @param {string} seed - The Base64 encoded seed to generate the EC Key Pair.
 * @returns {Promise<Object>} - EC Key Pair including `keyPair`, `did`, and `didDocument`.
 * @throws {Error} - Throws error if EC key pair generation fails.
 */
export const createECKeyPair = async (seed, isOpenssl = true) => {
  try {
    logger.info("createECKeyPair | Generating EC key pair.");

    let ECKeyPair;

    if (!seed.kty) {
      logger.error("createECKeyPair seed ", JSON.stringify(seed, null, 2));
      // Create a buffer from the string
      const buffer = Buffer.from(seed, "base64");

      // Encode the Buffer as a utf8 string
      let decodedString = buffer.toString("utf8");

      ECKeyPair = await convertPEMToECKeyPair(decodedString, isOpenssl);
    } else {
      ECKeyPair = await convertJWKToECKeyPair(seed);
    }
    logger.info("createECKeyPair | EC key pair generation successful.");

    const { keyPair, did, didDocument } = ECKeyPair;

    logger.info(`createECKeyPair | Key pair ID: ${did}`);
    return { keyPair, did, didDocument };
  } catch (error) {
    logger.error("createECKeyPair | Failed to generate EC key pair.");
    throw error;
  }
};

/**
 * Utility function to generate an EC key pair in JWK format.
 *
 * @returns {Promise<Object>} - The generated EC key pair in JWK format.
 * @throws {Error} - Throws error if JWK generation fails.
 */
export const createJWK = async () => {
  try {
    logger.debug("createJWK | Initiating JWK generation process.");

    const keyPair = await JWK.generate("ES256");

    logger.info("createJWK | JWK successfully generated.");

    return keyPair;
  } catch (error) {
    logger.error("createJWK | Error during JWK generation.");
    throw error;
  }
};

/**
 * Utility to convert ec multikey to jwt
 *
 * @param {string} keypair - The EC multi key pair
 * @returns {Promise<Object>} - The generated jwt key pair.
 */

export const getJwkfromDidMultibase = async (kid) => {
  try {
    logger.info("Converting public key multibase to public key");

    const DIDMethod = kid.split("#")[0];

    const publicKeyMultibase = DIDMethod.split(":")[2];
    const firstFourCharacters = publicKeyMultibase.slice(0, 4);

    if (
      !(
        publicKeyMultibase &&
        typeof publicKeyMultibase === "string" &&
        publicKeyMultibase[0] === "z"
      )
    ) {
      throw new Error(
        '"publicKeyMultibase" must be a multibase, base58-encoded string.'
      );
    }
    // remove multibase header
    const publicKeyMulticodec = base58btc.decode(publicKeyMultibase.substr(1));

    let jwk;
    let alg;

    const publicKeyJwk = {};

    if (firstFourCharacters == "z6Mk") {
      // remove multicodec header
      const publicKey = publicKeyMulticodec.slice(2);
      const keyPair = {
        publicKey: publicKey,
      };

      jwk = await Ed25519Multikey.toJwk({
        keyPair,
      });
      alg = "EdDSA";
    } else if (firstFourCharacters == "zDna") {
      // remove multicodec header
      const publicKey = publicKeyMulticodec.slice(3);
      const keyPair = {
        publicKey: publicKey,
        publicKeyMultibase: publicKeyMultibase,
      };
      jwk = await EcdsaMultikey.toJwk({
        keyPair,
      });
      alg = "ES256";
      publicKeyJwk.y = jwk.y;
    }

    publicKeyJwk.x = jwk.x;
    publicKeyJwk.kty = jwk.kty;
    publicKeyJwk.crv = jwk.crv;
    publicKeyJwk.alg = alg;

    return publicKeyJwk;
  } catch (error) {
    logger.error("Error in Function getJwkFromMultiKey");
    throw error;
  }
};
