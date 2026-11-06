import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Hash, Link, Smartphone, Users } from "lucide-react";
import { useAccount } from "../../account/useAccount";
import { onSessionChange } from "../../account/session";
import { useI18n } from "../../i18n";
import { ROOM_CODE } from "../../../shared/rooms";
import { availableLiveGames, type LiveGame } from "../../../shared/live-games";
import { LiveError, randomCode, roomRequest } from "./api";
import type { Access } from "./api";
import { ConnectedRoom } from "./ConnectedRoom";

export function LiveSetup({
  initialCode,
  game,
}: {
  initialCode: string;
  /** A Live game picked from its own tile; a new room starts on it. */
  game?: LiveGame;
}) {
  const { username } = useAccount();
  const { t } = useI18n();
  const [mode, setMode] = useState<"create" | "join">(
    initialCode ? "join" : "create",
  );
  const [code, setCode] = useState(
    initialCode === "join" ? "" : initialCode.toUpperCase(),
  );
  const [access, setAccess] = useState<Access | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const operation = useRef(0);
  const lock = useRef(false);
  const pending = useRef<{ create: boolean; code: string } | null>(null);
  useEffect(
    () => () => {
      operation.current++;
      pending.current = null;
    },
    [],
  );

  const enter = useCallback(
    async (create: boolean, account: string, roomCodeInput: string) => {
      if (lock.current) return;
      const normalized = roomCodeInput.trim().toUpperCase();
      if (!create && !ROOM_CODE.test(normalized)) {
        setError("Bruk tre tall og én bokstav, for eksempel 123A.");
        return;
      }
      const current = ++operation.current;
      lock.current = true;
      setBusy(true);
      setError("");
      try {
        for (let attempt = 0; attempt < (create ? 10 : 1); attempt++) {
          const roomCode = create ? randomCode() : normalized;
          try {
            const result = await roomRequest(roomCode, "", {
              action: create ? "create" : "join",
            });
            if (!result.token)
              throw new Error("Mangler romtilgang. Prøv igjen.");
            if (operation.current !== current) return;
            history.replaceState(null, "", `#/live/${roomCode}`);
            setAccess({ code: roomCode, token: result.token, account });
            return;
          } catch (caught) {
            if (
              create &&
              caught instanceof LiveError &&
              caught.status === 409 &&
              attempt < 9
            )
              continue;
            throw caught;
          }
        }
      } catch (caught) {
        if (operation.current === current)
          setError(
            caught instanceof Error
              ? caught.message
              : "Kunne ikke åpne rommet.",
          );
      } finally {
        lock.current = false;
        if (operation.current === current) setBusy(false);
      }
    },
    [],
  );

  useEffect(
    () =>
      onSessionChange((session) => {
        const intent = pending.current;
        if (!session || !intent) return;
        pending.current = null;
        void enter(intent.create, session.username, intent.code);
      }),
    [enter],
  );

  const submit = () => {
    if (busy) return;
    setError("");
    if (username) void enter(mode === "create", username, code);
    else {
      pending.current = { create: mode === "create", code };
      // Open the unmodified shared badge the same way Hitline does.
      requestAnimationFrame(() => {
        const badge = document.querySelector<HTMLButtonElement>(".sa-badge");
        if (badge?.getAttribute("aria-expanded") !== "true") badge?.click();
      });
    }
  };

  if (access && access.account === username)
    return (
      <ConnectedRoom
        key={`${access.code}-${access.token}`}
        access={access}
        game={game}
        onLeave={() => {
          setAccess(null);
          history.replaceState(null, "", "#/live");
        }}
      />
    );

  return (
    <section className="live-page live-onboarding arena-container page-narrow">
      <a className="back-link" href="#/">
        ← {t("Til forsiden", "Back to home")}
      </a>
      <div className="live-intro">
        <p className="eyebrow">
          <span className="live-dot" />
          Bussruta
        </p>
        <h1>
          {t("Hver sin mobil.", "Your own phone.")}
          <br />
          <span>{t("Samme spill.", "One shared game.")}</span>
        </h1>
        <p>
          {t(
            "Én oppretter et rom. Resten blir med med kode eller lenke. Så er dere i gang.",
            "One creates a room. Everyone else joins with a code or link. Then you’re ready to play.",
          )}
        </p>
      </div>
      <div className="live-entry-grid">
        <form
          className="live-entry panel"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div
            className="segmented live-entry-modes"
            aria-label={t("Velg hvordan du vil spille", "Choose how to join")}
          >
            <button
              type="button"
              aria-pressed={mode === "create"}
              disabled={busy}
              onClick={() => {
                setMode("create");
                setError("");
                pending.current = null;
              }}
            >
              <Users size={17} />
              {t("Opprett rom", "Create room")}
            </button>
            <button
              type="button"
              aria-pressed={mode === "join"}
              disabled={busy}
              onClick={() => {
                setMode("join");
                setError("");
                pending.current = null;
              }}
            >
              <Hash size={17} />
              {t("Bli med", "Join")}
            </button>
          </div>
          <div className="live-entry-copy">
            <span className="live-entry-icon" aria-hidden="true">
              {mode === "create" ? (
                <Smartphone size={27} />
              ) : (
                <Hash size={27} />
              )}
            </span>
            <h2>
              {mode === "create"
                ? t("Du samler gjengen.", "Bring your friends together.")
                : t("Har gjengen startet?", "Friends already playing?")}
            </h2>
            <p className="muted">
              {mode === "create"
                ? t(
                    "Få en romkode og del invitasjonen. Vennene dine kobler seg til på sine egne enheter.",
                    "Get a room code and share the invitation. Your friends join on their own devices.",
                  )
                : t(
                    "Skriv koden fra verten, så får du din egen plass i rommet.",
                    "Enter your host’s code to get your own seat in the room.",
                  )}
            </p>
          </div>
          {mode === "join" && (
            <label className="field" htmlFor="room-code">
              {t("Romkode", "Room code")}
              <input
                id="room-code"
                className="code-input"
                value={code}
                onChange={(event) =>
                  setCode(
                    event.target.value
                      .replace(/[^a-z0-9]/gi, "")
                      .toUpperCase()
                      .slice(0, 4),
                  )
                }
                maxLength={4}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                disabled={busy}
                placeholder="123A"
                aria-describedby="room-code-help"
              />
              <span id="room-code-help" className="muted small">
                {t(
                  "Tre tall og én bokstav. For eksempel 123A.",
                  "Three digits and one letter. For example 123A.",
                )}
              </span>
            </label>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button primary full"
            disabled={busy || (mode === "join" && !ROOM_CODE.test(code))}
          >
            {busy
              ? t("Kobler til …", "Connecting …")
              : mode === "create"
                ? username
                  ? t("Opprett rom", "Create room")
                  : t("Logg inn og opprett rom", "Sign in and create room")
                : username
                  ? t("Bli med i rommet", "Join the room")
                  : t("Logg inn og bli med", "Sign in and join")}
            <ArrowUpRight size={19} />
          </button>
          <p className="live-account-note">
            {username
              ? t(
                  "Du bruker SpillArena-kontoen din. Ingen spillerliste å fylle ut.",
                  "You’re using your SpillArena account. No player list to fill in.",
                )
              : t(
                  "Bruk SpillArena-kontoen din. Vi fortsetter automatisk etter innlogging.",
                  "Use your SpillArena account. We’ll continue automatically after sign-in.",
                )}
          </p>
        </form>
        <aside className="live-how">
          <p className="eyebrow">
            {t("Fra kode til kaos", "From code to chaos")}
          </p>
          <ol>
            <li>
              <span>
                <Users size={19} />
              </span>
              <div>
                <h3>{t("Én er vert", "One person hosts")}</h3>
                <p>
                  {t(
                    "Opprett et rom for Bussruta.",
                    "Create a room for Bussruta.",
                  )}
                </p>
              </div>
            </li>
            <li>
              <span>
                <Link size={19} />
              </span>
              <div>
                <h3>{t("Del med gjengen", "Invite your friends")}</h3>
                <p>
                  {t(
                    "Send lenken eller si koden høyt.",
                    "Send the link or read the code out loud.",
                  )}
                </p>
              </div>
            </li>
            <li>
              <span>
                <Smartphone size={19} />
              </span>
              <div>
                <h3>{t("Hver deres skjerm", "Your own screens")}</h3>
                <p>
                  {t(
                    "Alle ser bordet, men bare du ser kortene på hånden din.",
                    "Everyone sees the table, but only you can see your own hand.",
                  )}
                </p>
              </div>
            </li>
          </ol>
          <div className="live-included">
            <span>2–8 {t("spillere", "players")}</span>
            {availableLiveGames.map((game) => (
              <span key={game.id}>{game.name}</span>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
