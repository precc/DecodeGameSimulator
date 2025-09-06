import React, { useMemo, useRef, useState } from "react";

// --- Simple 6x6 FTC-style field board game simulator for DECODE-like play ---
// Single-file React app suitable for GitHub Pages. No build tools required in ChatGPT Canvas;
// when you copy to a local repo, place this component into an index.html + React CDN shell
// or a Vite/CRA project. See deployment notes in the chat.

// Utility types
const phases = ["Autonomous", "TeleOp", "Endgame"] as const;
type Phase = typeof phases[number];

type Robot = {
  id: string;
  alliance: "RED" | "BLUE";
  x: number; // grid col 0..5
  y: number; // grid row 0..5
  name: string;
  // Achievements (toggleable)
  leave: boolean; // autonomous: no longer overlaps starting line
  baseReturn: "none" | "partial" | "full"; // autonomous return to base
};

type RuleSet = {
  gridSize: number; // tiles per side
  leavePoints: number;
  basePartialPoints: number;
  baseFullPoints: number;
  movementRPThreshold: number; // alliance total LEAVE+BASE needed
};

const defaultRules: RuleSet = {
  gridSize: 6, // FTC field uses 6x6 tiles conceptually (12ft / 2ft tiles)
  leavePoints: 3,
  basePartialPoints: 5,
  baseFullPoints: 10,
  movementRPThreshold: 16, // editable in Settings
};

const initialRobots: Robot[] = [
  { id: "R1", alliance: "RED", x: 0, y: 5, name: "Red-1", leave: false, baseReturn: "none" },
  { id: "R2", alliance: "RED", x: 1, y: 5, name: "Red-2", leave: false, baseReturn: "none" },
  { id: "B1", alliance: "BLUE", x: 4, y: 0, name: "Blue-1", leave: false, baseReturn: "none" },
  { id: "B2", alliance: "BLUE", x: 5, y: 0, name: "Blue-2", leave: false, baseReturn: "none" },
];

// Helper: clamp
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Token colors
const tokenBg: Record<Robot["alliance"], string> = {
  RED: "bg-red-500",
  BLUE: "bg-blue-500",
};

