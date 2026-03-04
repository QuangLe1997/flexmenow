import { auth } from "./firebase-admin";

const isDev = process.env.NODE_ENV === "development";
const CMS_SECRET = process.env.CMS_SECRET || "";

// Allowed CMS admin emails (Google Sign-In)
const ALLOWED_EMAILS = [
  "joneyquang1997@gmail.com",
];

export async function verifyAdmin(
  request: Request
): Promise<{ uid: string; email?: string } | null> {
  // Dev mode: skip auth for local development
  if (isDev) {
    return { uid: "dev-admin" };
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  if (!token) {
    return null;
  }

  // CMS_SECRET: simple API key auth for admin access
  if (CMS_SECRET && token === CMS_SECRET) {
    return { uid: "cms-admin" };
  }

  // Firebase Auth: verify ID token
  try {
    const decoded = await auth.verifyIdToken(token);

    // Allow if user has admin custom claim
    if (decoded.admin === true) {
      return { uid: decoded.uid, email: decoded.email };
    }

    // Allow if user email is in the allowed list
    if (decoded.email && ALLOWED_EMAILS.includes(decoded.email)) {
      return { uid: decoded.uid, email: decoded.email };
    }

    return null;
  } catch (error) {
    console.error("Admin verification failed:", error);
    return null;
  }
}
