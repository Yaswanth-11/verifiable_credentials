import Verifier from "../lib/Verifier.js";

import digester from "./digester.js";
import JWS from "../lib/JWS.js";

import Parse from "../lib/Parse.js";

export default function verifier(options) {
  if (!options.digester) {
    options.digester = digester();
  }
  if (options.publicKeyJwk) {
    const { publicKeyJwk } = options;
    options.alg = options.alg || publicKeyJwk.alg;
    if (!options.alg) {
      throw new Error(
        "alg must be passed as an option or restricted via publicKeyJwk"
      );
    }
    options.verifier = {
      verify: async (token) => {
        const { jwt } = Parse.compact(token);
        const verifier = await JWS.verifier(publicKeyJwk);
        return verifier.verify(jwt);
      },
    };
  }
  return {
    verify: async ({ token, audience, nonce }) => {
      const role = new Verifier(options);
      const verified = await role.verify({
        presentation: token,
        aud: audience,
        nonce: nonce,
      });
      return verified;
    },
  };
}
