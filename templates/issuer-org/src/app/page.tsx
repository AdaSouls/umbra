/**
 * Admin Dashboard — Main page
 *
 * Replace this with your organization's admin interface.
 * See the Umbra docs for component examples: https://umbra.aldea.world/docs
 */

export default function AdminDashboard() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Umbra Admin Dashboard</h1>
      <p>
        Welcome to your organization&apos;s credential management dashboard.
      </p>

      <section style={{ marginTop: "2rem" }}>
        <h2>Quick Actions</h2>
        <ul>
          <li><strong>Issue Credential</strong> — <code>npm run emit -- --wallet addr1...</code></li>
          <li><strong>Bulk Issue</strong> — <code>npm run bulk-emit -- --file members.csv</code></li>
          <li><strong>Check Registration</strong> — <code>npm run check</code></li>
        </ul>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Next Steps</h2>
        <ol>
          <li>Customize this dashboard for your organization&apos;s needs</li>
          <li>Add a credential issuance form</li>
          <li>Add a credential list with revocation controls</li>
          <li>Connect to your Midnight provider for production</li>
        </ol>
        <p>
          Full documentation:{" "}
          <a href="https://umbra.aldea.world/docs" target="_blank" rel="noopener noreferrer">
            umbra.aldea.world/docs
          </a>
        </p>
      </section>
    </main>
  );
}
