/**
 * Input validation helpers for Cloud Functions.
 * Each validator throws an HttpsError on failure.
 */
import { throwInvalidArgument } from "./errors";

/**
 * Assert that a value is a non-empty string.
 */
export function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throwInvalidArgument(`'${fieldName}' must be a non-empty string.`);
  }
  return value.trim();
}

/**
 * Assert that a value is a positive integer.
 */
export function requirePositiveInt(value: unknown, fieldName: string): number {
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  if (typeof num !== "number" || !Number.isInteger(num) || num <= 0) {
    throwInvalidArgument(`'${fieldName}' must be a positive integer.`);
  }
  return num;
}

/**
 * Assert that a value is a valid Firebase Storage path.
 * Must start with uploads/ or a recognized prefix and contain no .. traversal.
 */
export function requireStoragePath(value: unknown, fieldName: string): string {
  const path = requireString(value, fieldName);
  if (path.includes("..")) {
    throwInvalidArgument(`'${fieldName}' contains invalid path traversal.`);
  }
  if (!path.startsWith("uploads/")) {
    throwInvalidArgument(
      `'${fieldName}' must reference a path under 'uploads/'.`
    );
  }
  return path;
}

/**
 * Validate an optional string field. Returns undefined if absent/null, validated string otherwise.
 */
export function optionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return requireString(value, fieldName);
}

/**
 * Validate an optional array of positive integers (e.g. selected chapter numbers).
 */
export function optionalPositiveIntArray(
  value: unknown,
  fieldName: string
): number[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throwInvalidArgument(`'${fieldName}' must be an array.`);
  }
  return value.map((item, idx) =>
    requirePositiveInt(item, `${fieldName}[${idx}]`)
  );
}

/**
 * Assert that the caller is authenticated. Returns the UID.
 */
export function requireAuth(auth: { uid: string } | undefined): string {
  if (!auth || !auth.uid) {
    throwInvalidArgument("Authentication required.");
  }
  return auth.uid;
}