export default function App() {
  const [rules, setRules] = useState<RuleSet>(() => {
    // try to load from URL hash if present
    try {
      const hash = location.hash.slice(1);
      if (hash) return { ...defaultRules, ...JSON.parse(decodeURIComponent(atob(hash))) };
    } catch {}
    return defaultRules;
  });

  const [robots, setRobots] = useState<Robot[]>(initialRobots);
  const [phase, setPhase] = useState<Phase>("Autonomous");
  const [timer, setTimer] = useState<number>(30); // seconds (Autonomous default)
  const [running, setRunning] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Timer effects
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  React.useEffect(() => {
    // auto-advance default durations when phase changes
    const durations: Record<Phase, number> = { Autonomous: 30, TeleOp: 120, Endgame: 30 };
    setTimer(durations[phase]);
  }, [phase]);

  // Drag handling
  const dragInfo = useRef<{ id: string; ox: number; oy: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent, r: Robot) => {
    e.preventDefault();
    dragInfo.current = { id: r.id, ox: r.x, oy: r.y };
  };

  const onBoardClick = (e: React.MouseEvent, col: number, row: number) => {
    if (!dragInfo.current) return;
    const id = dragInfo.current.id;
    setRobots((prev) => prev.map((rb) => (rb.id === id ? { ...rb, x: col, y: row } : rb)));
    dragInfo.current = null;
  };

  // Scoring calculations (Autonomous movement-related only in this MVP)
  const allianceTotals = useMemo(() => {
    const base = { RED: 0, BLUE: 0 } as Record<Robot["alliance"], number>;
    for (const r of robots) {
      const leave = r.leave ? rules.leavePoints : 0;
      const basePts = r.baseReturn === "full" ? rules.baseFullPoints : r.baseReturn === "partial" ? rules.basePartialPoints : 0;
      base[r.alliance] += leave + basePts;
    }
    return base;
  }, [robots, rules]);

  const movementRPEarned = {
    RED: allianceTotals.RED >= rules.movementRPThreshold,
    BLUE: allianceTotals.BLUE >= rules.movementRPThreshold,
  };

  // Serialize rules to hash for sharing
  const shareLink = useMemo(() => {
    try {
      const payload = btoa(encodeURIComponent(JSON.stringify(rules)));
      return `${location.origin}${location.pathname}#${payload}`;
    } catch {
      return location.href;
    }
  }, [rules]);

  const resetPositions = () => setRobots(initialRobots.map((r) => ({ ...r, leave: false, baseReturn: "none" })));

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">FTC DECODE Board-Game Simulator (MVP)</h1>
        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2 rounded-xl border"
            value={phase}
            onChange={(e) => setPhase(e.target.value as Phase)}
          >
            {phases.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <div className="px-3 py-2 rounded-xl border">⏱ {timer}s</div>
          <button className="px-3 py-2 rounded-xl shadow bg-slate-200 hover:bg-slate-300" onClick={() => setRunning((r) => !r)}>
            {running ? "Pause" : "Start"}
          </button>
          <button className="px-3 py-2 rounded-xl shadow bg-slate-200 hover:bg-slate-300" onClick={() => setShowSettings(true)}>
            Settings
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Field */}
        <div>
          <Field
            size={rules.gridSize}
            robots={robots}
            onTileClick={onBoardClick}
            onMouseDown={onMouseDown}
          />
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-2 rounded-xl shadow bg-slate-200 hover:bg-slate-300" onClick={resetPositions}>
              Reset Positions
            </button>
            <a className="px-3 py-2 rounded-xl shadow bg-slate-200 hover:bg-slate-300" href={shareLink}>
              Share Current Rules
            </a>
          </div>
        </div>

        {/* Scoring + Controls */}
        <div className="grid gap-4">
          <AlliancePanel
            title="Red Alliance"
            alliance="RED"
            robots={robots.filter((r) => r.alliance === "RED")}
            onUpdate={(id, patch) => setRobots((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))}
            rules={rules}
            subtotal={allianceTotals.RED}
            rpEarned={movementRPEarned.RED}
          />
          <AlliancePanel
            title="Blue Alliance"
            alliance="BLUE"
            robots={robots.filter((r) => r.alliance === "BLUE")}
            onUpdate={(id, patch) => setRobots((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))}
            rules={rules}
            subtotal={allianceTotals.BLUE}
            rpEarned={movementRPEarned.BLUE}
          />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-4 w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-3">Rule Settings (MVP)</h2>
            <div className="grid grid-cols-2 gap-3">
              <LabeledNumber label="Grid Size" value={rules.gridSize} onChange={(v) => setRules({ ...rules, gridSize: clamp(v, 4, 10) })} />
              <LabeledNumber label="LEAVE points" value={rules.leavePoints} onChange={(v) => setRules({ ...rules, leavePoints: v })} />
              <LabeledNumber label="BASE partial" value={rules.basePartialPoints} onChange={(v) => setRules({ ...rules, basePartialPoints: v })} />
              <LabeledNumber label="BASE full" value={rules.baseFullPoints} onChange={(v) => setRules({ ...rules, baseFullPoints: v })} />
              <LabeledNumber label="Movement RP threshold" value={rules.movementRPThreshold} onChange={(v) => setRules({ ...rules, movementRPThreshold: v })} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-3 py-2 rounded-xl shadow bg-slate-200 hover:bg-slate-300" onClick={() => setRules(defaultRules)}>
                Reset to Defaults
              </button>
              <button className="px-3 py-2 rounded-xl shadow bg-slate-900 text-white hover:bg-slate-800" onClick={() => setShowSettings(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 text-sm text-slate-500">
        <p>
          MVP focuses on movement achievements (LEAVE + BASE) and Movement RP. Add DECODE-specific
          game elements later (Samples, Keys, etc.) by extending the rule set and UI sections.
        </p>
      </footer>
    </div>
  );
}

function Field({
  size,
  robots,
  onTileClick,
  onMouseDown,
}: {
  size: number;
  robots: Robot[];
  onTileClick: (e: React.MouseEvent, col: number, row: number) => void;
  onMouseDown: (e: React.MouseEvent, r: Robot) => void;
}) {
  const cells = [] as JSX.Element[];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const isStartRed = row === size - 1; // bottom row
      const isStartBlue = row === 0; // top row
      const isBaseRed = col <= 1 && row >= size - 2; // approx corner area
      const isBaseBlue = col >= size - 2 && row <= 1; // approx corner area

      cells.push(
        <div
          key={`${col}-${row}`}
          className={
            "relative border aspect-square select-none cursor-pointer " +
            (isStartRed || isStartBlue ? " bg-slate-100 " : "") +
            (isBaseRed ? " after:content-[''] after:absolute after:inset-1 after:rounded-xl after:border-2 after:border-red-400 " : "") +
            (isBaseBlue ? " after:content-[''] after:absolute after:inset-1 after:rounded-xl after:border-2 after:border-blue-400 " : "")
          }
          onClick={(e) => onTileClick(e, col, row)}
          title={`(${col + 1}, ${row + 1})`}
        />
      );
    }
  }

  return (
    <div className="relative">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {cells}
      </div>
      {/* Robot tokens */}
      <div className="pointer-events-none">
        {robots.map((r) => (
          <Token key={r.id} size={size} r={r} onMouseDown={onMouseDown} />
        ))}
      </div>
      <div className="mt-2 text-xs text-slate-500">
        Tip: click a tile to move the last-selected robot (click robot first). Red start = bottom row; Blue start = top row. Corner outlines ≈ Base Zones.
      </div>
    </div>
  );
}

