/** Put the timed question and answers in view after the ready screen. */
export function focusTimedRound() {
  if (
    !matchMedia(
      "(max-width: 760px), (max-width: 960px) and (max-height: 500px)",
    ).matches
  )
    return;
  requestAnimationFrame(() => {
    const board = document.querySelector(".round-board");
    const target = board?.querySelector(".party-timer") ?? board;
    target?.scrollIntoView({ block: "start", behavior: "instant" });
  });
}
