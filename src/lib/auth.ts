// Signed-cookie admin session. No DB table, no dependency: the cookie holds
// "admin:<expiry>" plus an HMAC over it. Rotating AUTH_SECRET logs everyone out.
export const SESSION_COOKIE = "cine_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// constant-time compare (edge runtime has no node:crypto timingSafeEqual)
function safeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function sign(payload: string): Promise<string> {
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(payload);
  const a = new TextEncoder().encode(sig);
  const b = new TextEncoder().encode(expected);
  if (!safeEqual(a, b)) return false;
  const [role, exp] = payload.split(":");
  return role === "admin" && Number(exp) > Date.now();
}

export const SESSION_TTL_S = SESSION_TTL_MS / 1000;

export async function createSessionValue(): Promise<string> {
  return sign(`admin:${Date.now() + SESSION_TTL_MS}`);
}

export function credentialsConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

export function credentialsMatch(email: string, password: string): boolean {
  const e = process.env.ADMIN_EMAIL ?? "";
  const p = process.env.ADMIN_PASSWORD ?? "";
  if (!e || !p) return false;
  const a = new TextEncoder().encode(email);
  const b = new TextEncoder().encode(e);
  const c = new TextEncoder().encode(password);
  const d = new TextEncoder().encode(p);
  return safeEqual(a, b) && safeEqual(c, d);
}
