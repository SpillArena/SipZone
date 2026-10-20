import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useI18n } from "../i18n";
import { useExitAnimation } from "./useExitAnimation";
export function Dialog({
  title,
  onClose,
  dismissible = true,
  children,
}: {
  title: string;
  onClose?: () => void;
  dismissible?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useExitAnimation(ref);
  const { t } = useI18n();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      className="dialog"
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose?.();
      }}
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="dialog-top">
        <h2 id="dialog-title">{title}</h2>
        {dismissible && (
          <button
            className="icon-button"
            type="button"
            aria-label={t("Lukk", "Close")}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        )}
      </div>
      {children}
    </dialog>
  );
}
