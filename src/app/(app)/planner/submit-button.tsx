"use client";
import { useFormStatus } from "react-dom";
import { Shuffle, CircleNotch } from "@phosphor-icons/react/dist/ssr";

/**
 * Submit button for the randomiser server-action forms.
 * Uses useFormStatus to show a spinner while the action runs.
 */
export function RandomiseButton({
  className,
  iconSize = 16,
  ariaLabel,
  children,
}: {
  className?: string;
  iconSize?: number;
  ariaLabel?: string;
  children?: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-label={ariaLabel}
      aria-busy={pending}
    >
      {pending ? (
        <CircleNotch
          size={iconSize}
          weight="bold"
          className="animate-spin"
        />
      ) : (
        <Shuffle size={iconSize} weight="bold" />
      )}
      {children}
    </button>
  );
}
