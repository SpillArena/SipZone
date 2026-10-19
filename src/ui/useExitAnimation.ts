import { useLayoutEffect, type RefObject } from "react";

/** A brief, inert visual copy lets an overlay leave after its live controls unmount. */
export function useExitAnimation(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const element = ref.current;
    let painted = false;
    const frame = requestAnimationFrame(() => {
      painted = true;
    });
    return () => {
      cancelAnimationFrame(frame);
      if (
        !painted ||
        !element?.isConnected ||
        document.hidden ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        Number(getComputedStyle(element).opacity) < 0.01
      )
        return;
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const copy = element.cloneNode(true) as HTMLElement;
      copy.inert = true;
      copy.setAttribute("aria-hidden", "true");
      copy.classList.add("motion-ghost");
      copy.removeAttribute("id");
      copy
        .querySelectorAll("[id]")
        .forEach((node) => node.removeAttribute("id"));
      Object.assign(copy.style, {
        position: "fixed",
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: "0",
        insetInlineEnd: "auto",
        bottom: "auto",
        pointerEvents: "none",
        zIndex: "10000",
      });
      const fade = (node: HTMLElement, frames: Keyframe[]) => {
        document.body.appendChild(node);
        const animation = node.animate(frames, {
          duration: 150,
          easing: "cubic-bezier(.4,0,1,1)",
          fill: "forwards",
        });
        void animation.finished.then(
          () => node.remove(),
          () => node.remove(),
        );
      };
      if (element.tagName === "DIALOG") {
        const style = getComputedStyle(element, "::backdrop");
        const backdrop = document.createElement("div");
        backdrop.className = "motion-backdrop-ghost";
        backdrop.setAttribute("aria-hidden", "true");
        Object.assign(backdrop.style, {
          background: style.backgroundColor,
          backdropFilter: style.backdropFilter,
        });
        fade(backdrop, [{ opacity: 1 }, { opacity: 0 }]);
      }
      fade(copy, [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(-10px) scale(.96)" },
      ]);
    };
  }, [ref]);
}
