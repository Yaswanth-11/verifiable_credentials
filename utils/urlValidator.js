import net from "net";

/**
 * Load allowed domains from ENV
 */
function getAllowedDomains() {
  return (process.env.ALLOWED_DOMAINS || "")
    .split(",")
    .map(d => d.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Load allowed ports from ENV
 */
function getAllowedPorts() {
  return (process.env.ALLOWED_PORTS || "443")
    .split(",")
    .map(p => p.trim())
    .filter(Boolean);
}

/**
 * Check if private hosts are allowed
 */
function isPrivateHostAllowed() {
  return (process.env.ALLOW_PRIVATE_HOSTS || "false")
    .toLowerCase() === "true";
}

/**
 * Main URL validation function
 */
export function buildValidatedUrl(input) {
  try {
    const url = new URL(input);

    // Protocol validation
    if (url.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }

    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");

    const allowedDomains = getAllowedDomains();

    if (!allowedDomains.length) {
      throw new Error("Allowed domains not configured");
    }

    // Allow exact domain or subdomain
    const isAllowedDomain = allowedDomains.some(domain =>
      hostname === domain || hostname.endsWith("." + domain)
    );

    if (!isAllowedDomain) {
      throw new Error("Host not allowed");
    }

    // Private / localhost / IP protection
    if (!isPrivateHostAllowed()) {
      if (hostname === "localhost" || net.isIP(hostname)) {
        throw new Error("Private or IP hosts not allowed");
      }
    }

    // Port validation
    // const allowedPorts = getAllowedPorts();

    // if (url.port && !allowedPorts.includes(url.port)) {
    //   throw new Error("Port not allowed");
    // }

    // Path traversal protection
    // if (url.pathname.includes("..")) {
    //   throw new Error("Invalid path");
    // }

    return url.toString();

  } catch (err) {
    throw new Error(`Invalid URL: ${err.message}`);
  }
}