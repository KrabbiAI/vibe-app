import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

const MOODS = [
  { id: "sunny", label: "☀️ Warm", color: "#FFB347", textColor: "#2D1B00", desc: "Sommer, Euphorie", angle: 0 },
  { id: "electric", label: "⚡ Electric", color: "#7DF9FF", textColor: "#001A2C", desc: "Energie, Club", angle: 60 },
  { id: "dreamy", label: "🌙 Dreamy", color: "#B39DDB", textColor: "#0D0020", desc: "Tief, Träumerisch", angle: 120 },
  { id: "dark", label: "🌑 Dark", color: "#2D2D3A", textColor: "#E0E0FF", desc: "Intensiv, Drama", angle: 180 },
  { id: "forest", label: "🌿 Forest", color: "#52B788", textColor: "#001A10", desc: "Entspannt, Natur", angle: 240 },
  { id: "fire", label: "🔥 Fire", color: "#FF4500", textColor: "#FFF0E6", desc: "Wut, Power", angle: 300 },
];

const PADS = [
  { id: 0, label: "KICK", icon: "●", baseColor: "#FF6B6B" },
  { id: 1, label: "SNARE", icon: "◆", baseColor: "#FFD93D" },
  { id: 2, label: "BASS", icon: "▼", baseColor: "#6BCB77" },
  { id: 3, label: "CHORD", icon: "■", baseColor: "#4D96FF" },
  { id: 4, label: "LEAD", icon: "★", baseColor: "#C77DFF" },
  { id: 5, label: "FX", icon: "◉", baseColor: "#FF9A3C" },
];

const BG_MAP: Record<string, string> = {
  sunny: "radial-gradient(ellipse at 30% 20%, #FFD700 0%, #FF8C00 40%, #1a0a00 100%)",
  electric: "radial-gradient(ellipse at 70% 30%, #00FFFF 0%, #0080FF 40%, #000820 100%)",
  dreamy: "radial-gradient(ellipse at 50% 10%, #E040FB 0%, #5C35CC 40%, #0a001a 100%)",
  dark: "radial-gradient(ellipse at 20% 80%, #3D1A78 0%, #0D0D1A 60%, #000000 100%)",
  forest: "radial-gradient(ellipse at 60% 20%, #00FF88 0%, #007744 40%, #001108 100%)",
  fire: "radial-gradient(ellipse at 40% 10%, #FFD700 0%, #FF2200 40%, #1A0000 100%)",
};

const ACCENT_MAP: Record<string, string> = {
  sunny: "#FFD700",
  electric: "#00FFFF",
  dreamy: "#E040FB",
  dark: "#7B61FF",
  forest: "#00FF88",
  fire: "#FF4500",
};

function getEnergyLabel(energy: number): string {
  if (energy < 25) return "😴 Chill";
  if (energy < 50) return "😌 Flow";
  if (energy < 75) return "🙂 Vibe";
  return "🤯 Banger";
}

function bpmFromEnergy(energy: number): number {
  return Math.round(60 + (energy / 100) * 100);
}

