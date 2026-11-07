import { getToken } from "../../account/session";
import { PARTY_CODE, type RoomView } from "../../../shared/rooms";
export interface Access {
  code: string;
  token: string;
  account: string;
}
export class LiveError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export async function roomRequest<T = RoomView & { token?: string }>(
  code: string,
  roomToken: string,
  input?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const timeout = AbortSignal.timeout(10_000);
  let response: Response;
  try {
    response = await fetch(`${import.meta.env.BASE_URL}api/rooms/${code}`, {
      method: input ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${getToken() ?? ""}`,
        "X-Room-Token": roomToken,
        ...(input ? { "Content-Type": "application/json" } : {}),
      },
      body: input ? JSON.stringify(input) : undefined,
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new LiveError(
      "Fikk ikke kontakt med romserveren. Sjekk forbindelsen og at romserveren kjører.",
      0,
    );
  }
  const data: unknown = await response
    .json()
    .catch(() => ({ error: "Romserveren svarte ikke som forventet." }));
  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Noe gikk galt. Prøv igjen.";
    throw new LiveError(message, response.status);
  }
  return data as T;
}
export function randomCode(): string {
  const values = crypto.getRandomValues(new Uint32Array(2));
  return `${String(values[0] % 1000).padStart(3, "0")}${String.fromCharCode(65 + (values[1] % 26))}`;
}

/** `?party=ABCD&partyRole=host|guest`: the lobby's party mode opened the game. The party code is the room code. */
export function partyFromUrl(): { code: string; host: boolean } | null {
  const params = new URLSearchParams(location.search);
  const code = (params.get("party") ?? "").toUpperCase();
  return PARTY_CODE.test(code)
    ? { code, host: params.get("partyRole") === "host" }
    : null;
}
const PARTY_JOIN_TRIES = 30;
/**
 * The host opens the room under the party code (or takes their seat back after a reload); a guest joins and waits up to
 * 30 seconds for the host's room to exist.
 */
export async function partyRoom(
  code: string,
  host: boolean,
  cancelled: () => boolean,
): Promise<RoomView & { token?: string }> {
  if (host) {
    try {
      return await roomRequest(code, "", { action: "create" });
    } catch (caught) {
      if (!(caught instanceof LiveError) || caught.status !== 409) throw caught;
      return roomRequest(code, "", { action: "join" });
    }
  }
  for (let attempt = 0; ; attempt++) {
    try {
      return await roomRequest(code, "", { action: "join" });
    } catch (caught) {
      if (
        !(caught instanceof LiveError) ||
        caught.status !== 404 ||
        attempt >= PARTY_JOIN_TRIES ||
        cancelled()
      )
        throw caught;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
