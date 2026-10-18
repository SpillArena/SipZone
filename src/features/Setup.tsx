import { useState } from "react";
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";
import type { Category, GameDefinition } from "../../shared/catalog";
import { MAX_PLAYERS, validateNames } from "../../shared/engine";
import type { Player } from "../../shared/engine";
import { darePool } from "../../shared/party-engine";
import type { HigherLowerOptions } from "../../shared/higher-lower";
import type { DareLevel } from "../../shared/party-content";
import { useI18n } from "../i18n";
import { GameArt } from "../ui/GameArt";
export interface GameSettings {
  rounds: number;
  cards: Omit<HigherLowerOptions, "rounds">;
  level: DareLevel;
  seconds: number;
  category: Category;
  voting: "point" | "secret";
}
export function Setup({
  game,
  party,
  onStart,
}: {
  game: GameDefinition;
  party: Player[];
  onStart: (party: Player[], settings: GameSettings) => void;
}) {
  const { t } = useI18n();
  const maxPlayers = game.max ?? MAX_PLAYERS;
  const [players, setPlayers] = useState<Player[]>(party);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [rounds, setRounds] = useState(10);
  const [level, setLevel] = useState<DareLevel>("easy");
  const [seconds, setSeconds] = useState(game.id === "category-rush" ? 5 : 10);
  const [cards, setCards] = useState<Omit<HigherLowerOptions, "rounds">>({
    mode: "quick",
    ace: "low",
    ties: "safe",
  });
  const [category, setCategory] = useState<Category>("all");
  const [voting, setVoting] = useState<"point" | "secret">("point");
  const addPlayer = () => {
    const names = [...players.map((player) => player.name), name.trim()];
    const invalid = validateNames(names, 1, maxPlayers);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPlayers([...players, { id: crypto.randomUUID(), name: name.trim() }]);
    setName("");
    setError("");
  };
  return (
    <section className="setup-page arena-container page-narrow">
      <a className="back-link" href="#/">
        <ArrowLeft size={16} />
        {t("Alle leker", "All games")}
      </a>
      <div className="setup-heading">
        <GameArt id={game.id} small />
        <div>
          <p className="eyebrow">{game.subtitle}</p>
          <h1>{game.name}</h1>
          <p className="muted">{game.description}</p>
        </div>
      </div>
      <div className="setup-grid">
        <div className="panel">
          <p className="eyebrow">
            01 / {t("Samle gjengen", "Gather your friends")}
          </p>
          <h2>{t("Hvem er med?", "Who’s playing?")}</h2>
          <p className="muted small">
            {game.min}–{maxPlayers}{" "}
            {t(
              "spillere. Navnene blir bare i denne fanen.",
              "players. Names stay in this tab only.",
            )}
          </p>
          <form
            className="add-player"
            onSubmit={(event) => {
              event.preventDefault();
              addPlayer();
            }}
          >
            <label className="sr-only" htmlFor="player-name">
              {t("Spillernavn", "Player name")}
            </label>
            <input
              id="player-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("Skriv et navn …", "Enter a name …")}
              maxLength={24}
              autoComplete="off"
              disabled={players.length >= maxPlayers}
            />
            <button
              className="icon-button"
              disabled={!name.trim() || players.length >= maxPlayers}
              aria-label={t("Legg til spiller", "Add player")}
            >
              <Plus size={22} />
            </button>
          </form>
          <ul className="player-list">
            {players.map((player, index) => (
              <li key={player.id}>
                <span className="avatar">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{player.name}</span>
                <button
                  className="icon-button"
                  aria-label={`${t("Fjern", "Remove")} ${player.name}`}
                  onClick={() =>
                    setPlayers(players.filter((item) => item.id !== player.id))
                  }
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
          {!players.length && (
            <p className="empty-note">
              {t(
                "Førstemann får æren av å begynne.",
                "The first player gets to start.",
              )}
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="panel">
          <p className="eyebrow">
            02 / {t("Før vi starter", "Before we start")}
          </p>
          <h2>{t("Slik spiller dere", "How to play")}</h2>
          <ol className="rules-list">
            {game.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
          {["truth", "never", "most-likely", "sip-dare"].includes(game.id) && (
            <label className="field">
              {t("Hva snakker vi om?", "What’s the topic?")}
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as Category)
                }
              >
                <option value="all">
                  {t("Litt av alt", "A bit of everything")}
                </option>
                <option value="vors">Vors</option>
                <option value="hytta">{t("Hytta", "Cabin trip")}</option>
                <option value="venner">{t("Venner", "Friends")}</option>
              </select>
            </label>
          )}
          {!["fate", "showdown", "bus"].includes(game.id) && (
            <label className="field">
              {t("Antall runder", "Number of rounds")}
              <select
                value={rounds}
                onChange={(event) => setRounds(Number(event.target.value))}
              >
                {[5, 10, 20].map((n) => (
                  <option key={n} value={n}>
                    {n} {t("runder", "rounds")}
                  </option>
                ))}
              </select>
            </label>
          )}
          {game.id === "higher-lower" && (
            <>
              <label className="field">
                Spillemåte
                <select
                  value={cards.mode}
                  onChange={(event) =>
                    setCards({
                      ...cards,
                      mode: event.target.value as HigherLowerOptions["mode"],
                    })
                  }
                >
                  <option value="quick">Rask runde · én gjetning hver</option>
                  <option value="streak">
                    Rekke · sikre poeng eller ta sjansen
                  </option>
                </select>
              </label>
              <label className="field">
                Ess
                <select
                  value={cards.ace}
                  onChange={(event) =>
                    setCards({
                      ...cards,
                      ace: event.target.value as HigherLowerOptions["ace"],
                    })
                  }
                >
                  <option value="low">Lavest · under 2</option>
                  <option value="high">Høyest · over konge</option>
                </select>
              </label>
              <label className="field">
                Like kort
                <select
                  value={cards.ties}
                  onChange={(event) =>
                    setCards({
                      ...cards,
                      ties: event.target.value as HigherLowerOptions["ties"],
                    })
                  }
                >
                  <option value="safe">Ingen straff</option>
                  <option value="lose">Teller som feil</option>
                </select>
              </label>
              {cards.mode === "streak" && (
                <p className="muted small">
                  Én runde er én spillers tur. Riktige svar bygger en usikret
                  rekke. Stopp og sikre poengene, eller risiker hele rekken på
                  neste kort. Sikrede poeng beholdes. Tom stokk avslutter økten.
                </p>
              )}
            </>
          )}
          {game.id === "sip-dare" && (
            <>
              <label className="field">
                Hvor modige er dere?
                <select
                  value={level}
                  onChange={(event) =>
                    setLevel(event.target.value as DareLevel)
                  }
                >
                  <option value="easy">Rolig · enkle, morsomme oppgaver</option>
                  <option value="bold">Modig · mer improvisasjon</option>
                </select>
              </label>
              <p className="muted small">
                {darePool(category, level).length} unike oppgaver. Økten blir{" "}
                {Math.min(rounds, darePool(category, level).length)} runder.
              </p>
            </>
          )}
          {["quickfire", "category-rush"].includes(game.id) && (
            <label className="field">
              Tid per {game.id === "quickfire" ? "spørsmål" : "spiller"}
              <select
                value={seconds}
                onChange={(event) => setSeconds(Number(event.target.value))}
              >
                {[5, 10, 15].map((value) => (
                  <option key={value} value={value}>
                    {value} sekunder
                  </option>
                ))}
              </select>
            </label>
          )}
          {game.id === "showdown" && (
            <p className="muted small">
              Alle blir med i én utslagsturnering. Med{" "}
              {Math.max(2, players.length)} spillere blir det{" "}
              {Math.max(1, players.length - 1)} dueller.
            </p>
          )}
          {game.id === "most-likely" && (
            <fieldset>
              <legend>
                {t("Hvordan vil dere stemme?", "How do you want to vote?")}
              </legend>
              <div className="segmented">
                <button
                  aria-pressed={voting === "point"}
                  onClick={() => setVoting("point")}
                >
                  {t("Pek samtidig", "Point together")}
                </button>
                <button
                  aria-pressed={voting === "secret"}
                  onClick={() => setVoting("secret")}
                >
                  {t("Stem i skjul", "Secret ballot")}
                </button>
              </div>
            </fieldset>
          )}
        </div>
      </div>
      <div className="setup-bottom">
        <p className="muted small">
          {t(
            "Deres tempo, deres glass. Dere kan alltid hoppe over.",
            "Your pace, your drink. You can always skip.",
          )}
        </p>
        <button
          className="button primary"
          onClick={() => {
            const invalid = validateNames(
              players.map((player) => player.name),
              game.min,
              maxPlayers,
            );
            if (invalid) {
              setError(invalid);
              return;
            }
            onStart(players, {
              rounds,
              category,
              voting,
              level,
              seconds,
              cards,
            });
          }}
        >
          {t("La oss spille", "Let’s play")}
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}
