"use client";

import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "markah_silat_match_v2";

const warningPenalties = {
  1: 0,
  2: 1,
  3: 2,
  4: 5,
  5: 10,
};

const warningList = [
  { level: 1, icon: "☝🏻", penaltyText: "0" },
  { level: 2, icon: "✌🏻", penaltyText: "-1" },
  { level: 3, icon: "🙋🏻‍♂️❗", penaltyText: "-2" },
  { level: 4, icon: "🙋🏻‍♂️🚫", penaltyText: "-5" },
  { level: 5, icon: "🙅🏻‍♂️❌", penaltyText: "-10" },
];

function getPenalty(level) {
  return warningPenalties[level] || 0;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getVisibleWarnings(records, limit = 5) {
  const safeRecords = safeArray(records);
  const latest = [];
  const used = new Set();

  for (let i = safeRecords.length - 1; i >= 0; i -= 1) {
    const level = safeRecords[i];

    if (!used.has(level)) {
      latest.push(level);
      used.add(level);
    }

    if (latest.length >= limit) break;
  }

  return latest;
}

function getWarningCount(records, level) {
  return safeArray(records).filter((item) => item === level).length;
}

function loadState() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    return {
      scores: parsed.scores || { biru: 0, merah: 0 },
      warnings: {
        biru: safeArray(parsed.warnings?.biru),
        merah: safeArray(parsed.warnings?.merah),
      },
      logs: safeArray(parsed.logs),
      actions: safeArray(parsed.actions),
    };
  } catch {
    return null;
  }
}

