const base = "http://localhost:3000";

async function login(email, password) {
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const cookie = csrfRes.headers.getSetCookie?.() ?? [];
  const cookieHeader = cookie.map((c) => c.split(";")[0]).join("; ");

  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${base}/`,
    json: "true",
  });

  const res = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader,
    },
    body,
    redirect: "manual",
  });

  const text = await res.text();
  console.log(email, "status", res.status, "body", text.slice(0, 200));
  console.log(
    "  set-cookie?",
    (res.headers.getSetCookie?.() ?? []).map((c) => c.split("=")[0]).join(", ")
  );
}

await login("admin@cinestar.vn", "admin123");
await login("khach@example.com", "khach123");
await login("admin@cinestar.vn", "wrong");
