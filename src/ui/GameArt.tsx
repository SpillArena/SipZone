import type { GameId } from "../../shared/catalog";
export function BottleGraphic() {
  return (
    <svg viewBox="0 0 100 200" fill="none" aria-hidden="true">
      <path
        d="M39 8h22v48c0 15 24 20 24 43v74c0 10-7 17-17 17H32c-10 0-17-7-17-17V99c0-23 24-28 24-43V8Z"
        fill="#628d60"
        stroke="#153a30"
        strokeWidth="4"
      />
      <path
        d="M37 8h26v14H37z"
        fill="#ff825b"
        stroke="#153a30"
        strokeWidth="4"
      />
      <path
        d="M17 109h66v50H17z"
        fill="#f6f0dc"
        stroke="#153a30"
        strokeWidth="3"
      />
      <text
        x="50"
        y="145"
        textAnchor="middle"
        fill="#153a30"
        fontSize="31"
        fontWeight="800"
      >
        S.
      </text>
      <path
        d="M28 96v-1c0-18 20-26 20-41V31"
        stroke="#f6f0dc"
        strokeOpacity=".5"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function GameArt({
  id,
  small = false,
}: {
  id: GameId;
  small?: boolean;
}) {
  return (
    <div
      className={`game-art art-${id} ${small ? "small-art" : ""}`}
      aria-hidden="true"
    >
      {(id === "fate" || id === "higher-lower") && (
        <>
          <span className="mini-card back">S.</span>
          <span className="mini-card front">{id === "fate" ? "♠" : "♥"}</span>
        </>
      )}
      {id === "roulette" && (
        <span className="art-wheel">
          <span>✳</span>
        </span>
      )}
      {id === "truth" && (
        <>
          <span className="speech-bubble">?</span>
          <span className="art-stamp">ÆRLIG TALT.</span>
        </>
      )}
      {id === "never" && (
        <>
          <span className="art-quote">“</span>
          <span className="art-stamp">JEG? ALDRI.</span>
        </>
      )}
      {id === "most-likely" && (
        <>
          <span className="face face-one">☺</span>
          <span className="face face-two">☺</span>
          <span className="face face-three">☺</span>
        </>
      )}
      {id === "hot-potato" && (
        <>
          <span className="potato-art">◉</span>
          <span className="art-stamp">SEND VIDERE!</span>
        </>
      )}
      {id === "sip-dare" && (
        <>
          <span className="dare-card">!</span>
          <span className="art-stamp">TØR DU?</span>
        </>
      )}
      {id === "bottle" && (
        <span className="art-bottle">
          <BottleGraphic />
        </span>
      )}
      {id === "box" && (
        <span className="art-box">
          <small>SPILLARENA</small>
          <strong>
            SIP
            <br />
            BOX
          </strong>
          <small>PASS THE GOOD TIMES</small>
        </span>
      )}
      {id === "quickfire" && (
        <>
          <span className="art-stopwatch">ϟ</span>
          <span className="art-stamp">TENK KJAPT.</span>
        </>
      )}
      {id === "showdown" && (
        <>
          <span className="duel-ticket ticket-one">01</span>
          <span className="duel-ticket ticket-two">02</span>
          <strong className="art-vs">VS</strong>
        </>
      )}
      {id === "emoji" && (
        <>
          <span className="art-emoji">🦁</span>
          <span className="art-emoji emoji-second">👑</span>
        </>
      )}
      {id === "category-rush" && (
        <>
          <span className="art-stopwatch">10</span>
          <span className="art-stamp">ETT ORD TIL!</span>
        </>
      )}
      {id === "truth-train" && (
        <>
          <span className="train-bubble">…</span>
          <span className="train-line">●—●—●</span>
        </>
      )}
      {id === "bus" && (
        <>
          <span className="bus-art-coach">
            <span className="bus-art-sign">BUSSRUTA</span>
            <span className="bus-art-windows">
              <i />
              <i />
              <i />
            </span>
            <strong>S.</strong>
          </span>
          <span className="art-stamp">ALLE OM BORD!</span>
        </>
      )}
      {id === "spy" && (
        <>
          <span className="table-art-glyph">?</span>
          <span className="art-stamp">HVEM ER SPIONEN?</span>
        </>
      )}
      {id === "werewolf" && (
        <>
          <span className="table-art-moon" />
          <span className="art-stamp">NATTA FALLER</span>
        </>
      )}
      {id === "bluff" && (
        <>
          <span className="mini-card back">S.</span>
          <span className="mini-card front">♣</span>
          <span className="art-stamp">SNYD!</span>
        </>
      )}
      {id === "liars-dice" && (
        <>
          <span className="table-art-dice">
            <i>⚀</i>
            <i>⚅</i>
          </span>
          <span className="art-stamp">LØGNER!</span>
        </>
      )}
      {id === "two-truths" && (
        <>
          <span className="table-art-chips">
            <i>✓</i>
            <i>✓</i>
            <i>✗</i>
          </span>
          <span className="art-stamp">EN AV TRE LYVER</span>
        </>
      )}
      {id === "live" && (
        <>
          <span className="phone-art">S.</span>
          <span className="live-signal">)))</span>
        </>
      )}
    </div>
  );
}
