import Link from "next/link";
import { Brand } from "@/components/brand";
import { FarmImage } from "@/components/farm-image";

const features = [
  { title: "Farm profile", description: "Keep your farm name, location, size, and farmer details together.", icon: "📍", image: "/farm-landscape.jpg", imageAlt: "Cultivated fields around a farm" },
  { title: "Crop records", description: "Record varieties, planting dates, expected harvests, and crop status.", icon: "🌱", image: "/healthy-farm.jpg", imageAlt: "Young crops growing in a field" },
  { title: "Expense tracking", description: "Record farm spending and optionally connect each cost to a crop.", icon: "💰", image: "/farm-inventory.jpg", imageAlt: "Gardening tools and supplies ready for farm work" },
];

const steps = [
  "Create your farmer account",
  "Add your farm details",
  "Record crops and expenses",
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-3">
            <Link href="/login" className="text-link text-sm">
              Sign in
            </Link>
            <Link href="/signup" className="button button-primary button-small">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="page-width" style={{ padding: "72px 0 32px" }}>
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="eyebrow">Simple farm management for everyday growing</p>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2.7rem, 6vw, 5rem)", lineHeight: 1, color: "var(--farm-green-deep)" }}>
              Your farm, organized digitally.
            </h1>
            <p style={{ marginTop: 20, fontSize: "1.12rem", lineHeight: 1.75, color: "rgba(28, 42, 35, 0.75)", maxWidth: 640 }}>
              DigiFarm helps farmers manage crop records, farm information, seasonal activity, expenses, and harvest planning from one calm, practical dashboard.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 28 }}>
              <Link href="/signup" className="button button-primary">
                Get Started
              </Link>
              <Link href="/login" className="button button-secondary">
                Sign In
              </Link>
            </div>
          </div>

          <div className="dashboard-card" style={{ background: "rgba(255, 255, 255, 0.72)", padding: 24 }}>
            <FarmImage
              src="/farm-landscape.jpg"
              alt="A broad view across cultivated green fields"
              sizes="(max-width: 767px) 100vw, 45vw"
              priority
              className="home-hero-photo"
            />
            <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
              <div className="task-item">
                <span>Farmer-owned farm profile</span>
                <span className="tag">Private</span>
              </div>
              <div className="task-item">
                <span>Crop and expense records</span>
                <span className="tag">Organized</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-width" style={{ padding: "20px 0 40px" }}>
        <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {features.map((feature) => (
            <article key={feature.title} className="dashboard-card home-feature">
              <FarmImage
                src={feature.image}
                alt={feature.imageAlt}
                sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 240px"
                className="home-feature-photo"
              />
              <div className="home-feature-copy">
                <div style={{ fontSize: "2rem" }}>{feature.icon}</div>
                <h2 style={{ marginTop: 12, fontSize: "1.45rem", color: "var(--farm-green-deep)" }}>{feature.title}</h2>
                <p style={{ marginTop: 10, lineHeight: 1.7, color: "rgba(28, 42, 35, 0.7)" }}>{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page-width" style={{ padding: "32px 0 72px" }}>
        <div className="dashboard-card" style={{ padding: 28 }}>

          <p className="eyebrow">How it works</p>
          
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--farm-green-deep)" }}>A simple path to better farm decisions.</h2>
          <ol style={{ listStyle: "none", padding: 0, margin: "24px 0 0", display: "grid", gap: 16 }}>
            {steps.map((step, index) => (
              <li key={step} className="task-item" style={{ padding: "14px 16px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "999px", background: "rgba(37, 78, 60, 0.1)", color: "var(--farm-green-deep)", fontWeight: 800 }}>{index + 1}</span>
                <span style={{ flex: 1, fontWeight: 600 }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>

      </section>

      <footer style={{ borderTop: "1px solid rgba(31, 56, 43, 0.12)", background: "rgba(255,255,255,0.4)" }}>
        <div className="page-width" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, padding: "20px 0" }}>
          <Brand compact />
          <p style={{ color: "rgba(28, 42, 35, 0.7)" }}>© 2026 DigiFarm</p>
        </div>

      </footer>

    </main>


  );
}