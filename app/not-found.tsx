import Link from "next/link";

export default function NotFound() {
  return <main className="error-page"><div><h1>Page not found</h1><p>The page you requested does not exist.</p><Link href="/dashboard" className="primary-button">Back to dashboard</Link></div></main>;
}
