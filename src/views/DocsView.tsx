import { useState } from "react";
import { docsSections } from "../data/seedData";
import { GlassCard } from "../components/GlassCard";

export function DocsView() {
  const [active, setActive] = useState(docsSections[0].id);
  const section = docsSections.find((item) => item.id === active) ?? docsSections[0];

  return (
    <main className="view-stage">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Ritual Agent Docs</h1>
        <p className="mt-1 text-sm text-slate-400">Builder notes for the current RAgent implementation.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
        <GlassCard className="p-3">
          {docsSections.map((item) => (
            <button key={item.id} onClick={() => setActive(item.id)} className={active === item.id ? "doc-link-active" : "doc-link"}>
              {item.title}
            </button>
          ))}
        </GlassCard>

        <GlassCard className="p-6">
          <article className="max-w-4xl">
            <h2 className="text-xl font-semibold text-slate-50">{section.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">{section.body}</p>
            <div className="mt-6 rounded-lg border border-blue-300/12 bg-slate-950/55 p-4 font-mono text-xs leading-6 text-cyan-100">
              <span className="text-slate-500">// Ritual-ready configuration</span>
              <br />
              agent.capabilities = ["LLM", "HTTP", "Memory", "Wallet"];
              <br />
              agent.safety.requirePreflight = true;
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-ritual-gold/20 bg-ritual-gold/8 p-4 text-sm text-amber-100">
                <b>Warning:</b> always complete preflight before enabling wallet actions.
              </div>
              <div className="rounded-lg border border-ritual-cyan/20 bg-ritual-cyan/8 p-4 text-sm text-cyan-100">
                <b>Info:</b> memory should use user-owned storage references.
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {["Constrain action scope", "Encrypt user secrets", "Track async lifecycle"].map((item) => (
                <div key={item} className="rounded-lg border border-blue-300/12 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-blue-200">Best Practice</p>
                  <p className="mt-2 text-sm text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </GlassCard>
      </div>
    </main>
  );
}
