import Link from "next/link";

export default function NotFound() {
  return (
    <div className="ln-wrap ln-404">
      <span className="ln-label">404</span>
      <h1>
        Nothing here<span className="ln-dot">.</span>
      </h1>
      <p>The page you followed doesn&apos;t exist, or it moved.</p>
      <Link href="/" className="ln-btn ln-btn--primary">Back home</Link>
    </div>
  );
}
