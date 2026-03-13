/**
 * Internationalization (i18n) utility for API response messages.
 * Supports English (en) and Arabic (ar) languages.
 * Controlled via the ENABLE_I18N environment variable.
 */

const messages = {
  en: {
    // Holder
    HOLDER_KEYS_CREATED: "Holder keys created successfully.",
    HOLDER_KEYS_FAILED:
      "Internal Server Error. Failed to generate Holder keys.",

    // EC Key Pair
    EC_KEYPAIR_CREATED: "EcDSA Key Pair created successfully.",
    EC_KEYPAIR_FAILED: "Internal Server Error. Failed to generate EC keys.",

    // Verifier Key Pair
    VERIFIER_KEYS_CREATED: "Verifier keys created successfully.",
    VERIFIER_KEYS_FAILED:
      "Internal Server Error. Failed to generate verifier keys.",

    // Verifiable Credential
    VC_ISSUED: "Successfully generated Verifiable Credential.",
    VC_ISSUE_FAILED: "Failed to issue Verifiable Credential.",
    VC_RLC_ISSUED:
      "Revocation list credential and verifiable credential created successfully.",

    // RLC
    RLC_CREATED: "Revocation list credential created successfully.",
    RLC_UPDATED: "Revocation list credential updated successfully.",
    RLC_DECODED: "Revocation list credential decoded successfully.",
    RLC_DECODE_FAILED: "Failed to decode revocation list credential.",
    RLC_UNKNOWN_ERROR: "Unknown Error Occurred.",

    // Schema
    SCHEMA_GENERATED: "Credential schema generated successfully.",
    SCHEMA_FAILED: "Failed to generate credential schema.",

    // VP
    VP_GENERATED: "Successfully generated Verifiable Presentation.",
    VP_FAILED: "Unknown Error Occurred.",

    // Request URI
    REQUEST_URI_GENERATED: "Request URI generated successfully.",
    REQUEST_URI_FAILED: "Unknown Error Occurred.",

    // Presentation Submission
    PS_GENERATED: "Creating Presentation submission successful.",
    PS_FAILED: "Unknown Error Occurred.",

    // Request Object
    REQUEST_OBJ_FETCHED: "Request object fetched successfully.",
    REQUEST_OBJ_FAILED: "Unknown Error Occurred.",

    // Presentation Definition
    PD_PARSED: "Parsing of Presentation Definition successful.",
    PD_PARSE_FAILED: "Unknown Error Occurred.",

    // VP Token
    VP_TOKEN_SUBMITTED: "VP token submission successful.",
    VP_TOKEN_SUBMIT_FAILED: "Unknown Error Occurred.",

    // Verification
    VERIFICATION_RESULT_FETCHED: "Verification result fetched successfully.",
    VERIFICATION_NOT_AVAILABLE: "Verification result not yet available.",
    VERIFICATION_FAILED: "Unknown Error Occurred.",

    // VP Token Verification
    VP_TOKEN_VERIFIED: "VP Token verification successful.",
    VP_TOKEN_VERIFY_FAILED: "Unknown Error Occurred.",

    // VC Verification
    VC_VERIFIED: "VC verification successful.",
    VC_VERIFY_FAILED: "Unknown Error Occurred.",

    // Credential Status
    STATUS_CHECK_OK: "Status check successful.",
    STATUS_CHECK_FAILED: "Failed to check status of the verifiable credential.",

    // Blockchain Logs
    LOG_ADDED: "Log added successfully.",
    LOG_ADD_FAILED: "Failed to add logs to the blockchain.",
    LOGS_FETCHED: "Logs fetched successfully.",
    LOGS_FETCH_FAILED: "Failed to fetch logs from the blockchain.",

    // Transaction
    TXN_FETCHED: "Transaction details fetched successfully.",
    TXN_FETCH_FAILED: "Failed to fetch transaction details.",

    // JWT VC
    JWT_VC_ISSUED: "Successfully generated JWT Verifiable Credential.",
    JWT_VC_ISSUE_FAILED: "Failed to issue JWT Verifiable Credential.",
    JWT_VC_RLC_ISSUED:
      "Revocation list credential and verifiable credential created successfully.",

    // JWT VP
    JWT_VP_GENERATED: "Successfully generated JWT Verifiable Presentation.",
    JWT_VP_FAILED: "Failed to generate JWT Verifiable Presentation.",

    // JWT VP Verification
    JWT_VP_VERIFIED:
      "Successfully generated Verification Result of JWT Verifiable Presentation.",
    JWT_VP_VERIFY_FAILED: "Failed to verify JWT Verifiable Presentation.",

    // Blockchain Contract
    RECORD_ADDED: "Log Record added successfully.",
    RECORD_ADD_FAILED: "Failed to insert log record to the blockchain.",
    RECORD_FETCHED: "Log Record fetched successfully.",
    RECORD_FETCH_FAILED: "Failed to fetch log record from the blockchain.",
    RECORD_RANGE_FETCH_FAILED: "Failed to fetch records by range.",
    IDENTIFIERS_FETCHED: "Identifiers fetched successfully.",
    IDENTIFIERS_FETCH_FAILED: "Failed to fetch Identifiers.",
    RECEIPT_FETCHED: "Receipt fetched successfully.",
    RECEIPT_FETCH_FAILED: "Failed to fetch Receipt.",
    DID_STORED: "DID stored successfully.",
    DID_STORE_FAILED: "Failed to store DID.",
    DID_FETCHED: "DID fetched successfully.",
    DID_FETCH_FAILED: "Failed to fetch DID.",

    // Generic
    UNKNOWN_ERROR: "Unknown Error Occurred.",
    INTERNAL_SERVER_ERROR: "Internal Server Error.",
  },

  ar: {
    // Holder
    HOLDER_KEYS_CREATED: "تم إنشاء مفاتيح الحامل بنجاح.",
    HOLDER_KEYS_FAILED: "خطأ داخلي في الخادم. فشل إنشاء مفاتيح الحامل.",

    // EC Key Pair
    EC_KEYPAIR_CREATED: "تم إنشاء زوج مفاتيح EcDSA بنجاح.",
    EC_KEYPAIR_FAILED: "خطأ داخلي في الخادم. فشل إنشاء مفاتيح EC.",

    // Verifier Key Pair
    VERIFIER_KEYS_CREATED: "تم إنشاء مفاتيح المتحقق بنجاح.",
    VERIFIER_KEYS_FAILED: "خطأ داخلي في الخادم. فشل إنشاء مفاتيح المتحقق.",

    // Verifiable Credential
    VC_ISSUED: "تم إنشاء الاعتماد القابل للتحقق بنجاح.",
    VC_ISSUE_FAILED: "فشل إصدار الاعتماد القابل للتحقق.",
    VC_RLC_ISSUED:
      "تم إنشاء اعتماد قائمة الإلغاء والاعتماد القابل للتحقق بنجاح.",

    // RLC
    RLC_CREATED: "تم إنشاء اعتماد قائمة الإلغاء بنجاح.",
    RLC_UPDATED: "تم تحديث اعتماد قائمة الإلغاء بنجاح.",
    RLC_DECODED: "تم فك تشفير اعتماد قائمة الإلغاء بنجاح.",
    RLC_DECODE_FAILED: "فشل فك تشفير اعتماد قائمة الإلغاء.",
    RLC_UNKNOWN_ERROR: "حدث خطأ غير معروف.",

    // Schema
    SCHEMA_GENERATED: "تم إنشاء مخطط الاعتماد بنجاح.",
    SCHEMA_FAILED: "فشل إنشاء مخطط الاعتماد.",

    // VP
    VP_GENERATED: "تم إنشاء العرض القابل للتحقق بنجاح.",
    VP_FAILED: "حدث خطأ غير معروف.",

    // Request URI
    REQUEST_URI_GENERATED: "تم إنشاء عنوان URI للطلب بنجاح.",
    REQUEST_URI_FAILED: "حدث خطأ غير معروف.",

    // Presentation Submission
    PS_GENERATED: "تم إنشاء تقديم العرض بنجاح.",
    PS_FAILED: "حدث خطأ غير معروف.",

    // Request Object
    REQUEST_OBJ_FETCHED: "تم جلب كائن الطلب بنجاح.",
    REQUEST_OBJ_FAILED: "حدث خطأ غير معروف.",

    // Presentation Definition
    PD_PARSED: "تم تحليل تعريف العرض بنجاح.",
    PD_PARSE_FAILED: "حدث خطأ غير معروف.",

    // VP Token
    VP_TOKEN_SUBMITTED: "تم تقديم رمز VP بنجاح.",
    VP_TOKEN_SUBMIT_FAILED: "حدث خطأ غير معروف.",

    // Verification
    VERIFICATION_RESULT_FETCHED: "تم جلب نتيجة التحقق بنجاح.",
    VERIFICATION_NOT_AVAILABLE: "نتيجة التحقق غير متوفرة بعد.",
    VERIFICATION_FAILED: "حدث خطأ غير معروف.",

    // VP Token Verification
    VP_TOKEN_VERIFIED: "تم التحقق من رمز VP بنجاح.",
    VP_TOKEN_VERIFY_FAILED: "حدث خطأ غير معروف.",

    // VC Verification
    VC_VERIFIED: "تم التحقق من الاعتماد بنجاح.",
    VC_VERIFY_FAILED: "حدث خطأ غير معروف.",

    // Credential Status
    STATUS_CHECK_OK: "تم فحص الحالة بنجاح.",
    STATUS_CHECK_FAILED: "فشل فحص حالة الاعتماد القابل للتحقق.",

    // Blockchain Logs
    LOG_ADDED: "تمت إضافة السجل بنجاح.",
    LOG_ADD_FAILED: "فشل إضافة السجلات إلى سلسلة الكتل.",
    LOGS_FETCHED: "تم جلب السجلات بنجاح.",
    LOGS_FETCH_FAILED: "فشل جلب السجلات من سلسلة الكتل.",

    // Transaction
    TXN_FETCHED: "تم جلب تفاصيل المعاملة بنجاح.",
    TXN_FETCH_FAILED: "فشل جلب تفاصيل المعاملة.",

    // JWT VC
    JWT_VC_ISSUED: "تم إنشاء اعتماد JWT القابل للتحقق بنجاح.",
    JWT_VC_ISSUE_FAILED: "فشل إصدار اعتماد JWT القابل للتحقق.",
    JWT_VC_RLC_ISSUED:
      "تم إنشاء اعتماد قائمة الإلغاء واعتماد JWT القابل للتحقق بنجاح.",

    // JWT VP
    JWT_VP_GENERATED: "تم إنشاء عرض JWT القابل للتحقق بنجاح.",
    JWT_VP_FAILED: "فشل إنشاء عرض JWT القابل للتحقق.",

    // JWT VP Verification
    JWT_VP_VERIFIED: "تم إنشاء نتيجة التحقق من عرض JWT القابل للتحقق بنجاح.",
    JWT_VP_VERIFY_FAILED: "فشل التحقق من عرض JWT القابل للتحقق.",

    // Blockchain Contract
    RECORD_ADDED: "تمت إضافة سجل السجل بنجاح.",
    RECORD_ADD_FAILED: "فشل إدراج سجل السجل في سلسلة الكتل.",
    RECORD_FETCHED: "تم جلب سجل السجل بنجاح.",
    RECORD_FETCH_FAILED: "فشل جلب سجل السجل من سلسلة الكتل.",
    RECORD_RANGE_FETCH_FAILED: "فشل جلب السجلات حسب النطاق.",
    IDENTIFIERS_FETCHED: "تم جلب المعرفات بنجاح.",
    IDENTIFIERS_FETCH_FAILED: "فشل جلب المعرفات.",
    RECEIPT_FETCHED: "تم جلب الإيصال بنجاح.",
    RECEIPT_FETCH_FAILED: "فشل جلب الإيصال.",
    DID_STORED: "تم تخزين DID بنجاح.",
    DID_STORE_FAILED: "فشل تخزين DID.",
    DID_FETCHED: "تم جلب DID بنجاح.",
    DID_FETCH_FAILED: "فشل جلب DID.",

    // Generic
    UNKNOWN_ERROR: "حدث خطأ غير معروف.",
    INTERNAL_SERVER_ERROR: "خطأ داخلي في الخادم.",
  },
};

/**
 * Get a translated message by key and language.
 * Falls back to English if the key is not found in the requested language.
 *
 * @param {string} key - The message key to look up.
 * @param {string} lang - The language code ("en" or "ar").
 * @returns {string} The translated message.
 */
export const getMessage = (key, lang = "en") => {
  // If i18n is disabled, always return English
  if (process.env.ENABLE_I18N !== "true") {
    return messages.en[key] || key;
  }

  const language = lang === "ar" ? "ar" : "en";
  return (
    (messages[language] && messages[language][key]) || messages.en[key] || key
  );
};

export default messages;
