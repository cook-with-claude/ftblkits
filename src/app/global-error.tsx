"use client";

// Catches failures in the root layout itself, which app/error.tsx cannot — it
// renders inside that layout. Because it replaces the whole document it has to
// supply its own <html> and <body>, and it cannot rely on the app's fonts or
// stylesheet having loaded, so the styling here is deliberately inline and
// self-contained.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          background: "#ffffff",
          color: "#13205c",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "32rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#e10600",
            }}
          >
            Something went wrong
          </p>
          <h1 style={{ marginTop: "0.75rem", fontSize: "2rem", textTransform: "uppercase" }}>
            The Goal Zone is having a moment
          </h1>
          <p style={{ marginTop: "1rem", color: "#334155" }}>
            Please reload the page. Nothing you were doing has been submitted.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              cursor: "pointer",
              borderRadius: "9999px",
              border: "none",
              background: "#1e2a78",
              color: "#ffffff",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
