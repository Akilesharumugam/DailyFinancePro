"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <main className="error-page"><div><h1>Something went wrong</h1><p>Your data was not changed. Try loading the page again.</p><button onClick={reset} className="primary-button">Try again</button></div></main>;
}
