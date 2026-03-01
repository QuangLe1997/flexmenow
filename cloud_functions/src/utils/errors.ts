import { HttpsError, FunctionsErrorCode } from "firebase-functions/v2/https";

/**
 * Throw when the caller is not authenticated.
 */
export function throwUnauthenticated(message = "Authentication required."): never {
  throw new HttpsError("unauthenticated", message);
}

/**
 * Throw when input validation fails.
 */
export function throwInvalidArgument(message: string): never {
  throw new HttpsError("invalid-argument", message);
}

/**
 * Throw when the user does not have enough credits.
 */
export function throwInsufficientCredits(
  required: number,
  current: number
): never {
  throw new HttpsError("permission-denied", "Insufficient credits.", {
    code: "INSUFFICIENT_CREDITS",
    required,
    current,
  });
}

/**
 * Throw when a requested resource is not found.
 */
export function throwNotFound(resource: string, id: string): never {
  throw new HttpsError("not-found", `${resource} '${id}' not found.`);
}

/**
 * Throw when an internal error occurs during processing.
 */
export function throwInternal(message: string, details?: unknown): never {
  throw new HttpsError("internal", message, details as Record<string, unknown>);
}

/**
 * Throw a permission denied error.
 */
export function throwPermissionDenied(message = "Permission denied."): never {
  throw new HttpsError("permission-denied", message);
}

/**
 * Throw when the user has exceeded rate limits.
 */
export function throwResourceExhausted(message = "Rate limit exceeded. Please try again later."): never {
  throw new HttpsError("resource-exhausted", message);
}

/**
 * Wrap an unknown error into an HttpsError for safe client exposure.
 * Preserves HttpsError instances; wraps everything else as internal.
 */
export function wrapError(error: unknown): HttpsError {
  if (error instanceof HttpsError) {
    return error;
  }
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";
  return new HttpsError("internal" as FunctionsErrorCode, message);
}
