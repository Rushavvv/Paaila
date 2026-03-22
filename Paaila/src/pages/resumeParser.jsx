import { useState, useEffect, useRef } from "react";
import "../resumeParser.css";

const API_BASE = "http://127.0.0.1:8000";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
    const timer = onDone ? setTimeout(onDone, 3200) : null;
    return () => {
      clearInterval(iv);
      clearInterval(dv);
      if (timer) clearTimeout(timer);
    };
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
  const [loaded, setLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingResumeId, setDeletingResumeId] = useState("");
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [pendingResume, setPendingResume] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadResumes = async () => {
      setLoadingResumes(true);
      try {
        const res = await fetch(`${API_BASE}/resumes/`, {
          headers: { ...getAuthHeaders() },
        });

        if (!res.ok) {
          throw new Error("Failed to load resumes");
        }

        const data = await res.json();
        if (!active) return;
        setResumes(Array.isArray(data?.resumes) ? data.resumes : []);
      } catch (err) {
        console.error("Load resumes error:", err);
        if (active) setResumes([]);
      } finally {
        if (active) setLoadingResumes(false);
      }
    };

    loadResumes();
    return () => { active = false; };
  }, []);

  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const handleUpload = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please upload a PDF file.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/resumeParser/`, {
        method: "POST",
        headers: { ...getAuthHeaders() },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Resume upload failed");
      }

      const data = await res.json();
      const newResume = {
        resume_id: data.resume_id,
        original_filename: file.name,
        file_path: data.file_path,
        text_path: data.text_path,
        created_at: new Date().toISOString(),
      };
      setResumes((prev) => [newResume, ...prev]);
      setLoaded(true);
      setSelectedResumeId(data.resume_id);
      setTimeout(() => onNext(data.resume_id), 500);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload/process resume. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleUseExisting = (resume) => {
    if (!resume?.resume_id || uploading || deletingResumeId) return;
    setPendingResume(resume);
  };

  const handleChoosePending = () => {
    if (!pendingResume?.resume_id) return;
    setSelectedResumeId(pendingResume.resume_id);
    setLoaded(true);
    const chosen = pendingResume.resume_id;
    setPendingResume(null);
    setTimeout(() => onNext(chosen), 300);
  };

  const handleDeletePending = async () => {
    if (!pendingResume?.resume_id) return;

    const targetId = pendingResume.resume_id;
    setDeletingResumeId(targetId);
    try {
      const res = await fetch(`${API_BASE}/resumes/${targetId}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) {
        throw new Error("Failed to delete resume");
      }

      setResumes((prev) => prev.filter((r) => r.resume_id !== targetId));
      if (selectedResumeId === targetId) {
        setSelectedResumeId("");
        setLoaded(false);
      }
      setPendingResume(null);
    } catch (err) {
      console.error("Delete resume error:", err);
      alert("Could not delete resume. Please try again.");
    } finally {
      setDeletingResumeId("");
    }
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

      <div style={{ width: "100%", maxWidth: 980, display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp .5s .1s ease both" }}>
        <div style={{ border: "1px solid var(--border)", background: "var(--panel)", padding: 16 }}>
          <p style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 }}>
            Previously Uploaded Resumes
          </p>

          {loadingResumes ? (
            <p style={{ fontSize: 11, color: "var(--muted2)" }}>Loading resumes...</p>
          ) : resumes.length === 0 ? (
            <p style={{ fontSize: 11, color: "var(--muted2)" }}>No previous resumes found. Upload a new one below.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
              {resumes.map((resume) => {
                const active = selectedResumeId === resume.resume_id;
                return (
                  <button
                    key={resume.resume_id}
                    onClick={() => handleUseExisting(resume)}
                    type="button"
                    style={{
                      textAlign: "left",
                      background: active ? "var(--blue-accent-d)" : "var(--card)",
                      border: `1px solid ${active ? "var(--blue-accent)" : "var(--border)"}`,
                      padding: "12px 14px",
                      cursor: "pointer",
                      color: "var(--cream)",
                      opacity: deletingResumeId && deletingResumeId !== resume.resume_id ? 0.6 : 1,
                    }}
                  >
                    <p style={{ fontFamily: "var(--syne)", fontSize: 12, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {resume.original_filename}
                    </p>
                    <p style={{ fontSize: 10, color: "var(--muted2)", marginBottom: 4 }}>
                      Saved: {formatDate(resume.created_at)}
                    </p>
                    <p style={{ fontSize: 9, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {resume.file_path}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
          {pendingResume && (
            <div style={{ marginTop: 12, border: "1px solid var(--border2)", background: "var(--card)", padding: 12 }}>
              <p style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
                Selected Resume
              </p>
              <p style={{ fontFamily: "var(--syne)", fontSize: 12, marginBottom: 10 }}>
                {pendingResume.original_filename}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleChoosePending}
                  style={{
                    background: "var(--blue-accent)",
                    border: "1px solid var(--blue-accent)",
                    color: "#fff",
                    padding: "8px 14px",
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Choose This Resume
                </button>
                <button
                  type="button"
                  disabled={deletingResumeId === pendingResume.resume_id}
                  onClick={handleDeletePending}
                  style={{
                    background: "var(--red-d)",
                    border: "1px solid var(--red)",
                    color: "var(--red)",
                    padding: "8px 14px",
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    opacity: deletingResumeId === pendingResume.resume_id ? 0.6 : 1,
                  }}
                >
                  {deletingResumeId === pendingResume.resume_id ? "Deleting..." : "Delete Resume"}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingResume(null)}
                  style={{
                    background: "none",
                    border: "1px solid var(--border2)",
                    color: "var(--muted2)",
                    padding: "8px 14px",
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {loaded && selectedResumeId && (
            <p style={{ fontSize: 10, color: "var(--green)", marginTop: 10, letterSpacing: "0.1em" }}>✓ Resume selected</p>
          )}
        </div>

        {/* Upload new resume */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            if (!uploading) handleUpload(e.dataTransfer.files?.[0]);
          }}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            border: `1px dashed ${dragging ? "var(--blue-accent)" : "var(--border2)"}`,
            background: dragging ? "var(--blue-accent-d)" : "var(--card)",
            padding: "28px 36px", cursor: "pointer", textAlign: "center",
            transition: "all .25s", width: 240,
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>⬆</div>
          <p style={{ fontFamily: "var(--syne)", fontWeight: 600, marginBottom: 6 }}>Upload New</p>
          <p style={{ fontSize: 10, color: "var(--muted2)", letterSpacing: "0.05em" }}>
            {uploading ? "Uploading..." : "PDF Only"}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: "none" }}
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />
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
  const payload = tab === "paste" ? jd.trim() : url.trim();

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
        onClick={canNext ? () => onNext(payload) : undefined}
        className={`btn-primary${canNext ? "" : " btn-primary--disabled"}`}
        style={{
          background: canNext ? "var(--blue-accent)" : "var(--card)",
          border: `1px solid ${canNext ? "var(--blue-accent)" : "var(--border)"}`,
          color: canNext ? "#fff" : "var(--muted)",
          cursor: canNext ? "pointer" : "not-allowed",
          alignSelf: "flex-end",
        }}
        onMouseEnter={e => canNext && (e.target.style.background = "#bb7f4d")}
        onMouseLeave={e => canNext && (e.target.style.background = "var(--blue-accent)")}
      >
        Analyse Match →
      </button>
    </div>
  );
}

// ─── Results: Overview Tab ────────────────────────────────────────────────────
function TabOverview({ applied, analysis }) {
  if (!analysis) return null;

  const overview = analysis;
  const overallScore = overview.overallScore;
  const fixesApplied = Math.max(overview.fixesApplied ?? 0, Object.keys(applied).length);
  const priorityActions = Array.isArray(overview.priorityActions) && overview.priorityActions.length
    ? overview.priorityActions
    : [];

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
            <span style={{ color: "var(--blue-accent)" }}>Gaps to Close</span>
          </h2>
          <p style={{ fontSize: 11, color: "var(--muted2)", lineHeight: 1.7, maxWidth: 480 }}>
            This first-pass score is generated from your uploaded resume and provided job
            description. Apply the priority actions to improve fit before exporting.
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {[
          { n: overview.keywordsMatched, label: "Keywords Matched", color: "var(--green)", icon: "◈" },
          { n: overview.keywordsMissing, label: "Keywords Missing", color: "var(--red)", icon: "◇" },
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
          {priorityActions.map(({ priority, text }, i) => {
            const tag = String(priority || "MEDIUM").toUpperCase();
            const color = tag === "HIGH" ? "var(--red)" : tag === "LOW" ? "var(--muted2)" : "var(--blue-accent)";
            return (
            <div key={i} className="action-row">
              <Chip label={tag} color={color} bg={`${color}10`} />
              <p style={{ fontSize: 11, color: "var(--cream)", lineHeight: 1.6, letterSpacing: "0.02em" }}>{text}</p>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Results: Keywords Tab ────────────────────────────────────────────────────
function TabKeywords({ keywordsData }) {
  if (!keywordsData) return null;

  const matchedKeywords = Array.isArray(keywordsData.matchedKeywords) ? keywordsData.matchedKeywords : [];
  const missingKeywords = Array.isArray(keywordsData.missingKeywords) ? keywordsData.missingKeywords : [];

  return (
    <div style={{ padding: "32px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 1100, margin: "0 auto" }}>

      {/* Matched */}
      <div style={{ border: "1px solid var(--border)", background: "var(--panel)", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <StatusDot status="good" />
          <p style={{ fontFamily: "var(--syne)", fontWeight: 700, fontSize: 15 }}>Matched Keywords</p>
          <Chip label={`${matchedKeywords.length} found`} color="var(--green)" bg="var(--green-d)" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {matchedKeywords.map(({ word }) => (
            <div key={word}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: "var(--card)",
                  border: "1px solid rgba(34, 201, 122, 0.2)",
                }}
              >
                <span style={{ color: "var(--green)", fontSize: 10 }}>◈</span>
                <span style={{ fontSize: 11, color: "var(--cream)", letterSpacing: "0.05em" }}>{word}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Missing */}
      <div style={{ border: "1px solid var(--border)", background: "var(--panel)", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <StatusDot status="missing" />
          <p style={{ fontFamily: "var(--syne)", fontWeight: 700, fontSize: 15 }}>Missing Keywords</p>
          <Chip label={`${missingKeywords.length} gaps`} color="var(--red)" bg="var(--red-d)" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {missingKeywords.map(({ word, priority }) => {
            const level = String(priority || "MEDIUM").toLowerCase();
            const c = level === "high" ? "var(--red)" : level === "medium" ? "var(--blue-accent)" : "var(--muted2)";
            return (
              <div key={word} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", background: "var(--card)", border: `1px solid ${c}20`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: c, fontSize: 10 }}>◇</span>
                  <span style={{ fontSize: 11, color: "var(--cream)" }}>{word}</span>
                </div>
                <Chip label={level.toUpperCase()} color={c} bg={`${c}10`} />
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 20, padding: "14px 16px", background: "var(--blue-accent-d)", border: "1px solid var(--blue-accent-m)" }}>
          <p style={{ fontSize: 10, color: "var(--blue-accent)", letterSpacing: "0.15em", marginBottom: 6 }}>💡 Quick Add</p>
          <p style={{ fontSize: 11, color: "var(--cream)", lineHeight: 1.65 }}>
            Adding these {missingKeywords.length} keywords naturally across your resume could raise your match score by{" "}
            <strong style={{ color: "var(--blue-accent)" }}>+18 points</strong>.
          </p>
        </div>
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
          <h1 style={{ fontFamily: "var(--syne)", fontSize: 30, fontWeight: 800, marginBottom: 4 }}>Rushav Sthapit</h1>
          <p style={{ fontSize: 14, color: accent, marginBottom: 16, letterSpacing: "0.08em" }}>
            Senior AI Engineer — Paaila 
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
function ResultsDashboard({ onReset, analysis, keywordsData }) {
  const [tab,     setTab]     = useState("overview");
  const [applied, setApplied] = useState({});
  const [saved,   setSaved]   = useState(false);

  const overallScore = analysis ? analysis.overallScore : 0;

  const applyFix = (id) => setApplied(prev => ({ ...prev, [id]: true }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const TABS = [
    ["overview", "Overview"],
    ["keywords", "Keywords"],
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
        {tab === "overview" && <TabOverview applied={applied} analysis={analysis} />}
        {tab === "keywords" && <TabKeywords keywordsData={keywordsData} />}
        {tab === "tailored" && <TabTailored applied={applied} overallScore={overallScore} />}
      </div>
    </div>
  );
}

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
                  style={{ background: i < idx ? "rgba(204, 149, 61, 0.6)" : "var(--border)" }}
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

export default function Paaila() {
  const [step, setStep] = useState("resume");
  const [resumeId, setResumeId] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [keywordsData, setKeywordsData] = useState(null);

  const handleResumeReady = (id) => {
    setResumeId(id || "");
    setStep("jobdesc");
  };

  const handleAnalyze = async (jobDescription) => {
    if (!resumeId) {
      alert("Please upload/select a resume first.");
      setStep("resume");
      return;
    }

    setStep("scanning");
    try {
      const payload = JSON.stringify({
        resume_id: resumeId,
        job_description: jobDescription,
      });

      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      };

      const analysisRes = await fetch(`${API_BASE}/resumeParser/analyze`, {
        method: "POST",
        headers,
        body: payload,
      });

      if (!analysisRes.ok) {
        throw new Error("Failed to analyze resume overview");
      }

      const analysisData = await analysisRes.json();

      if (!analysisData?.analysis) {
        throw new Error("Analysis payload missing")
      }

      setAnalysis(analysisData.analysis);
      setKeywordsData({
        matchedKeywords: analysisData.analysis.matchedKeywords || [],
        missingKeywords: analysisData.analysis.missingKeywords || [],
      });
      setStep("results");
    } catch (err) {
      console.error("Resume analysis failed:", err);
      alert("Could not run analysis. Please try again.");
      setStep("jobdesc");
    }
  };

  const handleReset = () => {
    setResumeId("");
    setAnalysis(null);
    setKeywordsData(null);
    setStep("resume");
  };

  return (
    <div className="resume-parser">
      <TopBar step={step} />
      <div className="paaila-bg-grid" />
      <div className="resume-parser__content">
        {step === "resume"   && <StepResume onNext={handleResumeReady} />}
        {step === "jobdesc"  && <StepJobDesc onNext={handleAnalyze} />}
        {step === "scanning" && <ScanningOverlay />}
        {step === "results"  && <ResultsDashboard onReset={handleReset} analysis={analysis} keywordsData={keywordsData} />}
      </div>
    </div>
  );
}