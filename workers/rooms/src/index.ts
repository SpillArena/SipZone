import { DurableObject } from "cloudflare:workers";
import {
  applyRoomAction,
  createRoom,
  joinRoom,
  publicRoom,
  ROOM_CODE,
  RoomError,
} from "../../../shared/rooms.ts";
import type { Room } from "../../../shared/rooms.ts";
import { verifyAccount } from "../../../shared/auth.ts";
type Result = { status: number; data: object };
type SocketIdentity = { id: string; expires: number; token: string };
const fail = (error: string, status = 400): Result => ({
  status,
  data: { error },
});

export class SipZoneRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY CHECK(id = 1), data TEXT NOT NULL)",
    );
    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );
  }
  private read(): Room | null {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM room WHERE id = 1")
      .toArray()[0];
    return row ? JSON.parse(row.data) : null;
  }
  private save(room: Room) {
    this.ctx.storage.sql.exec(
      "INSERT INTO room (id, data) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
      JSON.stringify(room),
    );
  }
  private broadcast(room: Room) {
    for (const socket of this.ctx.getWebSockets()) {
      const identity: SocketIdentity = socket.deserializeAttachment();
      const member = room.members.find(
        (player) =>
          player.id === identity.id && player.token === identity.token,
      );
      try {
        if (identity.expires <= Date.now() || !member)
          socket.close(4001, "Bli med i rommet igjen.");
        else socket.send(JSON.stringify(publicRoom(room, member.id)));
      } catch {
        socket.close(1011, "Koble til igjen.");
      }
    }
  }
  handle(
    code: string,
    method: string,
    account: string,
    expires: number,
    token: string,
    input: Record<string, unknown>,
  ): Result {
    try {
      let room = this.read();
      if (room && room.expires <= Date.now()) {
        if (input.action === "create") room = null;
        else return fail("Rommet har utløpt. Opprett et nytt rom.", 410);
      }
      let issuedToken: string | undefined;
      let member;
      if (method === "POST" && input.action === "create") {
        if (room) return fail("Romkoden er opptatt.", 409);
        room = createRoom(code, account);
        member = room.members[0];
        issuedToken = member.token;
        this.ctx.waitUntil(this.ctx.storage.setAlarm(room.expires));
      } else {
        if (!room) return fail("Fant ikke rommet. Sjekk koden.", 404);
        if (method === "POST" && input.action === "join") {
          member = joinRoom(room, account, token);
          issuedToken = member.token;
          room.version++;
        } else {
          member = room.members.find(
            (player) => player.account === account && player.token === token,
          );
          if (!member) return fail("Bli med i rommet igjen.", 401);
          if (method === "GET")
            return { status: 200, data: publicRoom(room, member.id) };
          if (input.action === "ticket") {
            member.ticket = crypto.randomUUID();
            member.ticketExpires = Date.now() + 30_000;
            member.authExpires = expires;
            this.save(room);
            return { status: 200, data: { ticket: member.ticket } };
          }
          applyRoomAction(room, member, input);
        }
      }
      this.save(room);
      this.broadcast(room);
      if (room.members.length === 0)
        this.ctx.waitUntil(this.ctx.storage.setAlarm(Date.now() + 1000));
      return {
        status: 200,
        data: {
          ...publicRoom(room, member.id),
          ...(issuedToken ? { token: issuedToken } : {}),
        },
      };
    } catch (error) {
      if (error instanceof RoomError) return fail(error.message, error.status);
      throw error;
    }
  }
  // WebSocket upgrades use fetch; game actions use the RPC method above.
  fetch(request: Request): Response {
    const ticket = new URL(request.url).searchParams.get("ticket");
    const room = this.read();
    const member = room?.members.find(
      (player) =>
        player.ticket === ticket &&
        (player.ticketExpires ?? 0) > Date.now() &&
        (player.authExpires ?? 0) > Date.now(),
    );
    if (
      !room ||
      room.expires <= Date.now() ||
      !member ||
      request.headers.get("Upgrade")?.toLowerCase() !== "websocket"
    )
      return new Response("Ugyldig tilkobling.", { status: 401 });
    delete member.ticket;
    delete member.ticketExpires;
    this.save(room);
    // Each membership keeps at most two sockets, including an overlapping reconnect.
    const previous = this.ctx.getWebSockets(member.id);
    while (previous.length >= 2)
      previous.shift()?.close(4000, "Ny tilkobling.");
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1], [member.id]);
    pair[1].serializeAttachment({
      id: member.id,
      expires: Math.min(member.authExpires!, room.expires),
      token: member.token,
    } satisfies SocketIdentity);
    pair[1].send(JSON.stringify(publicRoom(room, member.id)));
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
  webSocketMessage(socket: WebSocket) {
    // Mutations go through authenticated, bounded HTTP requests, never arbitrary socket messages.
    socket.close(1008, "Bruk romhandlingene.");
  }
  webSocketClose(socket: WebSocket) {
    socket.close(1000, "Tilkoblingen er lukket.");
  }
  async alarm() {
    const room = this.read();
    if (room && room.members.length && room.expires > Date.now()) {
      await this.ctx.storage.setAlarm(room.expires);
      return;
    }
    for (const socket of this.ctx.getWebSockets())
      socket.close(4004, "Rommet har utløpt.");
    await this.ctx.storage.deleteAll();
  }
}

async function readInput(
  request: Request,
): Promise<Record<string, unknown> | null> {
  if (
    !request.body ||
    !request.headers.get("content-type")?.includes("application/json")
  )
    return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 4096) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(
      /^(?:\/sipzone)?\/api\/rooms\/(\d{3}[A-Z])(\/socket)?$/,
    );
    if (!match || !ROOM_CODE.test(match[1]))
      return Response.json({ error: "Ugyldig romadresse." }, { status: 404 });
    const stub = env.ROOMS.getByName(match[1]);
    if (match[2]) return stub.fetch(request);
    if (request.method !== "GET" && request.method !== "POST")
      return new Response(null, {
        status: 405,
        headers: { Allow: "GET, POST" },
      });
    if (!env.AUTH_SECRET)
      return Response.json(
        { error: "Romserveren er ikke konfigurert." },
        { status: 503 },
      );
    const account = await verifyAccount(
      env.AUTH_SECRET,
      request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "",
    );
    if (!account)
      return Response.json(
        { error: "Logg inn med SpillArena-kontoen din først." },
        { status: 401 },
      );
    const input = request.method === "POST" ? await readInput(request) : {};
    if (!input)
      return Response.json(
        { error: "Ugyldig eller for stor forespørsel." },
        { status: 400 },
      );
    const result = await stub.handle(
      match[1],
      request.method,
      account.name,
      account.expires,
      request.headers.get("X-Room-Token") ?? "",
      input,
    );
    return Response.json(result.data, {
      status: result.status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
} satisfies ExportedHandler<Env>;
