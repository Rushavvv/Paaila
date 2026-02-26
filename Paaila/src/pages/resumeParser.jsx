import { useState, useEffect } from "react";
import "../resumeParser.css";

// ─── Static mock data ─────────────────────────────────────────────────────────
const MOCK_JOB = `Senior UX Designer — Stripe

We are looking for a Senior UX Designer to lead the design of our developer-facing dashboard and payment flow products. You will collaborate with cross-functional teams including Product, Engineering, and Data Science.

Responsibilities:
• Own end-to-end UX design from discovery through delivery
• Conduct user research, usability testing, and synthesize insights
• Define and evolve the Stripe design system
• Mentor junior designers and establish design best practices
• Present work to senior leadership and stakeholders

Requirements:
• 6+ years of product design experience
• Mastery of Figma and prototyping tools
• Experience with complex data-dense interfaces
• Strong understanding of accessibility (WCAG 2.1)
• Excellent communication and storytelling skills
• Experience with fintech or developer tools a strong plus`;

const MATCHED_KEYWORDS = [
  { word: "Figma",                   score: 100 },
  { word: "User Research",           score: 100 },
  { word: "Usability Testing",       score: 100 },
  { word: "Prototyping",             score: 100 },
  { word: "Design System",           score: 95  },
  { word: "Accessibility",           score: 90  },
  { word: "WCAG",                    score: 85  },
  { word: "Mentoring",               score: 80  },
  { word: "Stakeholder Presentation",score: 75  },
];

const MISSING_KEYWORDS = [
  { word: "Developer Tools",            priority: "high"   },
  { word: "Fintech",                    priority: "high"   },
  { word: "Data-Dense UI",             priority: "medium" },
  { word: "Cross-functional Leadership",priority: "medium" },
  { word: "Payment Flows",             priority: "low"    },
  { word: "API Documentation UX",      priority: "low"    },
];

const SECTION_ANALYSIS = [
  {
    id: "summary",
    label: "Summary",
    score: 62,
    status: "improve",
    issue: "Doesn't mention fintech, developer tools, or data-dense UI experience.",
    original: "Versatile designer with 8+ years crafting intuitive digital experiences at the intersection of user research, visual design, and product strategy. Led redesigns that increased user retention by 42%.",
    suggested: "Senior UX Designer with 8+ years crafting complex, data-dense digital experiences for technical and developer-facing products. Proven track record in fintech-adjacent environments—led redesigns that increased user retention by 42% and established scalable design systems adopted across 12 products.",
  },
  {
    id: "experience_1",
    label: "Luminary Labs — Sr. Designer",
    score: 88,
    status: "good",
    issue: "Strong match. Consider adding mention of developer-facing or technical audiences.",
    original: "Established the company's first design system used across 12 products",
    suggested: "Established the company's first design system used across 12 products, with documentation and Figma component libraries supporting 8 engineering teams.",
  },
  {
    id: "experience_2",
    label: "Meridian Health — UX Designer",
    score: 74,
    status: "improve",
    issue: "Healthcare context is fine, but frame it around complex data interfaces.",
    original: "Designed patient-facing portal serving 2M+ monthly active users",
    suggested: "Designed complex, data-dense patient portal serving 2M+ MAU — coordinating multi-variable health data into clear, accessible interfaces meeting WCAG 2.1 AA standards.",
  },
  {
    id: "skills",
    label: "Skills",
    score: 55,
    status: "missing",
    issue: "Missing: Developer Tools, Fintech UX, Payment Flow Design, Data Visualization.",
    original: null,
    suggested: null,
  },
];

// ─── Utility Helpers ──────────────────────────────────────────────────────────

/** Coloured dot indicating section status */
function StatusDot({ status }) {
  const colors = {
    good:    "var(--green)",
    improve: "var(--blue-accent)",
    missing: "var(--red)",
  };
  const color = colors[status] || "#555";
  return (
    <span
      className="status-dot"
      style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
    />
  );
}

