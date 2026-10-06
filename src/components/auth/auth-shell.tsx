import type { ReactNode } from "react";
import { Brand } from "../brand";

export function AuthShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <main className="auth-layout">
      <aside className="auth-story" style={{ backgroundImage: "linear-gradient(180deg, rgba(20, 45, 30, .2), rgba(20, 45, 30, .85)), url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=85)", backgroundSize: "cover", backgroundPosition: "center" }}>
        <Brand light />
        <div className="auth-story-content">
          <p className="eyebrow">Rooted in your everyday</p>
          <h2 style={{ fontFamily: "Georgia, serif" }}>A little more clarity.<br />Room to grow.</h2>
          <p>For the land you tend, and the days ahead.</p>
        </div>
      </aside>
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-card">
          <div className="mb-8 lg:hidden"><Brand /></div>
          <header className="auth-heading">
            <p className="eyebrow">{eyebrow}</p>
            <h1 id="auth-title" style={{ fontFamily: "Georgia, serif" }}>{title}</h1>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}