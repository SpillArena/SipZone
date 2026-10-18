import { getToken } from "../../account/session";
import type { RoomView } from "../../../shared/rooms";
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
