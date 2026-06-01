'use client';
import { useState, useEffect } from 'react';
import { useMemory } from '@/lib/memory/session';
import { saveRun, loadHistory, HistoryEntry } from '@/lib/memory/persistent';

type SchemaSummary = {
  domain?: string;
};

export default function Home() {
  const {
    prdText, schema, components, agentLog,
    status, widgetsFound,
    setPrd, setSchema, setStatus, addComponent,
    addLog, setWidgetsFound, reset,
  } = useMemory();

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedWidget, setSelectedWidget] = useState('');

  // Load history from IndexedDB on page load
  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  async function runPipeline() {
    if (!prdText.trim()) return;
    reset();
    setStatus('running');

    addLog('SYSTEM', 'Pipeline started');
    addLog('AGENT 1', 'Reading PRD text...');

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prd: prdText }),
      });

      const data = await res.json();

      if (data.error) {
        addLog('SYSTEM', `Error: ${data.error}`);
        setStatus('error');
        return;
      }

      // Update memory with Agent 1 result
      setSchema(data.schema);
      setWidgetsFound(data.tree.length);
      addLog('AGENT 1', `Schema ready — found ${data.tree.length} widgets`);
      addLog('AGENT 1', `Widgets: ${data.tree.join(', ')}`);
      addLog('AGENT 2', 'Generating React components...');

      // Update memory with Agent 2 results
      for (const name of data.tree) {
        addComponent(name, data.components[name]);
        addLog('AGENT 2', `Generated ${name}.tsx`);
      }

      // Save to long-term memory (IndexedDB)
      await saveRun(prdText, data.schema, data.tree);
      addLog('MEMORY', 'Run saved to long-term memory');

      // Refresh history panel
      const updated = await loadHistory();
      setHistory(updated);

      setStatus('done');
      addLog('SYSTEM', 'Pipeline complete');

      // Auto-select first widget
      if (data.tree.length > 0) setSelectedWidget(data.tree[0]);

    } catch (err) {
      addLog('SYSTEM', `Failed: ${String(err)}`);
      setStatus('error');
    }
  }

  const tree = Object.keys(components);
  const schemaDomain = schema && 'domain' in schema
    ? String((schema as SchemaSummary).domain || '—')
    : '—';
  const statusLabel = status === 'running'
    ? 'Agents running'
    : status === 'done'
      ? 'Ready'
      : status === 'error'
        ? 'Needs attention'
        : 'Standing by';
  const statusTone = status === 'running'
    ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
    : status === 'done'
      ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
      : status === 'error'
        ? 'border-rose-400/40 bg-rose-400/10 text-rose-200'
        : 'border-slate-600/60 bg-slate-900/70 text-slate-300';

  return (
    <main className="ocean-grid min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="glow-orb left-[-8rem] top-[-7rem] bg-teal-400/25" />
        <div className="glow-orb bottom-[-10rem] right-[-6rem] bg-blue-500/20 delay-700" />
        <div className="glow-orb left-[45%] top-[18%] h-44 w-44 bg-purple-500/10 delay-1000" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-slate-950/75 px-6 py-4 shadow-2xl shadow-teal-950/20 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="animate-fade-in">
            <p className="text-[0.65rem] uppercase tracking-[0.45em] text-teal-300/70">Maritime UI Generator</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-teal-300/30 bg-teal-300/10 text-xl shadow-lg shadow-teal-500/20">⚓</span>
              <div>
                <h1 className="font-mono text-2xl font-bold text-white">BridgeView AI</h1>
                <p className="text-sm text-slate-400">Turn vessel product briefs into generated dashboard components.</p>
              </div>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-2 text-xs font-mono">
            <span className="rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1.5 text-teal-200 shadow-sm shadow-teal-500/10">Agent 1: PRD Parser</span>
            <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 text-blue-200 shadow-sm shadow-blue-500/10">Agent 2: UI Builder</span>
            <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1.5 text-purple-200 shadow-sm shadow-purple-500/10">Memory Active</span>
            <span className={`rounded-full border px-3 py-1.5 ${statusTone}`}>
              <span className={`mr-2 inline-block h-2 w-2 rounded-full ${status === 'running' ? 'animate-ping bg-amber-300' : 'bg-current'}`} />
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid h-[calc(100vh-97px)] grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[minmax(320px,0.9fr)_minmax(360px,1.1fr)_minmax(300px,0.9fr)] lg:overflow-hidden">

        {/* LEFT PANEL — Input */}
        <section className="glass-panel animate-panel-rise flex min-h-[36rem] flex-col overflow-hidden lg:min-h-0">
          <div className="border-b border-white/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-400">PRD Input</p>
              <span className="rounded-full bg-slate-900/80 px-2.5 py-1 text-[0.65rem] font-mono text-slate-400">{prdText.length} chars</span>
            </div>
            <textarea
              value={prdText}
              onChange={(e) => setPrd(e.target.value)}
              placeholder="Paste your maritime PRD here...&#10;&#10;Example:&#10;Build a vessel monitoring dashboard with voyage tracking, fuel analytics, crew certification, and emergency alerts."
              className="h-44 w-full resize-none rounded-2xl border border-slate-700/80 bg-slate-950/80 p-4 text-sm leading-6 text-slate-200 shadow-inner shadow-black/30 outline-none transition duration-300 placeholder:text-slate-600 focus:border-teal-400/80 focus:ring-4 focus:ring-teal-400/10"
            />
            <button
              onClick={runPipeline}
              disabled={status === 'running' || !prdText.trim()}
              className="group relative mt-3 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 px-4 py-3 font-mono text-sm font-bold text-white shadow-xl shadow-cyan-950/40 transition duration-300 hover:-translate-y-0.5 hover:shadow-cyan-500/25 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="absolute inset-0 -translate-x-full bg-white/20 transition duration-700 group-hover:translate-x-full" />
              <span className="relative">{status === 'running' ? '⟳ Agents running...' : '⚡ Generate UI'}</span>
            </button>
          </div>

          {/* Memory panel */}
          <div className="border-b border-white/10 p-4">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-slate-400">◈ Memory Store</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="metric-card">
                <div className="text-purple-300">STATUS</div>
                <div className="mt-1 text-slate-100">{status}</div>
              </div>
              <div className="metric-card">
                <div className="text-purple-300">WIDGETS</div>
                <div className="mt-1 text-slate-100">{widgetsFound || '—'}</div>
              </div>
              <div className="metric-card col-span-2">
                <div className="text-purple-300">SCHEMA</div>
                <div className="mt-1 truncate text-slate-100">
                  {schemaDomain}
                </div>
              </div>
              <div className="metric-card col-span-2">
                <div className="text-purple-300">HISTORY RUNS</div>
                <div className="mt-1 text-slate-100">{history.length} saved</div>
              </div>
            </div>
          </div>

          {/* Agent log */}
          <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-slate-400">Agent Log</p>
            <div className="space-y-2">
              {agentLog.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/50 p-4 text-xs font-mono text-slate-500">
                  Waiting for pipeline...
                </p>
              )}
              {agentLog.map((log, i) => (
                <div key={i} className="animate-fade-in flex gap-2 rounded-xl border border-white/5 bg-slate-950/50 px-3 py-2 text-xs font-mono">
                  <span className="text-slate-600">{log.time}</span>
                  <span className={
                    log.agent === 'AGENT 1' ? 'text-teal-400' :
                    log.agent === 'AGENT 2' ? 'text-blue-400' :
                    log.agent === 'MEMORY'  ? 'text-purple-400' :
                    'text-slate-400'
                  }>
                    {log.agent}
                  </span>
                  <span className="text-slate-300">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CENTRE PANEL — Component tree + code */}
        <section className="glass-panel animate-panel-rise flex min-h-[36rem] flex-col overflow-hidden delay-150 lg:min-h-0">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-400">Component Tree</p>
              <span className="rounded-full bg-teal-400/10 px-2.5 py-1 text-[0.65rem] font-mono text-teal-200">{tree.length} files</span>
            </div>
          </div>

          {tree.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div className="animate-float max-w-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-teal-300/20 bg-teal-300/10 text-3xl shadow-2xl shadow-teal-950/60">⌁</div>
                <h2 className="text-lg font-semibold text-slate-200">No components yet</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Run the pipeline to watch generated widgets appear here with source code preview.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-white/10 p-4 space-y-2">
                {tree.map((name, index) => (
                  <button
                    key={name}
                    onClick={() => setSelectedWidget(name)}
                    style={{ animationDelay: `${index * 75}ms` }}
                    className={`animate-fade-in w-full rounded-2xl px-3 py-3 text-left text-sm font-mono flex items-center gap-3 transition duration-300 hover:-translate-y-0.5 ${
                      selectedWidget === name
                        ? 'border border-teal-400/60 bg-teal-400/15 text-teal-100 shadow-lg shadow-teal-950/30'
                        : 'border border-white/5 bg-slate-950/60 text-slate-300 hover:border-slate-500/60 hover:bg-slate-900/80'
                    }`}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">✓</span>
                    <span>{name}.tsx</span>
                    <span className="ml-auto text-slate-600">TSX</span>
                  </button>
                ))}
              </div>

              {/* Code viewer */}
              <div className="custom-scrollbar flex-1 overflow-auto p-4">
                {selectedWidget && (
                  <>
                    <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-slate-400">
                      CODE — {selectedWidget}
                    </p>
                    <pre className="rounded-2xl border border-slate-700/70 bg-slate-950/85 p-4 text-xs font-mono leading-relaxed text-yellow-200 shadow-inner shadow-black/40 whitespace-pre-wrap">
                      {components[selectedWidget]}
                    </pre>
                  </>
                )}
              </div>
            </>
          )}
        </section>

        {/* RIGHT PANEL — History */}
        <section className="glass-panel animate-panel-rise flex min-h-[36rem] flex-col overflow-hidden delay-300 lg:min-h-0">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-400">Long-Term Memory</p>
              <span className="rounded-full bg-purple-400/10 px-2.5 py-1 text-[0.65rem] font-mono text-purple-200">History</span>
            </div>
          </div>
          <div className="custom-scrollbar flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/50 p-5 text-center">
                <p className="text-sm font-semibold text-slate-300">Memory is clear</p>
                <p className="mt-2 text-xs font-mono leading-5 text-slate-600">
                  Complete a pipeline run to see saved PRDs and generated widgets here.
                </p>
              </div>
            ) : (
              history.map((entry, index) => (
                <div
                  key={entry.id}
                  style={{ animationDelay: `${index * 80}ms` }}
                  className="animate-fade-in group cursor-pointer rounded-3xl border border-slate-800/90 bg-slate-950/70 p-4 shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-purple-300/40 hover:bg-slate-900/90"
                  onClick={() => setPrd(entry.prd)}
                >
                  <p className="font-mono text-xs text-slate-500 transition group-hover:text-purple-200">{entry.savedAt}</p>
                  <p className="mt-2 truncate text-sm text-slate-200">{entry.prd}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.widgets.map((w) => (
                      <span key={w} className="rounded-full bg-slate-800/90 px-2 py-0.5 text-xs font-mono text-teal-300">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </main>
  );
}