/** Animated SVG score ring with count-up */
function ScoreRing({ score, size = 96, stroke = 6 }) {
  const r     = (size - stroke * 2) / 2;
  const circ  = 2 * Math.PI * r;
  const color = score >= 80 ? "var(--green)" : score >= 60 ? "var(--blue-accent)" : "var(--red)";
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    let frame;
    let start = null;
    const duration = 1200;
    const tick = (ts) => {
      if (!start) start = ts;
      const p    = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimated(Math.round(score * ease));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border2)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - animated / 100)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.05s linear" }}
        />
      </svg>
      <div className="score-ring-label">
        <span style={{ fontFamily: "var(--syne)", fontSize: size * 0.22, fontWeight: 700, color, lineHeight: 1 }}>
          {animated}
        </span>
        <span style={{ fontSize: size * 0.1, color: "var(--muted2)", letterSpacing: "0.1em", marginTop: 2 }}>
          / 100
        </span>
      </div>
    </div>
  );
}

/** Animated horizontal progress bar */
function MiniBar({ value, color }) {
  const [w, setW] = useState(0);
  useEffect(() => { setTimeout(() => setW(value), 80); }, [value]);
  return (
    <div className="mini-bar">
      <div className="mini-bar__fill" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

/** Small badge chip */
function Chip({ label, color, bg, dot }) {
  return (
    <span
      className="chip"
      style={{ border: `1px solid ${color}40`, background: bg, color }}
    >
      {dot && (
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
      )}
      {label}
    </span>
  );
}

// ─── Scanning Overlay ─────────────────────────────────────────────────────────
function ScanningOverlay({ onDone }) {
  const [line, setLine] = useState(0);
  const [dots, setDots] = useState(".");

  const phrases = [
    "Extracting semantic keywords...",
    "Mapping skill vectors...",
    "Scoring section alignment...",
    "Identifying keyword gaps...",
    "Computing ATS compatibility...",
    "Generating improvement plan...",
    "Finalising match report...",
  ];

  useEffect(() => {
    const iv    = setInterval(() => setLine(l => (l < phrases.length - 1 ? l + 1 : l)), 420);
    const dv    = setInterval(() => setDots(d => (d.length < 3 ? d + "." : ".")), 350);
    const timer = setTimeout(onDone, 3200);
    return () => { clearInterval(iv); clearInterval(dv); clearTimeout(timer); };
  }, []);

  const corners = [
    ["tl", "top",    "left"],
    ["tr", "top",    "right"],
    ["bl", "bottom", "left"],
    ["br", "bottom", "right"],
  ];

  return (
    <div className="scan-overlay">
      <div className="scan-overlay__grid" />
      <div style={{ position: "relative", width: 280, textAlign: "center" }}>
        <div className="scan-box">
          <div className="scan-box__line" />

          {/* Corner accent marks */}
          {corners.map(([k, v, h]) => (
            <div
              key={k}
              style={{
                position: "absolute", width: 10, height: 10,
                [v]: -1, [h]: -1,
                borderTop:    v === "top"    ? "2px solid var(--blue-accent)" : "none",
                borderBottom: v === "bottom" ? "2px solid var(--blue-accent)" : "none",
                borderLeft:   h === "left"   ? "2px solid var(--blue-accent)" : "none",
                borderRight:  h === "right"  ? "2px solid var(--blue-accent)" : "none",
              }}
            />
          ))}

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div className="scan-box__spinner" />
          </div>

          <p style={{ fontFamily: "var(--syne)", fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
            Analysing Match{dots}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "left" }}>
            {phrases.map((phrase, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 8, opacity: i <= line ? 1 : 0.15, transition: "opacity 0.3s" }}
              >
                <span style={{ color: i < line ? "var(--green)" : i === line ? "var(--blue-accent)" : "var(--muted)", fontSize: 10 }}>
                  {i < line ? "✓" : i === line ? "›" : "·"}
                </span>
                <span style={{ fontSize: 10, letterSpacing: "0.05em", color: i <= line ? "var(--cream)" : "var(--muted)" }}>
                  {phrase}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Powered by Paaila
        </p>
      </div>
    </div>
  );
}

// ─── Step 1: Load Resume ──────────────────────────────────────────────────────
function StepResume({ onNext }) {
  const [loaded,   setLoaded]   = useState(false);
  const [dragging, setDragging] = useState(false);

  const simulate = () => {
    setLoaded(true);
    setTimeout(onNext, 600);
  };

  return (
    <div className="step-page">
      <div className="step-page__heading">
        <p className="step-label">Step 1 of 3</p>
        <h2 style={{ fontFamily: "var(--syne)", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, marginBottom: 10 }}>
          Load Your Resume
        </h2>
        <p style={{ fontSize: 12, color: "var(--muted2)", letterSpacing: "0.05em" }}>
          Upload a file or continue with your previously parsed resume.
        </p>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", animation: "fadeUp .5s .1s ease both" }}>
        {/* Use existing resume */}
        <div
          onClick={simulate}
          style={{
            border: "1px solid var(--blue-accent)", background: "var(--blue-accent-d)",
            padding: "28px 36px", cursor: "pointer", textAlign: "center",
            transition: "all .25s", width: 240,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--blue-accent-m)")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--blue-accent-d)")}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
          <p style={{ fontFamily: "var(--syne)", fontWeight: 600, marginBottom: 6 }}>Use Existing</p>
          <p style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.05em" }}>
            Alexandra Chen — Sr. Product Designer
          </p>
          {loaded && (
            <p style={{ fontSize: 10, color: "var(--green)", marginTop: 8, letterSpacing: "0.1em" }}>✓ Loaded</p>
          )}
        </div>

        {/* Upload new resume */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); simulate(); }}
          onClick={simulate}
          style={{
            border: `1px dashed ${dragging ? "var(--blue-accent)" : "var(--border2)"}`,
            background: dragging ? "var(--blue-accent-d)" : "var(--card)",
            padding: "28px 36px", cursor: "pointer", textAlign: "center",
            transition: "all .25s", width: 240,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>⬆</div>
          <p style={{ fontFamily: "var(--syne)", fontWeight: 600, marginBottom: 6 }}>Upload New</p>
          <p style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.05em" }}>PDF · DOCX · TXT</p>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Job Description ──────────────────────────────────────────────────
function StepJobDesc({ onNext }) {
  const [jd,  setJd]  = useState("");
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState("paste");

  const canNext = jd.trim().length > 40 || url.trim().length > 5;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "48px 24px", gap: 24, maxWidth: 740, margin: "0 auto",
      width: "100%", animation: "fadeUp .4s ease",
    }}>
      <div style={{ textAlign: "center", width: "100%" }}>
        <p className="step-label">Step 2 of 3</p>
        <h2 style={{ fontFamily: "var(--syne)", fontSize: "clamp(24px, 3.5vw, 42px)", fontWeight: 800, marginBottom: 8 }}>
          Target Job Description
        </h2>
        <p style={{ fontSize: 12, color: "var(--muted2)", letterSpacing: "0.04em" }}>
          Paste a JD or provide a URL — our AI will extract every requirement.
        </p>
      </div>

      {/* Paste / URL toggle */}
      <div style={{ display: "flex", border: "1px solid var(--border)", width: "100%" }}>
        {[["paste", "Paste Text"], ["url", "Job URL"]].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: "10px",
              background: tab === id ? "var(--blue-accent-d)" : "none",
              border: "none",
              borderRight: id === "paste" ? "1px solid var(--border)" : "none",
              color: tab === id ? "var(--blue-accent)" : "var(--muted2)",
              fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
              cursor: "pointer", transition: "all .2s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "paste" ? (
        <div style={{ width: "100%", position: "relative" }}>
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder={`Paste the full job description here...\n\nTip: Include requirements, responsibilities, and "nice to haves" for the best match analysis.`}
            rows={14}
            style={{
              width: "100%", background: "var(--card)", border: "1px solid var(--border)",
              color: "var(--cream)", padding: "16px", fontSize: 12, lineHeight: 1.75,
              letterSpacing: "0.02em", outline: "none", transition: "border-color .2s",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--blue-accent)")}
            onBlur={e  => (e.target.style.borderColor = "var(--border)")}
          />
          <button
            onClick={() => setJd(MOCK_JOB)}
            style={{
              position: "absolute", bottom: 14, right: 12,
              background: "var(--card)", border: "1px solid var(--border)",
              color: "var(--muted)", fontSize: 9, letterSpacing: "0.2em",
              padding: "4px 10px", cursor: "pointer", transition: "all .2s", textTransform: "uppercase",
            }}
            onMouseEnter={e => { e.target.style.borderColor = "var(--blue-accent)"; e.target.style.color = "var(--blue-accent)"; }}
            onMouseLeave={e => { e.target.style.borderColor = "var(--border)";       e.target.style.color = "var(--muted)"; }}
          >
            Use Demo
          </button>
        </div>
      ) : (
        <div style={{ width: "100%" }}>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://stripe.com/jobs/listing/senior-ux-designer/..."
            style={{
              width: "100%", background: "var(--card)", border: "1px solid var(--border)",
              color: "var(--cream)", padding: "14px 16px", fontSize: 12,
              outline: "none", transition: "border-color .2s",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--blue-accent)")}
            onBlur={e  => (e.target.style.borderColor = "var(--border)")}
          />
          <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 8, letterSpacing: "0.05em" }}>
            Supports LinkedIn, Greenhouse, Lever, Workday, and direct URLs.
          </p>
        </div>
      )}

      <button
        onClick={canNext ? onNext : undefined}
        className={`btn-primary${canNext ? "" : " btn-primary--disabled"}`}
        style={{
          background: canNext ? "var(--blue-accent)" : "var(--card)",
          border: `1px solid ${canNext ? "var(--blue-accent)" : "var(--border)"}`,
          color: canNext ? "#fff" : "var(--muted)",
          cursor: canNext ? "pointer" : "not-allowed",
          alignSelf: "flex-end",
        }}
        onMouseEnter={e => canNext && (e.target.style.background = "#74B8FF")}
        onMouseLeave={e => canNext && (e.target.style.background = "var(--blue-accent)")}
      >
        Analyse Match →
      </button>
    </div>
  );
}

