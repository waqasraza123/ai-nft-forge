import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-state">
      <div>
        <h1>Route not found</h1>
        <p>
          This shell only exposes marketing, studio, ops, and brand collection
          placeholders in Phase 1.
        </p>
        <Link className="action-link" href="/">
          Return to marketing
        </Link>
      </div>
    </div>
  );
}
