import { useEffect, useState, type ReactNode } from "react";
import { Dialog } from "../../ui/Dialog";
import { sips } from "../../games/bus-copy";

export function BusAwardPopup({
  amount,
  children,
}: {
  amount: number;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);
  if (!ready)
    return (
      <p className="bus-award-wait" role="status">
        Riktig! <span aria-hidden="true">✦</span>
      </p>
    );
  return (
    <Dialog title={`Riktig! Del ut ${sips(amount)}`} dismissible={false}>
      <div className="bus-award-intro">
        <span aria-hidden="true">✦</span>
      </div>
      {children}
    </Dialog>
  );
}