export default function App() {
  const [activeMood, setActiveMood] = useState("sunny");
  const [energy, setEnergy] = useState(50);
  const [activePads, setActivePads] = useState<Set<number>>(new Set([0, 2, 3]));
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatStep, setBeatStep] = useState(-1);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [padPulse, setPadPulse] = useState<Set<number>>(new Set());

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rippleIdRef = useRef(0);

  const accent = ACCENT_MAP[activeMood];
  const currentMood = MOODS.find((m) => m.id === activeMood)!;
  const bpm = bpmFromEnergy(energy);

  const togglePad = useCallback((id: number) => {
    setActivePads((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleMoodClick = useCallback((id: string, e: React.MouseEvent) => {
    setActiveMood(id);
    const rect = e.currentTarget.getBoundingClientRect();
    const newId = rippleIdRef.current++;
    setRipples((r) => [...r, { id: newId, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== newId)), 1000);
  }, []);

  const handleRemix = useCallback(() => {
    const pads = new Set([0, 1, 2, 3, 4, 5].filter(() => Math.random() > 0.4));
    setActivePads(pads.size ? pads : new Set([0, 2, 3]));
    setEnergy(Math.round(Math.random() * 100));
    const moodIds = MOODS.map((m) => m.id);
    setActiveMood(moodIds[Math.floor(Math.random() * moodIds.length)]);
  }, []);

  // Beat sequencer
  useEffect(() => {
    if (isPlaying) {
      const interval = Math.round(60000 / bpm / 2);
      let step = 0;
      intervalRef.current = setInterval(() => {
        setBeatStep(step % 8);
        const triggered = new Set<number>();
        if (activePads.has(0) && step % 2 === 0) triggered.add(0);
        if (activePads.has(1) && step % 4 === 2) triggered.add(1);
        if (activePads.has(2) && step % 4 === 0) triggered.add(2);
        if (activePads.has(3) && step % 8 === 0) triggered.add(3);
        if (activePads.has(4) && step % 8 === 4) triggered.add(4);
        if (activePads.has(5) && step % 16 === 0) triggered.add(5);
        setPadPulse(triggered);
        setTimeout(() => setPadPulse(new Set()), 80);
        step++;
      }, interval);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setBeatStep(-1);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, bpm, activePads]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG_MAP[activeMood],
        transition: "background 1.2s ease",
        fontFamily: "'Space Mono', 'Courier New', monospace",
        color: "#fff",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Ripple Effects */}
      {ripples.map((r) => (
        <div
          key={r.id}
          style={{
            position: "fixed",
            left: r.x,
            top: r.y,
            width: 0,
            height: 0,
            borderRadius: "50%",
            border: `2px solid ${accent}`,
            animation: "rippleOut 1s ease-out forwards",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 100,
          }}
        />
      ))}

      {/* Ambient glow orb */}
      <div
        style={{
          position: "fixed",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
          filter: "blur(40px)",
          pointerEvents: "none",
          transition: `background 1.2s ease`,
          animation: isPlaying ? "pulse 0.6s ease-in-out infinite alternate" : "none",
        }}
      />

      {/* Header */}
      <header
        style={{
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 28, fontWeight: "bold", letterSpacing: 6, color: accent }}>VIBE</div>
          <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 3 }}>MUSIK OHNE NOTEN</div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.08)",
            border: `1px solid ${accent}44`,
            borderRadius: 20,
            padding: "6px 16px",
            fontSize: 13,
            letterSpacing: 2,
          }}
        >
          {bpm} BPM
        </div>
      </header>

      <main
        style={{
          flex: 1,
          padding: "0 24px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          zIndex: 10,
        }}
      >
        {/* MOOD WHEEL SECTION */}
        <section>
          <div style={{ fontSize: 11, letterSpacing: 4, opacity: 0.5, marginBottom: 14 }}>DEINE STIMMUNG</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                onClick={(e) => handleMoodClick(mood.id, e)}
                data-testid={`mood-${mood.id}`}
                data-active={activeMood === mood.id ? "true" : "false"}
                style={{
                  background:
                    activeMood === mood.id
                      ? `${mood.color}EE`
                      : `${mood.color}22`,
                  border: `2px solid ${activeMood === mood.id ? mood.color : mood.color + "44"}`,
                  borderRadius: 16,
                  padding: "14px 8px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  color: activeMood === mood.id ? mood.textColor : "#fff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  transform: activeMood === mood.id ? "scale(1.05)" : "scale(1)",
                  boxShadow: activeMood === mood.id ? `0 0 24px ${mood.color}88` : "none",
                }}
              >
                <span style={{ fontSize: 22 }}>{mood.label.split(" ")[0]}</span>
                <span style={{ fontSize: 12, fontWeight: "bold", letterSpacing: 1 }}>
                  {mood.label.split(" ").slice(1).join(" ")}
                </span>
                <span style={{ fontSize: 9, opacity: 0.7, letterSpacing: 1 }}>{mood.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ENERGY SLIDER */}
        <section
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: 4, opacity: 0.5 }}>ENERGIE</div>
            <div style={{ fontSize: 16, fontWeight: "bold" }} data-testid="energy-label">{getEnergyLabel(energy)}</div>
          </div>
          <div style={{ position: "relative" }}>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: "rgba(255,255,255,0.1)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                data-testid="energy-fill"
                style={{
                  height: "100%",
                  width: `${energy}%`,
                  background: `linear-gradient(90deg, ${accent}88, ${accent})`,
                  borderRadius: 4,
                  transition: "width 0.1s ease",
                  boxShadow: `0 0 12px ${accent}`,
                }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              data-testid="energy-slider"
              style={{
                position: "absolute",
                top: -4,
                left: 0,
                right: 0,
                width: "100%",
                opacity: 0,
                cursor: "pointer",
                height: 16,
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, opacity: 0.4, letterSpacing: 2 }}>
            <span>AMBIENT</span>
            <span>BANGER</span>
          </div>
        </section>

        {/* PADS */}
        <section>
          <div style={{ fontSize: 11, letterSpacing: 4, opacity: 0.5, marginBottom: 14 }}>SOUNDS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {PADS.map((pad) => {
              const active = activePads.has(pad.id);
              const pulsing = padPulse.has(pad.id);
              return (
                <button
                  key={pad.id}
                  onClick={() => togglePad(pad.id)}
                  data-testid={`pad-${pad.id}`}
                  data-active={active ? "true" : "false"}
                  style={{
                    background: active
                      ? `${pad.baseColor}${pulsing ? "FF" : "CC"}`
                      : "rgba(255,255,255,0.05)",
                    border: `2px solid ${active ? pad.baseColor : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 16,
                    padding: "18px 12px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    color: active ? "#000" : "#fff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    transform: pulsing ? "scale(0.94)" : active ? "scale(1)" : "scale(0.97)",
                    boxShadow: active ? `0 0 20px ${pad.baseColor}88` : "none",
                    opacity: active ? 1 : 0.4,
                  }}
                >
                  <span style={{ fontSize: 20, fontWeight: "bold" }}>{pad.icon}</span>
                  <span style={{ fontSize: 10, letterSpacing: 2, fontWeight: "bold" }}>{pad.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* BEAT VISUALIZER */}
        {isPlaying && (
          <section style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                data-testid={`beat-step-${i}`}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: i === beatStep ? accent : "rgba(255,255,255,0.1)",
                  boxShadow: i === beatStep ? `0 0 12px ${accent}` : "none",
                  transition: "all 0.08s ease",
                }}
              />
            ))}
          </section>
        )}

        {/* PLAY BUTTON + MAGIC */}
        <section style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setIsPlaying((p) => !p)}
            data-testid="play-button"
            style={{
              flex: 2,
              background: isPlaying
                ? `linear-gradient(135deg, ${accent}CC, ${accent})`
                : "rgba(255,255,255,0.08)",
              border: `2px solid ${accent}`,
              borderRadius: 20,
              padding: "20px",
              cursor: "pointer",
              color: isPlaying ? "#000" : "#fff",
              fontSize: 18,
              fontFamily: "inherit",
              fontWeight: "bold",
              letterSpacing: 3,
              transition: "all 0.3s ease",
              boxShadow: isPlaying ? `0 0 30px ${accent}88` : "none",
              transform: isPlaying ? "scale(1.02)" : "scale(1)",
            }}
          >
            {isPlaying ? "⏹ STOP" : "▶ PLAY"}
          </button>
          <button
            onClick={handleRemix}
            data-testid="remix-button"
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,255,255,0.2)",
              borderRadius: 20,
              padding: "20px 12px",
              cursor: "pointer",
              color: "#fff",
              fontSize: 14,
              fontFamily: "inherit",
              letterSpacing: 1,
              transition: "all 0.2s ease",
            }}
          >
            🎲<br />
            <span style={{ fontSize: 9, letterSpacing: 2 }}>REMIX</span>
          </button>
        </section>

        {/* STATUS BAR */}
        <div
          data-testid="status-bar"
          style={{
            textAlign: "center",
            fontSize: 11,
            opacity: 0.4,
            letterSpacing: 2,
            paddingBottom: 8,
          }}
        >
          {currentMood?.label} · {activePads.size} SOUNDS · {bpm} BPM {isPlaying ? " · ● LIVE" : ""}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

        @keyframes rippleOut {
          0% { width: 0; height: 0; opacity: 1; }
          100% { width: 300px; height: 300px; opacity: 0; }
        }
        @keyframes pulse {
          0% { opacity: 0.4; transform: translateX(-50%) scale(1); }
          100% { opacity: 0.8; transform: translateX(-50%) scale(1.15); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=range]::-webkit-slider-thumb { display: none; }
        button { outline: none; }
      `}</style>
    </div>
  );
}
