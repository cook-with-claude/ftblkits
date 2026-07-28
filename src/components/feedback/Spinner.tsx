/**
 * Inline spinner for buttons that are waiting on the network.
 *
 * Admin buttons previously communicated pending state only by swapping their
 * label ("Add kit" → "Uploading…"), which both resized the button and was easy
 * to miss. The spinner is the part the eye actually catches; the label swap
 * stays because it is what a screen reader reads.
 */
export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
