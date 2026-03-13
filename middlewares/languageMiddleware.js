import logger from "../utils/logger.js";

/**
 * Language detection middleware.
 * Reads the Accept-Language header and sets req.lang accordingly.
 *
 * Rules:
 * - If Accept-Language is empty or not present → "en" (English)
 * - If Accept-Language contains "ar" → "ar" (Arabic)
 * - If Accept-Language contains "en" or anything else → "en" (English)
 * - Feature is controlled by ENABLE_I18N env variable
 */
const languageMiddleware = (req, res, next) => {
  // Default to English
  req.lang = "en";

  // Only process if i18n is enabled
  if (process.env.ENABLE_I18N === "true") {
    const acceptLanguage = req.headers["accept-language"];

    if (acceptLanguage && acceptLanguage.trim() !== "") {
      // Check if Arabic is requested
      const lang = acceptLanguage.toLowerCase().trim();
      if (lang === "ar" || lang.startsWith("ar-") || lang.startsWith("ar,")) {
        logger.info(
          `Accept-Language header detected: ${acceptLanguage}. Setting language to Arabic.`,
        );
        req.lang = "ar";
      }
    }
  }

  next();
};

export default languageMiddleware;
