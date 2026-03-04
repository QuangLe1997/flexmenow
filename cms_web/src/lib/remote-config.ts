import https from "https";
import zlib from "zlib";
import fs from "fs";
import path from "path";

const PROJECT_ID = "flexme-now";
const RC_HOST = "firebaseremoteconfig.googleapis.com";
const RC_PATH = `/v1/projects/${PROJECT_ID}/remoteConfig`;

// Firebase CLI OAuth credentials (same as firebase-tools uses)
const CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

async function getAccessToken(): Promise<string> {
  // Read refresh token from firebase-tools config
  const homedir = process.env.HOME || process.env.USERPROFILE || "";
  const cfgPath = path.join(homedir, ".config", "configstore", "firebase-tools.json");
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
  const refreshToken = cfg.tokens.refresh_token;

  return new Promise((resolve, reject) => {
    const body =
      `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}` +
      `&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
    const req = https.request(
      {
        hostname: "oauth2.googleapis.com",
        path: "/token",
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          const parsed = JSON.parse(d);
          if (parsed.access_token) resolve(parsed.access_token);
          else reject(new Error("Failed to refresh token: " + d));
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

interface RCConfig {
  parameters?: Record<string, { defaultValue?: { value: string } }>;
  [key: string]: unknown;
}

async function getRemoteConfig(
  token: string
): Promise<{ data: RCConfig; etag: string }> {
  return new Promise((resolve, reject) => {
    https
      .get(
        {
          hostname: RC_HOST,
          path: RC_PATH,
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept-Encoding": "gzip",
          },
        },
        (res) => {
          const etag = res.headers["etag"] as string;
          const gunzip = zlib.createGunzip();
          let d = "";
          res.pipe(gunzip);
          gunzip.on("data", (c) => (d += c));
          gunzip.on("end", () => resolve({ data: JSON.parse(d), etag }));
          gunzip.on("error", reject);
        }
      )
      .on("error", reject);
  });
}

async function putRemoteConfig(
  token: string,
  data: RCConfig,
  etag: string
): Promise<{ status: number; data: RCConfig }> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = https.request(
      {
        hostname: RC_HOST,
        path: RC_PATH,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json; UTF-8",
          "If-Match": etag,
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () =>
          resolve({ status: res.statusCode || 0, data: JSON.parse(d) })
        );
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Push updated parameter values to Firebase Remote Config.
 * Usage: pushRemoteConfig({ flexshot_json_url: "https://...?t=123" })
 */
export async function pushRemoteConfig(
  params: Record<string, string>
): Promise<void> {
  const token = await getAccessToken();
  const { data, etag } = await getRemoteConfig(token);

  if (!data.parameters) data.parameters = {};
  for (const [key, value] of Object.entries(params)) {
    data.parameters[key] = { defaultValue: { value } };
  }

  const result = await putRemoteConfig(token, data, etag);
  if (result.status !== 200) {
    throw new Error(
      `Remote Config PUT failed (${result.status}): ${JSON.stringify(result.data).slice(0, 500)}`
    );
  }
}
