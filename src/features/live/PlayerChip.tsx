import type { ReactNode } from "react";
import { UserAvatar } from "../../account";

/** A room member's SpillArena picture, or their initial while there is none. */
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      className="live-avatar"
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      <UserAvatar
        name={name}
        fallback={Array.from(name)[0]?.toLocaleUpperCase()}
      />
    </span>
  );
}

/** Avatar with the name underneath. Every account has both, so lists stay compact. */
export function PlayerChip({
  name,
  size,
  children,
}: {
  name: string;
  size?: number;
  children?: ReactNode;
}) {
  return (
    <span className="live-chip">
      <Avatar name={name} size={size} />
      <span className="live-chip-name">{name}</span>
      {children}
    </span>
  );
}