function Token({ size, r, onMouseDown }: { size: number; r: Robot; onMouseDown: (e: React.MouseEvent, r: Robot) => void }) {
  // Position token via CSS grid math
  const pct = 100 / size;
  return (
    <div
      className={`pointer-events-auto absolute ${tokenBg[r.alliance]} text-white rounded-full shadow-lg flex items-center justify-center text-xs font-semibold`}
      onMouseDown={(e) => onMouseDown(e, r)}
      style={{
        width: `calc(${pct}% - 10px)`,
        height: `calc(${pct}% - 10px)`,
        left: `calc(${r.x * pct}% + 5px)`,
        top: `calc(${r.y * pct}% + 5px)`,
      }}
      title={`${r.name} (${r.x + 1}, ${r.y + 1})`}
    >
      {r.name}
    </div>
  );
}

function AlliancePanel({
  title,
  alliance,
  robots,
  onUpdate,
  rules,
  subtotal,
  rpEarned,
}: {
  title: string;
  alliance: Robot["alliance"];
  robots: Robot[];
  onUpdate: (id: string, patch: Partial<Robot>) => void;
  rules: RuleSet;
  subtotal: number;
  rpEarned: boolean;
}) {
  return (
    <div className="rounded-2xl border p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs ${alliance === "RED" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
          {alliance}
        </span>
      </div>

      <div className="mt-3 grid gap-3">
        {robots.map((r) => (
          <div key={r.id} className="rounded-xl border p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="font-medium">{r.name}</div>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-slate-800"
                  checked={r.leave}
                  onChange={(e) => onUpdate(r.id, { leave: e.target.checked })}
                />
                <span>LEAVE (+{rules.leavePoints})</span>
              </label>
              <div className="flex items-center gap-2">
                <span>BASE:</span>
                <select
                  className="px-2 py-1 rounded-lg border"
                  value={r.baseReturn}
                  onChange={(e) => onUpdate(r.id, { baseReturn: e.target.value as Robot["baseReturn"] })}
                >
                  <option value="none">None</option>
                  <option value="partial">Partial (+{rules.basePartialPoints})</option>
                  <option value="full">Full (+{rules.baseFullPoints})</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-600">Autonomous Movement Subtotal</div>
        <div className="text-xl font-bold">{subtotal}</div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-sm text-slate-600">Movement RP Threshold</div>
        <div className="text-sm">{rules.movementRPThreshold}</div>
      </div>
      <div className="mt-2">
        {rpEarned ? (
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm">Movement RP Achieved ✅</span>
        ) : (
          <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm">Not yet — add {Math.max(0, rules.movementRPThreshold - subtotal)} pts</span>
        )}
      </div>
    </div>
  );
}

function LabeledNumber({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-slate-600">{label}</span>
      <input
        type="number"
        className="px-3 py-2 rounded-xl border"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
