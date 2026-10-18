// Account format mirrors SpillArena/shared/account-server.js. The hub is the only issuer.
export async function verifyAccount(
  secret: string | undefined,
  token: string,
): Promise<{ name: string; expires: number } | null> {
  if (!secret || !token || token.length > 2048) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const decode = (value: string) =>
      Uint8Array.from(
        atob(
          value
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(Math.ceil(value.length / 4) * 4, "="),
        ),
        (char) => char.charCodeAt(0),
      );
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    if (
      !(await crypto.subtle.verify(
        "HMAC",
        key,
        decode(parts[1]),
        new TextEncoder().encode(parts[0]),
      ))
    )
      return null;
    const payload: { u?: unknown; e?: unknown } = JSON.parse(
      new TextDecoder().decode(decode(parts[0])),
    );
    return typeof payload.u === "string" &&
      payload.u.length > 0 &&
      payload.u.length <= 64 &&
      typeof payload.e === "number" &&
      Number.isFinite(payload.e) &&
      payload.e > Date.now()
      ? { name: payload.u, expires: payload.e }
      : null;
  } catch {
    return null;
  }
}