// ─── Results: Overview Tab ────────────────────────────────────────────────────
function TabOverview({ applied }) {
  const overallScore = 74;

  return (
    <div style={{ padding: "32px 28px", display: "flex", flexDirection: "column", gap: 24, maxWidth: 1100, margin: "0 auto" }}>

      {/* Hero score row */}
      <div style={{
        display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 32,
        border: "1px solid var(--border)", background: "var(--panel)", padding: 32,
        alignItems: "center",
      }}>
        <ScoreRing score={overallScore} size={110} stroke={7} />
        <div>
          <p style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--blue-accent)", marginBottom: 8 }}>
            Overall Match Score
          </p>
          <h2 style={{ fontFamily: "var(--syne)", fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            Strong Candidate —<br />
            <span style={{ color: "var(--blue-accent)" }}>2 Key Gaps to Close</span>
          </h2>
          <p style={{ fontSize: 11, color: "var(--muted2)", lineHeight: 1.7, maxWidth: 480 }}>
            Your resume aligns well with design systems and research skills. Explicitly adding
            fintech context and developer-tool experience will push your score to 90+.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 140 }}>
          {[
            ["Keywords",   78, "var(--blue-accent)"],
            ["Experience", 85, "var(--green)"],
            ["Skills",     55, "var(--red)"],
            ["Summary",    62, "var(--blue-accent)"],
          ].map(([label, val, color]) => (
            <div key={label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9, letterSpacing: "0.15em", color: "var(--muted2)", textTransform: "uppercase" }}>{label}</span>
                <span style={{ fontSize: 10, color, fontWeight: 500 }}>{val}</span>
              </div>
              <MiniBar value={val} color={color} />
            </div>
          ))}
        </div>
      </div>

      {/* Quick stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { n: MATCHED_KEYWORDS.length,                                                                     label: "Keywords Matched",    color: "var(--green)",       icon: "◈" },
          { n: MISSING_KEYWORDS.length,                                                                     label: "Keywords Missing",    color: "var(--red)",         icon: "◇" },
          { n: SECTION_ANALYSIS.filter(s => s.status === "improve" || s.status === "missing").length,       label: "Sections to Improve", color: "var(--blue-accent)", icon: "◉" },
          { n: Object.keys(applied).length,                                                                 label: "Fixes Applied",       color: "var(--blue)",        icon: "✓" },
        ].map(({ n, label, color, icon }) => (
          <div key={label} style={{ background: "var(--card)", border: "1px solid var(--border)", padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontFamily: "var(--syne)", fontSize: 36, fontWeight: 800, color, lineHeight: 1 }}>{n}</span>
              <span style={{ color, fontSize: 14, marginTop: 4 }}>{icon}</span>
            </div>
            <p style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.1em", marginTop: 8, lineHeight: 1.5 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Priority action list */}
      <div style={{ border: "1px solid var(--border)", background: "var(--panel)", padding: 24 }}>
        <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--blue-accent)", marginBottom: 16 }}>
          ⚡ Priority Actions
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { tag: "HIGH",   text: "Add 'fintech' and 'developer-facing' context to your summary and first job bullet.", color: "var(--red)"        },
            { tag: "HIGH",   text: "Add 4 missing skill keywords: Developer Tools · Fintech · Data-Dense UI · Payment Flows.", color: "var(--red)"  },
            { tag: "MEDIUM", text: "Reframe Meridian Health experience around complex data interfaces, not just healthcare.", color: "var(--blue-accent)" },
            { tag: "LOW",    text: "Add one line about cross-functional leadership and stakeholder presentations at Luminary.", color: "var(--muted2)"   },
          ].map(({ tag, text, color }, i) => (
            <div key={i} className="action-row">
              <Chip label={tag} color={color} bg={`${color}10`} />
              <p style={{ fontSize: 11, color: "var(--cream)", lineHeight: 1.6, letterSpacing: "0.02em" }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Results: Keywords Tab ────────────────────────────────────────────────────
function TabKeywords() {
  return (
    <div style={{ padding: "32px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 1100, margin: "0 auto" }}>

      {/* Matched */}
      <div style={{ border: "1px solid var(--border)", background: "var(--panel)", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <StatusDot status="good" />
          <p style={{ fontFamily: "var(--syne)", fontWeight: 700, fontSize: 15 }}>Matched Keywords</p>
          <Chip label={`${MATCHED_KEYWORDS.length} found`} color="var(--green)" bg="var(--green-d)" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MATCHED_KEYWORDS.map(({ word, score }) => (
            <div key={word}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "var(--cream)", letterSpacing: "0.05em" }}>{word}</span>
                <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 500 }}>{score}%</span>
              </div>
              <MiniBar value={score} color="var(--green)" />
            </div>
          ))}
        </div>
      </div>

      {/* Missing */}
      <div style={{ border: "1px solid var(--border)", background: "var(--panel)", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <StatusDot status="missing" />
          <p style={{ fontFamily: "var(--syne)", fontWeight: 700, fontSize: 15 }}>Missing Keywords</p>
          <Chip label={`${MISSING_KEYWORDS.length} gaps`} color="var(--red)" bg="var(--red-d)" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MISSING_KEYWORDS.map(({ word, priority }) => {
            const c = priority === "high" ? "var(--red)" : priority === "medium" ? "var(--blue-accent)" : "var(--muted2)";
            return (
              <div key={word} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", background: "var(--card)", border: `1px solid ${c}20`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: c, fontSize: 10 }}>◇</span>
                  <span style={{ fontSize: 11, color: "var(--cream)" }}>{word}</span>
                </div>
                <Chip label={priority.toUpperCase()} color={c} bg={`${c}10`} />
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 20, padding: "14px 16px", background: "var(--blue-accent-d)", border: "1px solid var(--blue-accent-m)" }}>
          <p style={{ fontSize: 10, color: "var(--blue-accent)", letterSpacing: "0.15em", marginBottom: 6 }}>💡 Quick Add</p>
          <p style={{ fontSize: 11, color: "var(--cream)", lineHeight: 1.65 }}>
            Adding these 6 keywords naturally across your resume could raise your match score by{" "}
            <strong style={{ color: "var(--blue-accent)" }}>+18 points</strong>.
          </p>
        </div>
      </div>

      {/* Keyword density cloud */}
      <div style={{ gridColumn: "span 2", border: "1px solid var(--border)", background: "var(--panel)", padding: 24 }}>
        <p style={{ fontFamily: "var(--syne)", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Keyword Density Map</p>
        <div className="keyword-cloud">
          {[
            ...MATCHED_KEYWORDS.map(k => ({ word: k.word, score: k.score, matched: true  })),
            ...MISSING_KEYWORDS.map(k => ({ word: k.word, score: 0,       matched: false })),
          ].map(({ word, score, matched }) => (
            <span
              key={word}
              className="keyword-cloud__tag"
              style={{
                padding: `${matched ? 8 : 6}px ${matched ? 16 : 12}px`,
                background: matched ? `rgba(34,201,122,${0.06 + score / 600})` : "var(--red-d)",
                border: `1px solid ${matched ? "var(--green)40" : "var(--red)30"}`,
                color:  matched ? "var(--green)" : "var(--red)",
                fontSize: matched ? Math.max(10, Math.min(14, score / 8)) : 10,
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Results: Sections Tab ────────────────────────────────────────────────────
function TabSections({ applied, applyFix }) {
  const [activeSection, setActiveSection] = useState(null);

  const statusColor = { good: "var(--green)", improve: "var(--blue-accent)", missing: "var(--red)" };
  const statusLabel = { good: "Good Match", improve: "Needs Work",           missing: "Gap Detected" };

  return (
    <div style={{ padding: "32px 28px", display: "flex", gap: 20, maxWidth: 1100, margin: "0 auto" }}>

      {/* Section list */}
      <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
          Resume Sections
        </p>
        {SECTION_ANALYSIS.map(sec => (
          <div
            key={sec.id}
            className="section-list-item"
            onClick={() => setActiveSection(activeSection?.id === sec.id ? null : sec)}
            style={{
              border: `1px solid ${activeSection?.id === sec.id ? statusColor[sec.status] : "var(--border)"}`,
              background: activeSection?.id === sec.id ? `${statusColor[sec.status]}0D` : "var(--card)",
            }}
          >
            <StatusDot status={sec.status} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 500, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {sec.label}
              </p>
              <p style={{ fontSize: 9, color: "var(--muted2)", letterSpacing: "0.1em" }}>
                {statusLabel[sec.status]}
              </p>
            </div>
            {applied[sec.id] && <span style={{ color: "var(--green)", fontSize: 12 }}>✓</span>}
            <span style={{ fontFamily: "var(--syne)", fontSize: 14, fontWeight: 700, color: statusColor[sec.status], flexShrink: 0 }}>
              {sec.score}
            </span>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <div style={{ flex: 1 }}>
        {activeSection ? (
          <div className="section-detail">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <StatusDot status={activeSection.status} />
              <h3 style={{ fontFamily: "var(--syne)", fontSize: 18, fontWeight: 700 }}>{activeSection.label}</h3>
              <Chip
                label={`${activeSection.score}/100`}
                color={statusColor[activeSection.status]}
                bg={`${statusColor[activeSection.status]}10`}
              />
              {applied[activeSection.id] && <Chip label="Fix Applied" color="var(--green)" bg="var(--green-d)" />}
            </div>

            <div className="issue-banner">
              <p style={{ fontSize: 10, color: "var(--red)", letterSpacing: "0.2em", marginBottom: 4 }}>ISSUE DETECTED</p>
              <p style={{ fontSize: 11, color: "var(--cream)", lineHeight: 1.65 }}>{activeSection.issue}</p>
            </div>

            {activeSection.original && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
                    ◈ Current Text
                  </p>
                  <div style={{ padding: "14px 16px", background: "var(--card)", border: "1px solid var(--border)", fontSize: 11, lineHeight: 1.75, color: "var(--muted2)" }}>
                    {activeSection.original}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--blue-accent)", marginBottom: 8 }}>
                    ✦ AI Suggestion
                  </p>
                  <div className="suggestion-banner">{activeSection.suggested}</div>
                </div>

                <button
                  onClick={() => applyFix(activeSection.id)}
                  disabled={applied[activeSection.id]}
                  style={{
                    background: applied[activeSection.id] ? "var(--green-d)" : "var(--blue-accent)",
                    border: `1px solid ${applied[activeSection.id] ? "var(--green)" : "var(--blue-accent)"}`,
                    color: "#fff",
                    padding: "12px 32px", fontFamily: "var(--syne)", fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.15em", textTransform: "uppercase",
                    cursor: applied[activeSection.id] ? "default" : "pointer", transition: "all .25s",
                  }}
                >
                  {applied[activeSection.id] ? "✓ Applied to Resume" : "Apply AI Suggestion"}
                </button>
              </>
            )}

            {activeSection.id === "skills" && (
              <div>
                <p style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--blue-accent)", marginBottom: 12 }}>
                  ✦ Suggested Skills to Add
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Developer Tools", "Fintech UX", "Data Visualization", "Payment Flow Design"].map(s => (
                    <div
                      key={s}
                      onClick={() => applyFix(s)}
                      style={{
                        padding: "8px 16px",
                        border: applied[s] ? "1px solid var(--green)" : "1px dashed var(--blue-accent)",
                        background: applied[s] ? "var(--green-d)" : "var(--blue-accent-d)",
                        color: applied[s] ? "var(--green)" : "var(--blue-accent)",
                        fontSize: 11, cursor: "pointer", transition: "all .2s", borderRadius: 2,
                      }}
                    >
                      {applied[s] ? `✓ ${s}` : `+ ${s}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state" style={{ height: "100%" }}>
            <span style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>◈</span>
            <p style={{ fontFamily: "var(--syne)", fontSize: 16, fontWeight: 600, marginBottom: 8, opacity: 0.5 }}>
              Select a Section
            </p>
            <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.7 }}>
              Click any section on the left<br />to view issues and AI suggestions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Results: Tailored Resume Tab ─────────────────────────────────────────────
function TailoredSection({ title, accent, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <h3 style={{ fontFamily: "var(--syne)", fontSize: 13, fontWeight: 700, color: "#111", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {title}
        </h3>
        <div style={{ flex: 1, height: 1, background: `${accent}40` }} />
      </div>
      {children}
    </div>
  );
}

function TabTailored({ applied, overallScore }) {
  const accent = "#4A9EFF";

  const experienceData = [
    {
      role: "Senior Product Designer",
      co: "Luminary Labs",
      period: "2021 — Present",
      bullets: applied["experience_1"]
        ? [
            "Led end-to-end redesign of core onboarding flow, reducing drop-off by 38%",
            "Managed a team of 4 designers across web and mobile platforms",
            "Established company's first design system with Figma component libraries supporting 8 engineering teams",
          ]
        : [
            "Led end-to-end redesign of core onboarding flow, reducing drop-off by 38%",
            "Managed a team of 4 designers across web and mobile platforms",
            "Established the company's first design system used across 12 products",
          ],
    },
    {
      role: "UX Designer",
      co: "Meridian Health",
      period: "2018 — 2021",
      bullets: applied["experience_2"]
        ? [
            "Designed complex, data-dense patient portal serving 2M+ MAU, coordinating multi-variable health data into clear, accessible interfaces meeting WCAG 2.1 AA",
            "Conducted 60+ user interviews and usability testing sessions",
            "Collaborated with engineering to implement accessible WCAG 2.1 AA standards",
          ]
        : [
            "Designed patient-facing portal serving 2M+ monthly active users",
            "Conducted 60+ user interviews and usability testing sessions",
            "Collaborated with engineering to implement accessible WCAG 2.1 AA standards",
          ],
    },
  ];

  const skills = [
    "Figma", "Prototyping", "Design Systems", "User Research",
    "Accessibility", "WCAG 2.1", "Motion Design", "HTML/CSS",
    ...(applied["Developer Tools"]       ? ["Developer Tools"]       : []),
    ...(applied["Fintech UX"]            ? ["Fintech UX"]            : []),
    ...(applied["Data Visualization"]    ? ["Data Visualization"]    : []),
    ...(applied["Payment Flow Design"]   ? ["Payment Flow Design"]   : []),
  ];

  return (
    <div style={{ padding: "32px 28px", maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, color: "var(--blue-accent)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 6 }}>
            Tailored for: Senior UX Designer — Stripe
          </p>
          <h3 style={{ fontFamily: "var(--syne)", fontSize: 22, fontWeight: 800 }}>AI-Tailored Resume Preview</h3>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Chip
            label={`Score: ${overallScore + Object.keys(applied).length * 3}/100`}
            color="var(--blue-accent)"
            bg="var(--blue-accent-d)"
          />
          <Chip label={`${Object.keys(applied).length} fixes applied`} color="var(--green)" bg="var(--green-d)" />
        </div>
      </div>

      <div className="resume-doc">
        <div className="resume-doc__header">
          <h1 style={{ fontFamily: "var(--syne)", fontSize: 30, fontWeight: 800, marginBottom: 4 }}>Alexandra Chen</h1>
          <p style={{ fontSize: 14, color: accent, marginBottom: 16, letterSpacing: "0.08em" }}>
            Senior UX Designer — Fintech & Developer-Facing Products
          </p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 10, color: "#8A8FA0", letterSpacing: "0.05em" }}>
            {["✉ alex.chen@email.com", "☏ +1 (415) 882-7341", "⌘ San Francisco, CA", "↗ linkedin.com/in/alexchen"].map(i => (
              <span key={i}>{i}</span>
            ))}
          </div>
        </div>

        <div className="resume-doc__body">
          <TailoredSection title="Summary" accent={accent}>
            <p style={{ fontSize: 11.5, lineHeight: 1.8, color: "#444" }}>
              {applied["summary"] ? SECTION_ANALYSIS[0].suggested : SECTION_ANALYSIS[0].original}
            </p>
          </TailoredSection>

          <TailoredSection title="Experience" accent={accent}>
            {experienceData.map(exp => (
              <div key={exp.co} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <strong style={{ fontSize: 13, color: "#111" }}>{exp.role}</strong>
                  <span style={{ fontSize: 10, color: "#999", fontFamily: "var(--mono)" }}>{exp.period}</span>
                </div>
                <p className="resume-doc__company">{exp.co}</p>
                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                  {exp.bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: 11, color: "#555", lineHeight: 1.65, marginBottom: 4, paddingLeft: 14, position: "relative" }}>
                      <span className="resume-doc__bullet-marker">▸</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </TailoredSection>

          <TailoredSection title="Skills" accent={accent}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {skills.map(s => (
                <span key={s} className="resume-doc__skill-tag">{s}</span>
              ))}
            </div>
          </TailoredSection>
        </div>
      </div>
    </div>
  );
}

// ─── Results Dashboard (shell + tab routing) ──────────────────────────────────
function ResultsDashboard({ onReset }) {
  const [tab,     setTab]     = useState("overview");
  const [applied, setApplied] = useState({});
  const [saved,   setSaved]   = useState(false);

  const overallScore = 74;

  const applyFix = (id) => setApplied(prev => ({ ...prev, [id]: true }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const TABS = [
    ["overview", "Overview"],
    ["keywords", "Keywords"],
    ["sections", "Sections"],
    ["tailored", "Tailored Resume"],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", overflow: "hidden", animation: "fadeIn .4s ease" }}>

      {/* Sub-tab bar */}
      <div style={{
        borderBottom: "1px solid var(--border)", background: "var(--panel)",
        padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, height: 48,
      }}>
        <div className="tab-bar" style={{ border: "none", background: "none" }}>
          {TABS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`tab-bar__btn${tab === id ? " tab-bar__btn--active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn-ghost" onClick={onReset}>← New Analysis</button>
          <button
            className={`btn-export${saved ? " btn-export--saved" : ""}`}
            onClick={handleSave}
          >
            {saved ? "✓ Saved!" : "↓ Export Tailored"}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "overview" && <TabOverview applied={applied} />}
        {tab === "keywords" && <TabKeywords />}
        {tab === "sections" && <TabSections applied={applied} applyFix={applyFix} />}
        {tab === "tailored" && <TabTailored applied={applied} overallScore={overallScore} />}
      </div>
    </div>
  );
}

// ─── Top Navigation Bar ───────────────────────────────────────────────────────
function TopBar({ step }) {
  const steps  = ["resume", "jobdesc", "scanning", "results"];
  const labels = ["Resume", "Job Description", "Analysing",  "Results"];
  const idx    = steps.indexOf(step);

  return (
    <>
      {/* Navigation Menu Bar */}
      <nav className="menu-bar">
        <div className="menu-container">
          <div className="menu-logo">
            <span className="logo-text">Paaila</span>
          </div>
          <div className="menu-links">
            <a href="/home" className="menu-link">Home</a>
            <a href="/chat" className="menu-link">PDF Chatbot</a>
            <a href="/resume-parser" className="menu-link active">Resume Parser</a>
          </div>
        </div>
      </nav>

      <div className="topbar">
        <div className="topbar__logo">
          Paai<span>la</span>
        </div>
        <div className="topbar__divider" />

        <div className="topbar__steps">
          {labels.map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  border: `1.5px solid ${i <= idx ? "var(--blue-accent)" : "var(--border2)"}`,
                  background: i < idx ? "var(--blue-accent)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700,
                  color: i < idx ? "#fff" : i === idx ? "var(--blue-accent)" : "var(--muted)",
                  flexShrink: 0,
                }}>
                  {i < idx ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
                  color: i === idx ? "var(--blue-accent)" : i < idx ? "var(--muted2)" : "var(--muted)",
                }}>
                  {label}
                </span>
              </div>
              {i < labels.length - 1 && (
                <div
                  className="topbar__step-connector"
                  style={{ background: i < idx ? "rgba(74,158,255,0.6)" : "var(--border)" }}
                />
              )}
            </div>
          ))}
        </div>

        {step === "results" && (
          <div className="topbar__ats-badge">ATS Ready</div>
        )}
      </div>
    </>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function Paaila() {
  const [step, setStep] = useState("resume");

  return (
    <div className="resume-parser">
      <TopBar step={step} />
      <div className="paaila-bg-grid" />
      <div className="resume-parser__content">
        {step === "resume"   && <StepResume    onNext={() => setStep("jobdesc")}  />}
        {step === "jobdesc"  && <StepJobDesc   onNext={() => setStep("scanning")} />}
        {step === "scanning" && <ScanningOverlay onDone={() => setStep("results")} />}
        {step === "results"  && <ResultsDashboard onReset={() => setStep("resume")} />}
      </div>
    </div>
  );
}