export default function Loading() {
  return (
    <main
      className="page"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="section">
        <strong>טוענת את הלוח...</strong>
        <p className="muted" style={{ marginBottom: 0 }}>
          הסינון והמודעות יופיעו מיד כשהמידע מוכן.
        </p>
      </div>

      <div
        aria-hidden="true"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="section"
            style={{ minHeight: 240 }}
          />
        ))}
      </div>
    </main>
  );
}
