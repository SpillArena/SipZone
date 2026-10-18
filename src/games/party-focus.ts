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
    if (board)
      window.scrollTo({
        top: board.getBoundingClientRect().top + window.scrollY,
        behavior: "instant",
      });
  });
}
