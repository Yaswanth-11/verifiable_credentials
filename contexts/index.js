import {
  constants as credentialConstants,
  contexts as credentialsContexts,
} from "credentials-context";
import {
  constants as didConstants,
  contexts as didContexts,
} from "did-context";
import {
  constants as v1Constants,
  contexts as v1Contexts,
} from "veres-one-context";

import { invalidId } from "./invalid_id.js";
import { nullId } from "./null_id.js";
import { nullType } from "./null_type.js";
import { nullVersion } from "./null_version.js";

const { CREDENTIALS_CONTEXT_V1_URL } = credentialConstants;
const { DID_CONTEXT_URL } = didConstants;
const { VERES_ONE_CONTEXT_V1_URL } = v1Constants;

import { vcV1CtxUrl, vcV1CtxData } from "./vcV1Ctx.js";
import { vcRevokeUrl, vcRevokeCtx } from "./vcRevokeCtx.js";
import { vcV1SecUrl, vcV1SecCtx } from "./vcDataSecurity.js";

export const invalidContexts = {
  vcV1: {
    url: vcV1CtxUrl,
    value: vcV1CtxData,
  },
  vcRevoke: {
    url: vcRevokeUrl,
    value: vcRevokeCtx,
  },
  vcV1Sec: {
    url: vcV1SecUrl,
    value: vcV1SecCtx,
  },
  veresOne: {
    url: VERES_ONE_CONTEXT_V1_URL,
    value: v1Contexts.get(VERES_ONE_CONTEXT_V1_URL),
  },
  did: {
    url: DID_CONTEXT_URL,
    value: didContexts.get(DID_CONTEXT_URL),
  },
  valid: {
    url: CREDENTIALS_CONTEXT_V1_URL,
    value: credentialsContexts.get(CREDENTIALS_CONTEXT_V1_URL),
  },
  invalidId: {
    url: "https://invalid-id.org",
    value: invalidId,
  },
  nullVersion: {
    url: "https://null-version.org",
    value: nullVersion,
  },
  nullId: {
    url: "https://null-id.org",
    value: nullId,
  },
  nullType: {
    url: "https://null-type.org",
    value: nullType,
  },
  nullDoc: {
    url: "https://null-doc.org",
    value: null,
  },
};
