import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Wifi, WifiOff } from "lucide-react";
import { useI18n } from "../../i18n";
import type { RoomView } from "../../../shared/rooms";
import { LiveError, roomRequest } from "./api";
import type { Access } from "./api";
import { TurnBanner } from "../../games/GameControls";

export function ConnectedRoom({
  access,
  onLeave,
}: {
  access: Access;
  onLeave: () => void;
}) {
  const { t } = useI18n();
  const [room, setRoom] = useState<RoomView | null>(null);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const alive = useRef(true);
  const lock = useRef(false);
  const updateRoom = useCallback(
    (incoming: RoomView) =>
      setRoom((current) =>
        !current || incoming.version >= current.version ? incoming : current,
      ),
    [],
  );
  useEffect(() => {
    alive.current = true;
    let disposed = false;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    let failures = 0;
    const connect = async () => {
      try {
        const view = await roomRequest(
          access.code,
          access.token,
          undefined,
          controller.signal,
        );
        if (disposed) return;
        updateRoom(view);
        const { ticket } = await roomRequest<{ ticket: string }>(
          access.code,
          access.token,
          { action: "ticket" },
          controller.signal,
        );
        if (disposed) return;
        const url = new URL(
          `${import.meta.env.BASE_URL}api/rooms/${access.code}/socket`,
          location.origin,
        );
        url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
        url.searchParams.set("ticket", ticket);
        socket = new WebSocket(url);
        socket.onopen = () => {
          if (!disposed) {
            failures = 0;
            setConnected(true);
            setError("");
          }
        };
        socket.onmessage = (event) => {
          if (event.data === "pong" || disposed) return;
          try {
            updateRoom(JSON.parse(event.data) as RoomView);
          } catch {
            socket?.close();
          }
        };
        socket.onclose = (event) => {
          if (disposed) return;
          setConnected(false);
          if ([4001, 4004].includes(event.code)) {
            setError(
              event.code === 4004
                ? "Rommet har utløpt."
                : "Romtilgangen er utløpt. Bli med igjen.",
            );
            return;
          }
          retry = setTimeout(
            () => void connect(),
            Math.min(1000 * 2 ** failures++, 10_000),
          );
        };
        socket.onerror = () => socket?.close();
      } catch (caught) {
        if (disposed) return;
        setConnected(false);
        setError(
          caught instanceof Error ? caught.message : "Forbindelsen ble brutt.",
        );
        if (!(
          caught instanceof LiveError && [401, 404, 410].includes(caught.status)
        ))
          retry = setTimeout(
            () => void connect(),
            Math.min(1000 * 2 ** failures++, 10_000),
          );
      }
    };
    void connect();
    const heartbeat = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) socket.send("ping");
    }, 20_000);
    return () => {
      disposed = true;
      alive.current = false;
      controller.abort();
      clearTimeout(retry);
      clearInterval(heartbeat);
      socket?.close();
    };
  }, [access, updateRoom]);
  const action = async (input: Record<string, unknown>) => {
    if (lock.current || !room) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const view = await roomRequest(access.code, access.token, {
        version: room.version,
        round: room.round,
        ...input,
      });
      if (!alive.current) return;
      if (input.action === "leave") onLeave();
      else updateRoom(view);
    } catch (caught) {
      if (!alive.current) return;
      setError(caught instanceof Error ? caught.message : "Prøv igjen.");
      try {
        updateRoom(await roomRequest(access.code, access.token));
      } catch {
        /* Keep the previous view while reconnecting. */
      }
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${location.origin}${import.meta.env.BASE_URL}#/live/${access.code}`,
      );
      setCopied(true);
    } catch {
      setError("Kunne ikke kopiere. Del romkoden som vises på skjermen.");
    }
  };
  const host = room?.you === room?.host;
  return (
    <section
      className={`live-page arena-container page-narrow live-${room?.phase ?? "connecting"}`}
    >
      <div className="play-top">
        <button
          className="back-link"
          onClick={() => {
            if (room && connected) void action({ action: "leave" });
            else onLeave();
          }}
        >
          {t("Forlat rom", "Leave room")}
        </button>
        <span className="connection-status">
          {connected ? <Wifi size={15} /> : <WifiOff size={15} />}
          {connected
            ? t("Tilkoblet", "Connected")
            : t("Kobler til …", "Connecting …")}
        </span>
      </div>
      <div className="room-heading">
        <div>
          <p className="eyebrow">SipZone Live / {t("Romkode", "Room code")}</p>
          <h1 className="room-code">{access.code}</h1>
        </div>
        <button className="button secondary" onClick={() => void copy()}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? t("Kopiert", "Copied") : t("Del rommet", "Share room")}
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!room && <p role="status">{t("Henter rommet …", "Loading room …")}</p>}
      {room && (
        <>
          <details className="room-roster" open={room.phase === "lobby"}>
            <summary>
              {t("Gjengen", "Players")} <span>{room.members.length} / 16</span>
            </summary>
            <ul className="room-members">
              {room.members.map((member) => (
                <li
                  key={member.id}
                  className={member.id === room.you ? "is-you" : ""}
                >
                  {member.name}
                  {member.id === room.host && (
                    <span>♛ {t("Vert", "Host")}</span>
                  )}
                  {member.id === room.you && <span>{t("Deg", "You")}</span>}
                </li>
              ))}
            </ul>
          </details>
          {room.phase === "lobby" ? (
            <div className="panel live-lobby">
              <p className="eyebrow">
                {t("Lobby", "Lobby")} / {room.members.length}{" "}
                {t("spillere", "players")}
              </p>
              <h2>
                {host
                  ? t("Hva spiller vi?", "What are we playing?")
                  : t("Gjengen samles.", "Friends are gathering.")}
              </h2>
              <label className="field">
                {t("Lek", "Game")}
                <select
                  value={room.game}
                  disabled={!host || busy || !connected}
                  onChange={(event) =>
                    void action({
                      action: "settings",
                      game: event.target.value,
                      category: room.category,
                    })
                  }
                >
                  <option value="most-likely">Who’s Most Likely?</option>
                  <option value="truth">Truth or Sip</option>
                  <option value="never">Never Have I Ever</option>
                </select>
              </label>
              <label className="field">
                {t("Kategori", "Category")}
                <select
                  value={room.category}
                  disabled={!host || busy || !connected}
                  onChange={(event) =>
                    void action({
                      action: "settings",
                      game: room.game,
                      category: event.target.value,
                    })
                  }
                >
                  <option value="all">
                    {t("Litt av alt", "A bit of everything")}
                  </option>
                  <option value="vors">Vors</option>
                  <option value="hytta">Hytta</option>
                  <option value="venner">Venner</option>
                </select>
              </label>
              {host ? (
                <>
                  <button
                    className="button primary"
                    disabled={room.members.length < 2 || busy || !connected}
                    onClick={() => void action({ action: "start" })}
                  >
                    {t("Start leken", "Start game")} →
                  </button>
                  {room.members.length < 2 && (
                    <p className="muted small">
                      {t(
                        "Vent på minst én venn til.",
                        "Wait for at least one friend.",
                      )}
                    </p>
                  )}
                </>
              ) : (
                <p className="muted">
                  {t(
                    "Verten starter når alle er klare.",
                    "The host starts when everyone is ready.",
                  )}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="round-meta">
                <span>
                  {t("Runde", "Round")} {room.round}
                </span>
                {room.game !== "truth" && (
                  <span>{t("Hele gjengen", "Everyone")}</span>
                )}
              </div>
              {room.game === "truth" && (
                <TurnBanner
                  player={
                    room.members.find(
                      (member) => member.id === room.activePlayer,
                    )?.name ?? t("Spilleren", "Player")
                  }
                  isYou={room.you === room.activePlayer}
                />
              )}
              <div className="prompt-card live-prompt">
                <p className="eyebrow">
                  {room.game === "truth"
                    ? "Truth or Sip"
                    : room.game === "never"
                      ? "Never Have I Ever"
                      : "Who’s Most Likely?"}
                </p>
                <h2>{room.prompt?.text}</h2>
                <span className="card-brand" aria-hidden="true">
                  SIPZONE ♦
                </span>
              </div>
              {room.game === "most-likely" && (
                <div className="vote-area">
                  {room.revealed && room.results ? (
                    <>
                      <h3>
                        {room.results.winners
                          .map((player) => player.name)
                          .join(" & ")}
                        {t(" tar en slurk!", " takes a sip!")}
                      </h3>
                      <div className="vote-results">
                        {room.members.map((member) => (
                          <div key={member.id}>
                            <span>{member.name}</span>
                            <strong>
                              {room.results?.counts[member.id] ?? 0}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="muted small" role="status">
                        {room.voted} / {room.members.length}{" "}
                        {t(
                          "har stemt. Stemmene er skjult til verten viser resultatet.",
                          "have voted. Votes stay private until the host reveals the result.",
                        )}
                      </p>
                      {room.hasVoted ? (
                        <h3>{t("Stemmen din er inne.", "Your vote is in.")}</h3>
                      ) : (
                        <div className="vote-options">
                          {room.members.map((member) => (
                            <button
                              className="button secondary"
                              key={member.id}
                              disabled={busy || !connected}
                              onClick={() =>
                                void action({
                                  action: "vote",
                                  target: member.id,
                                })
                              }
                            >
                              {member.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {room.game !== "most-likely" && (
                <p className="play-hint">
                  {room.game === "truth"
                    ? t(
                        "Svar høyt til gjengen, eller ta en slurk.",
                        "Answer out loud, or take a sip.",
                      )
                    : t(
                        "Alle som har gjort det, tar en slurk.",
                        "Anyone who has done it takes a sip.",
                      )}
                </p>
              )}
              {host ? (
                <div className="actions centered game-actions live-actions">
                  {room.game === "most-likely" && !room.revealed && (
                    <button
                      className="button primary"
                      disabled={busy || !connected || !room.voted}
                      onClick={() => void action({ action: "reveal" })}
                    >
                      {t("Vis resultatet", "Reveal results")}
                    </button>
                  )}
                  <button
                    className={
                      room.game === "most-likely" && !room.revealed
                        ? "button secondary"
                        : "button primary"
                    }
                    disabled={busy || !connected}
                    onClick={() => void action({ action: "next" })}
                  >
                    {room.game === "most-likely" && !room.revealed
                      ? t("Hopp over", "Skip")
                      : t("Neste runde", "Next round")}{" "}
                    →
                  </button>
                  <button
                    className="text-button"
                    disabled={busy || !connected}
                    onClick={() => void action({ action: "lobby" })}
                  >
                    {t("Tilbake til lobbyen", "Back to lobby")}
                  </button>
                </div>
              ) : (
                <p className="play-hint">
                  {t(
                    "Verten tar dere videre.",
                    "The host takes you to the next round.",
                  )}
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
