"use client";

type ErrorPageProps = {
  error: Error;
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="empty-state">
      <div>
        <h1>Shell error</h1>
        <p>
          {error.message ||
            "An unexpected error interrupted the current route."}
        </p>
        <button className="button-action" onClick={reset} type="button">
          Retry route
        </button>
      </div>
    </div>
  );
}