function saveState(state) {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function downloadCSV(logs) {
  const rows = [["Log"]];

  logs.forEach((log) => {
    rows.push([log]);
  });

  const csv = rows.map((row) => row.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "silat-log.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function WarningDisplay({ records, mobile = false }) {
  const visible = getVisibleWarnings(records, 5);

  if (visible.length === 0) {
    return (
      <div className="w-full h-full min-h-[42px] rounded-xl border border-white/10 bg-black/15 flex items-center justify-center text-white/25 text-sm font-black">
        —
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[42px] rounded-xl border border-white/10 bg-black/15 px-1.5 py-1 flex items-center justify-center gap-1 overflow-hidden">
      {visible.map((level, index) => {
        const count = getWarningCount(records, level);
        const warning = warningList.find((item) => item.level === level);
        const isLatest = index === 0;

        return (
          <div
            key={`${level}-${count}-${index}`}
            className={`relative flex flex-col items-center justify-center rounded-xl border bg-black/45 shadow-lg shrink-0 ${
              mobile ? "w-10 h-10" : "w-9 h-9"
            } ${isLatest ? "border-white ring-1 ring-white" : "border-white/15"}`}
          >
            <div className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center border border-black shadow">
              {count}
            </div>
            <div className={mobile ? "text-lg leading-none" : "text-base leading-none"}>{warning?.icon}</div>
            <div className="text-[7px] font-black leading-none mt-0.5 text-white/70">A{level}</div>
          </div>
        );
      })}
    </div>
  );
}

function ScoreCard({
  side,
  label,
  score,
  warnings,
  onScore,
  onMinus,
  onWarning,
  onUndo,
  mobile,
}) {
  const totalPenalty = safeArray(warnings).reduce((total, level) => total + getPenalty(level), 0);

  return (
    <div
      className={`flex-1 rounded-3xl border shadow-2xl overflow-hidden p-2 flex flex-col justify-between ${
        side === "biru"
          ? "bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950 border-blue-300/20"
          : "bg-gradient-to-br from-red-700 via-red-800 to-slate-950 border-red-300/20"
      }`}
    >
      <div className="rounded-2xl bg-black/20 border border-white/10 p-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[8px] uppercase tracking-[0.2em] text-white/60">Sudut</div>
            <div className="text-lg font-black leading-none">{label}</div>
          </div>

          <div className="text-right">
            <div className="text-[8px] text-white/60">Tolak</div>
            <div className="text-sm font-black">-{totalPenalty}</div>
          </div>
        </div>

        <div className={`${mobile ? "mt-1 min-h-[52px]" : "mt-2 min-h-[48px]"} rounded-xl bg-gradient-to-br from-white/12 to-white/5 border border-white/10 px-1.5 py-1 flex items-center justify-center overflow-hidden`}>
          <WarningDisplay records={warnings} mobile={mobile} />
        </div>

        <div className={`text-center font-black leading-none tabular-nums ${mobile ? "text-[4.1rem]" : "text-[3.3rem]"}`}>
          {score}
        </div>
      </div>

      <div className="mt-1 flex flex-col gap-1">
        <div className="grid grid-cols-5 gap-1">
          {warningList.map((item) => (
            <button
              key={item.level}
              onClick={() => onWarning(side, item.level)}
              className="rounded-xl bg-black/25 border border-white/10 py-1 active:scale-95"
            >
              <div className="text-sm">{item.icon}</div>
              <div className="text-[7px] font-black">A{item.level}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onScore(side, 1)}
            className="rounded-2xl bg-white text-black py-2 shadow-xl active:scale-95"
          >
            <div className="text-2xl">👊</div>
            <div className="text-xs font-black">+1</div>
          </button>

          <button
            onClick={() => onScore(side, 2)}
            className="rounded-2xl bg-white text-black py-2 shadow-xl active:scale-95"
          >
            <div className="text-2xl">🦶</div>
            <div className="text-xs font-black">+2</div>
          </button>

          <button
            onClick={() => onScore(side, 3)}
            className="rounded-2xl bg-white text-black py-2 shadow-xl active:scale-95"
          >
            <div className="text-2xl">🔥</div>
            <div className="text-xs font-black">+3</div>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => onScore(side, 1)}
            className="rounded-xl bg-emerald-500 text-white py-1.5 text-xl font-black shadow-lg active:scale-95"
          >
            ➕
          </button>

          <button
            onClick={() => onMinus(side)}
            className="rounded-xl bg-black text-white py-1.5 text-xl font-black shadow-lg active:scale-95"
          >
            ➖
          </button>

          <button
            onClick={() => onUndo(side)}
            className={`rounded-xl py-1.5 text-xl font-black shadow-lg active:scale-95 ${
              side === "biru" ? "bg-blue-500" : "bg-red-500"
            }`}
          >
            ↩️
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [scores, setScores] = useState({ biru: 0, merah: 0 });
  const [warnings, setWarnings] = useState({ biru: [], merah: [] });
  const [logs, setLogs] = useState([]);
  const [actions, setActions] = useState([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [mobileView, setMobileView] = useState(false);

  useEffect(() => {
    const saved = loadState();

    if (saved) {
      setScores(saved.scores);
      setWarnings(saved.warnings);
      setLogs(saved.logs);
      setActions(saved.actions);
    }
  }, []);

  useEffect(() => {
    saveState({ scores, warnings, logs, actions });
  }, [scores, warnings, logs, actions]);

  const winner = useMemo(() => {
    if (scores.biru === scores.merah) {
      return { label: "SERI", icon: "⚪" };
    }

    return scores.biru > scores.merah
      ? { label: "BIRU", icon: "🔵" }
      : { label: "MERAH", icon: "🔴" };
  }, [scores]);

  const addLog = (text) => {
    setLogs((prev) => [text, ...prev].slice(0, 50));
  };

  const addScore = (side, point) => {
    setScores((prev) => ({ ...prev, [side]: prev[side] + point }));
    setActions((prev) => [...prev, { type: "score", side, point }]);
    addLog(`${side.toUpperCase()} +${point}`);
  };

  const addWarning = (side, level) => {
    const penalty = getPenalty(level);

    setWarnings((prev) => ({
      ...prev,
      [side]: [...safeArray(prev[side]), level],
    }));

    setScores((prev) => ({
      ...prev,
      [side]: prev[side] - penalty,
    }));

    setActions((prev) => [...prev, { type: "warning", side, level, penalty }]);
    addLog(`${side.toUpperCase()} AMARAN ${level} (-${penalty})`);
  };

  const minusScore = (side) => {
    setScores((prev) => ({
      ...prev,
      [side]: prev[side] - 1,
    }));

    setActions((prev) => [...prev, { type: "minus", side }]);
    addLog(`${side.toUpperCase()} -1`);
  };

  const undo = (side) => {
    const latestIndex = [...actions]
      .reverse()
      .findIndex((item) => item.side === side);

    if (latestIndex === -1) return;

    const actualIndex = actions.length - 1 - latestIndex;
    const action = actions[actualIndex];

    setActions((prev) => prev.filter((_, index) => index !== actualIndex));

    if (action.type === "score") {
      setScores((prev) => ({
        ...prev,
        [side]: prev[side] - action.point,
      }));
    }

    if (action.type === "minus") {
      setScores((prev) => ({
        ...prev,
        [side]: prev[side] + 1,
      }));
    }

    if (action.type === "warning") {
      setScores((prev) => ({
        ...prev,
        [side]: prev[side] + action.penalty,
      }));

      setWarnings((prev) => ({
        ...prev,
        [side]: safeArray(prev[side]).slice(0, -1),
      }));
    }

    addLog(`UNDO ${side.toUpperCase()}`);
  };

  const resetAll = () => {
    setScores({ biru: 0, merah: 0 });
    setWarnings({ biru: [], merah: [] });
    setLogs([]);
    setActions([]);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const isPhone = mobileView || (typeof window !== "undefined" && window.innerWidth < 700);

  return (
    <div className="h-screen bg-slate-950 text-white overflow-hidden p-1 sm:p-2">
      <div className="w-full h-full flex flex-col gap-1 overflow-hidden">
        <header className="rounded-2xl bg-white/8 border border-white/10 px-2 py-2 flex items-center justify-between shrink-0">
          <button
            onClick={toggleFullscreen}
            className="rounded-xl bg-black border border-white/10 px-2 py-1 text-xs font-black"
          >
            {fullscreen ? "⤢" : "⛶"}
          </button>

          <div className="text-center">
            <div className="text-[9px] tracking-[0.2em] uppercase text-white/40">Silat</div>
            <div className="text-sm font-black">LIVE SCORE</div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMobileView((prev) => !prev)}
              className="rounded-xl bg-black border border-white/10 px-2 py-1 text-xs font-black"
            >
              {mobileView ? "💻" : "📱"}
            </button>

            <button
              onClick={() => downloadCSV(logs)}
              className="rounded-xl bg-black border border-white/10 px-2 py-1 text-xs font-black"
            >
              📄
            </button>

            <button
              onClick={resetAll}
              className="rounded-xl bg-white text-black px-2 py-1 text-xs font-black"
            >
              ↺
            </button>
          </div>
        </header>

        <div className="rounded-2xl bg-white/8 border border-white/10 py-1 px-2 flex items-center justify-center shrink-0">
          <span className="text-xl">{winner.icon}</span>
        </div>

        <main className={`flex-1 min-h-0 gap-1 ${isPhone ? "flex flex-col" : "grid grid-cols-2"}`}>
          <ScoreCard
            side="biru"
            label="BIRU"
            score={scores.biru}
            warnings={warnings.biru}
            onScore={addScore}
            onMinus={minusScore}
            onWarning={addWarning}
            onUndo={undo}
            mobile={isPhone}
          />

          {!isPhone && (
            <div className="hidden" />
          )}

          <ScoreCard
            side="merah"
            label="MERAH"
            score={scores.merah}
            warnings={warnings.merah}
            onScore={addScore}
            onMinus={minusScore}
            onWarning={addWarning}
            onUndo={undo}
            mobile={isPhone}
          />
        </main>

        <div className="rounded-2xl bg-white/8 border border-white/10 overflow-hidden shrink-0">
          <button
            onClick={() => setShowLogs((prev) => !prev)}
            className="w-full px-3 py-2 text-left flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-black">📋 Log</div>
              <div className="text-[10px] text-white/40">{logs.length} rekod</div>
            </div>

            <div>{showLogs ? "⌃" : "⌄"}</div>
          </button>

          {showLogs && (
            <div className="border-t border-white/10 p-2 max-h-32 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <div className="text-sm text-white/40">Tiada log</div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={`${log}-${index}`}
                    className="rounded-xl bg-black/20 border border-white/10 px-2 py-1 text-xs"
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
