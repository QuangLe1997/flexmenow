import { onCall, CallableRequest } from "firebase-functions/v2/https";
import { REGION } from "../config/constants";
import { logger } from "../utils/logger";
import { wrapError } from "../utils/errors";

const LOG_CTX = { functionName: "checkGeo" };

export interface CheckGeoResult {
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  ip: string;
}

/**
 * checkGeo — Detect the caller's geographic location from their IP address.
 *
 * Uses request headers that Cloud Functions / Cloud Run automatically populates.
 * The X-Forwarded-For header contains the client's real IP when behind a load balancer.
 *
 * For MVP, this returns basic geo info derived from available request metadata.
 * In production, integrate a GeoIP database (MaxMind GeoLite2) or the
 * Google Maps Geolocation API for precise results.
 *
 * Use cases:
 * - Auto-detect user locale for i18n
 * - Show region-specific templates or content
 * - Compliance with regional regulations
 */
export const checkGeo = onCall(
  {
    region: REGION,
    timeoutSeconds: 10,
    memory: "256MiB",
    maxInstances: 100,
    enforceAppCheck: true,
  },
  async (request: CallableRequest): Promise<CheckGeoResult> => {
    try {
      // Extract the client IP from the request
      // Cloud Functions v2 exposes rawRequest for header access
      const rawRequest = request.rawRequest;
      const forwardedFor = rawRequest.headers["x-forwarded-for"];
      const clientIp = typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0].trim()
        : rawRequest.ip || "unknown";

      // Cloud Run / Cloud Functions set these headers automatically
      // when the request comes through Google's load balancer
      const cloudRegion = rawRequest.headers["x-cloud-trace-context"]
        ? REGION
        : "unknown";

      // Attempt to derive timezone from the Accept-Language header
      const acceptLanguage =
        (rawRequest.headers["accept-language"] as string) || "";
      const timezone = deriveTimezoneFromLanguage(acceptLanguage);
      const countryCode = deriveCountryFromLanguage(acceptLanguage);

      logger.debug(`Geo check for IP: ${clientIp}`, LOG_CTX);

      return {
        countryCode,
        region: cloudRegion,
        city: "unknown", // Requires GeoIP database for city-level resolution
        timezone,
        ip: clientIp,
      };
    } catch (error) {
      logger.error("Geo check failed", error, LOG_CTX);
      throw wrapError(error);
    }
  }
);

/**
 * Derive a likely timezone from the Accept-Language header.
 * This is a best-effort heuristic; real GeoIP is much more accurate.
 */
function deriveTimezoneFromLanguage(acceptLanguage: string): string {
  const lang = acceptLanguage.toLowerCase();
  const timezoneMap: Record<string, string> = {
    "vi": "Asia/Ho_Chi_Minh",
    "ja": "Asia/Tokyo",
    "ko": "Asia/Seoul",
    "pt-br": "America/Sao_Paulo",
    "pt": "Europe/Lisbon",
    "es-mx": "America/Mexico_City",
    "es": "Europe/Madrid",
    "en-us": "America/New_York",
    "en-gb": "Europe/London",
    "en": "America/New_York",
  };

  for (const [prefix, tz] of Object.entries(timezoneMap)) {
    if (lang.startsWith(prefix)) {
      return tz;
    }
  }

  return "UTC";
}

/**
 * Derive a likely country code from the Accept-Language header.
 */
function deriveCountryFromLanguage(acceptLanguage: string): string {
  const lang = acceptLanguage.toLowerCase();
  const countryMap: Record<string, string> = {
    "vi": "VN",
    "ja": "JP",
    "ko": "KR",
    "pt-br": "BR",
    "pt": "PT",
    "es-mx": "MX",
    "es": "ES",
    "en-us": "US",
    "en-gb": "GB",
    "en-au": "AU",
    "en": "US",
  };

  for (const [prefix, code] of Object.entries(countryMap)) {
    if (lang.startsWith(prefix)) {
      return code;
    }
  }

  return "US";
}
