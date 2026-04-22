import { useState, useEffect, useRef, Component } from "react";
import ReactQuill from "react-quill-new";
import DOMPurify from "dompurify";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "react-quill-new/dist/quill.snow.css";

const storage = window.sessionStorage;
import Spinner from "../components/Spinner";
import Footer from "../components/Footer";
import UserMenu from "../components/UserMenu";
import { ENDPOINTS, buildBackendUrl } from "../config/api";
import { sanitizeText, validateAiInput, validatePdfFile } from "../utils/validation";
import "../resumeParser.css";

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
  const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    let active = true;

    const loadResumes = async () => {
      setLoadingResumes(true);
      try {
        const res = await fetch(buildBackendUrl(ENDPOINTS.RESUME_LIST), {
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

    // Enhanced validation for all test cases
    const fileError = validatePdfFile(file);
    if (fileError) {
      setUploadMessage({ type: 'error', text: fileError });
      return;
    }

    // TC-050: Case-sensitive extension check (lowercase only)
    const fileName = String(file.name || '').toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      setUploadMessage({
        type: 'error',
        text: 'File extension must be lowercase .pdf (e.g., resume.pdf, not RESUME.PDF).',
      });
      return;
    }

    // Reset messages before upload
    setUploadMessage({ type: '', text: '' });

    // TC-049: Additional check for non-PDF files
    const allowedMimes = ['application/pdf', 'application/x-pdf', 'application/octet-stream'];
    if (file.type && !allowedMimes.includes(file.type.toLowerCase())) {
      setUploadMessage({
        type: 'error',
        text: 'Only PDF files are supported. Please upload a .pdf file, not .docx, .txt, or other formats.',
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(buildBackendUrl(ENDPOINTS.RESUME_UPLOAD), {
        method: "POST",
        headers: { ...getAuthHeaders() },
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        // TC-051 & TC-052: Handle corrupted or oversized PDFs with descriptive errors
        if (res.status === 400) {
          if (errorText.includes('corrupted') || errorText.includes('invalid')) {
            throw new Error('The PDF file appears to be corrupted or invalid. Please try another file.');
          }
          if (errorText.includes('size') || errorText.includes('too large')) {
            throw new Error('The PDF file is too large. Maximum file size is 10 MB.');
          }
          throw new Error('Invalid PDF file. Please ensure the file is a valid PDF.');
        }
        if (res.status === 413) {
          throw new Error('The PDF file is too large. Maximum file size is 10 MB.');
        }
        throw new Error("Resume upload failed. Please try again.");
      }

      const data = await res.json();
      // TC-048: Success case with resume_id
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
      setUploadMessage({
        type: 'success',
        text: `Resume uploaded successfully! (ID: ${data.resume_id}). Processing...`,
      });
      setTimeout(() => onNext(data.resume_id), 500);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadMessage({
        type: 'error',
        text: err.message || 'Failed to upload/process resume. Please try again.',
      });
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
      const res = await fetch(`${buildBackendUrl(ENDPOINTS.RESUME_LIST)}${targetId}`, {
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
          <p style={{ fontSize: 10, color: "var(--muted2)", marginBottom: 12 }}>
            Make sure to include "Professional Summary" in your resume for best results
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
          {uploadMessage.text && (
            <p
              style={{
                fontSize: 10,
                marginTop: 12,
                padding: '8px 10px',
                borderRadius: '4px',
                background: uploadMessage.type === 'error' ? 'var(--red-d)' : 'var(--green-d)',
                color: uploadMessage.type === 'error' ? 'var(--red)' : 'var(--green)',
                wordBreak: 'break-word',
                letterSpacing: '0.02em',
              }}
            >
              {uploadMessage.type === 'error' ? '✗ ' : '✓ '}
              {uploadMessage.text}
            </p>
          )}
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
  const [inputError, setInputError] = useState("");

  const payload = tab === "paste" ? sanitizeText(jd) : sanitizeText(url);
  const minLengthValid = tab === "paste" ? payload.length > 40 : payload.length > 5;
  const validationError = validateAiInput(payload, tab === "paste" ? "Job description" : "Job description URL");
  const canNext = minLengthValid && !validationError;

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
            maxLength={4000}
            onChange={e => {
              const value = e.target.value;
              setJd(value);
              const nextError = validateAiInput(value, "Job description");
              setInputError(nextError === "Job description is required" ? "" : nextError);
            }}
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
            maxLength={4000}
            onChange={e => {
              const value = e.target.value;
              setUrl(value);
              const nextError = validateAiInput(value, "Job description URL");
              setInputError(nextError === "Job description URL is required" ? "" : nextError);
            }}
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

      {inputError && (
        <p style={{ fontSize: 11, color: "var(--red)", width: "100%" }}>{inputError}</p>
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
              <p style={{ fontSize: 14, color: "var(--cream)", lineHeight: 1.6, letterSpacing: "0.02em" }}>{text}</p>
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
          {matchedKeywords.length > 0 ? (
            matchedKeywords.map(({ word }) => (
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
            ))
          ) : (
            <div
              style={{
                padding: "12px 14px",
                background: "var(--card)",
                border: "1px solid rgba(34, 201, 122, 0.2)",
                color: "var(--muted2)",
                fontSize: 11,
                letterSpacing: "0.04em",
              }}
            >
              No Matched Keywords Found
            </div>
          )}
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
      </div>
    </div>
  );
}

// ─── Results: Tailored Resume Tab ─────────────────────────────────────────────

function convertResumeJsonToHtml(improvedResume) {
  if (!improvedResume || typeof improvedResume !== "object") return "";

  const escape = (value = "") => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const name = escape(improvedResume.name || "");
  const title = escape(improvedResume.title || "");
  const summary = escape(improvedResume.summary || "");
  const sections = Array.isArray(improvedResume.sections) ? improvedResume.sections : [];

  const sectionsHtml = sections
    .map((section) => {
      const heading = escape(section?.heading || "");
      const items = Array.isArray(section?.items) ? section.items : [];
      const itemsHtml = items.map((item) => `<li>${escape(item)}</li>`).join("");
      return `
        <section class="resume-edit-section">
          <h3>${heading}</h3>
          <ul>${itemsHtml}</ul>
        </section>
      `;
    })
    .join("");

  return `
    <div class="resume-edit-root">
      <h1>${name}</h1>
      <h2>${title}</h2>
      <p>${summary}</p>
      ${sectionsHtml}
    </div>
  `;
}

class QuillErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err) {
    console.error("ReactQuill render error:", err);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

function TabTailored({ selectedResumeId, jobDescription, improved, loading, error, setImprovedResume }) {
  const accent = "#4A9EFF";
  const [isEditing, setIsEditing] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["blockquote"],
      ["clean"],
    ],
  };

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "align",
    "blockquote",
  ];

  const getCurrentResumeHtml = (value) => {
    if (!value || typeof value !== "object") return "";
    const rawHtml = typeof value.edited_html === "string" && value.edited_html.trim().length
      ? value.edited_html
      : convertResumeJsonToHtml(value);
    return DOMPurify.sanitize(rawHtml || "");
  };

  useEffect(() => {
    if (!improved) {
      setEditorContent("");
      return;
    }

    setEditorContent(getCurrentResumeHtml(improved));
    setIsEditing(false);
    setSaveStatus("");
  }, [improved]);

  const handleStartEdit = () => {
    setEditorContent((prev) => {
      const current = (prev || "").trim();
      if (current.length) return prev;
      return getCurrentResumeHtml(improved);
    });
    setIsEditing(true);
    setSaveStatus("");
  };

  const handleCancelEdit = () => {
    setEditorContent(getCurrentResumeHtml(improved));
    setIsEditing(false);
    setSaveStatus("");
  };

  const handleSaveChanges = async () => {
    const sanitizedHtml = DOMPurify.sanitize(editorContent || "");
    if (!sanitizedHtml.trim()) {
      setSaveStatus("Edited content is empty.");
      return;
    }
    if (sanitizedHtml.length > 2_000_000) {
      setSaveStatus("Edited content is too large.");
      return;
    }

    setSaving(true);
    setSaveStatus("");
    try {
      const payload = {
        resume_id: selectedResumeId,
        edited_html: sanitizedHtml,
      };

      const res = await fetch(buildBackendUrl(ENDPOINTS.RESUME_SAVE_EDITED), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Failed to save edited resume");
      }

      setImprovedResume((prev) => {
        const base = prev && typeof prev === "object" ? prev : improved;
        return {
          ...(base || {}),
          edited_html: sanitizedHtml,
        };
      });

      setEditorContent(sanitizedHtml);
      setIsEditing(false);
      setSaveStatus("Changes saved.");
    } catch (err) {
      console.error("Save edited resume error:", err);
      setSaveStatus(err?.message || "Failed to save edited resume.");
    } finally {
      setSaving(false);
    }
  };

  if (!selectedResumeId || !jobDescription) return <div style={{padding: 32}}>Waiting for selected resume and job description...</div>;
  if (loading) return <Spinner label="Generating tailored resume..." />;
  if (error) return <div style={{padding: 32, color: "var(--red)"}}>{error}</div>;
  if (!improved) return null;
  const { _meta, edited_html, ...improvedData } = improved;
  const previewHtml = getCurrentResumeHtml({ ...improvedData, edited_html });

  return (
    <div style={{ padding: "32px 28px", maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, color: "var(--blue-accent)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 6 }}>
            Tailored Resume Preview
          </p>
          <h3 style={{ fontFamily: "var(--syne)", fontSize: 22, fontWeight: 800 }}>AI-Tailored Resume</h3>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              className="btn-ghost"
              style={{ borderColor: "var(--blue-accent)", color: "var(--blue-accent)" }}
            >
              Edit Resume
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSaveChanges}
                className="btn-export"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn-ghost"
                disabled={saving}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {saveStatus ? (
        <p
          style={{
            marginBottom: 12,
            fontSize: 11,
            color: saveStatus === "Changes saved." ? "var(--green)" : "var(--red)",
            letterSpacing: "0.04em",
          }}
        >
          {saveStatus}
        </p>
      ) : null}

      <div className="resume-doc" style={{ background: "#fff", color: "#222", padding: 0 }}>
        {isEditing ? (
          <div style={{ padding: 14 }}>
            <QuillErrorBoundary
              resetKey={`${selectedResumeId}:${isEditing}`}
              fallback={
                <div>
                  <p style={{ fontSize: 11, color: "var(--red)", marginBottom: 8 }}>
                    Rich editor could not load in this environment. You can still edit HTML below.
                  </p>
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    style={{
                      width: "100%",
                      minHeight: 520,
                      border: "1px solid #d2d2d2",
                      padding: 12,
                      fontSize: 12,
                      fontFamily: "var(--mono)",
                      color: "#222",
                      background: "#fff",
                      outline: "none",
                    }}
                  />
                </div>
              }
            >
              <ReactQuill
                theme="snow"
                value={editorContent || previewHtml}
                onChange={setEditorContent}
                modules={quillModules}
                formats={quillFormats}
                style={{ minHeight: 560 }}
              />
            </QuillErrorBoundary>
          </div>
        ) : (
          <div
            className="resume-doc__body resume-preview-rendered"
            style={{ padding: "28px 30px" }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
        <style>{`
          .resume-doc .resume-edit-root h1 {
            font-family: var(--syne);
            font-size: 30px;
            font-weight: 800;
            margin: 0 0 4px;
            color: #111;
          }
          .resume-doc .resume-edit-root h2 {
            margin: 0 0 16px;
            font-size: 14px;
            color: ${accent};
            letter-spacing: 0.08em;
            font-weight: 600;
            text-transform: uppercase;
          }
          .resume-doc .resume-edit-root p {
            font-size: 12px;
            line-height: 1.8;
            color: #444;
            margin: 0 0 16px;
          }
          .resume-doc .resume-edit-root h3 {
            margin: 22px 0 10px;
            font-family: var(--syne);
            font-size: 13px;
            font-weight: 700;
            color: #111;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            border-bottom: 1px solid ${accent}40;
            padding-bottom: 6px;
          }
          .resume-doc .resume-edit-root ul {
            list-style: disc;
            margin: 0;
            padding-left: 20px;
          }
          .resume-doc .resume-edit-root li {
            font-size: 11px;
            color: #555;
            line-height: 1.65;
            margin-bottom: 4px;
          }

          /* Saved Quill HTML does not include .resume-edit-root, so normalize preview typography here. */
          .resume-doc .resume-preview-rendered {
            white-space: normal;
            overflow-wrap: anywhere;
            word-break: break-word;
            line-height: 1.7;
          }
          .resume-doc .resume-preview-rendered h1 {
            margin: 0 0 8px;
            font-family: var(--syne);
            font-size: 30px;
            line-height: 1.2;
            font-weight: 800;
            color: #111;
          }
          .resume-doc .resume-preview-rendered h2 {
            margin: 0 0 14px;
            font-family: var(--syne);
            font-size: 20px;
            line-height: 1.3;
            font-weight: 700;
            color: #222;
          }
          .resume-doc .resume-preview-rendered h3 {
            margin: 18px 0 8px;
            font-family: var(--syne);
            font-size: 15px;
            line-height: 1.35;
            font-weight: 700;
            color: #222;
          }
          .resume-doc .resume-preview-rendered p,
          .resume-doc .resume-preview-rendered li {
            font-size: 12px;
            color: #444;
            line-height: 1.75;
          }
          .resume-doc .resume-preview-rendered ul,
          .resume-doc .resume-preview-rendered ol {
            margin: 0 0 12px;
            padding-left: 22px;
          }
          .resume-doc .resume-preview-rendered .ql-size-small { font-size: 11px; }
          .resume-doc .resume-preview-rendered .ql-size-large { font-size: 14px; }
          .resume-doc .resume-preview-rendered .ql-size-huge  { font-size: 18px; }
          .resume-doc .resume-preview-rendered img,
          .resume-doc .resume-preview-rendered table {
            max-width: 100%;
            height: auto;
          }

          .resume-doc .ql-container {
            min-height: 500px;
            font-size: 12px;
            color: #222;
          }
          .resume-doc .ql-editor h1,
          .resume-doc .ql-editor h2,
          .resume-doc .ql-editor h3 {
            font-family: var(--syne);
          }
        `}</style>
      </div>
    </div>
  );
}

// ─── Results Dashboard (shell + tab routing) ──────────────────────────────────
function ResultsDashboard({ onReset, analysis, keywordsData, resumeId, jobDesc, improvedResume, setImprovedResume, userName }) {
    async function handleExportPdf() {
      if (!improvedResume) return;

      const { _meta, edited_html, ...improvedData } = improvedResume;
      const resumeHtml = DOMPurify.sanitize(
        (typeof edited_html === "string" && edited_html.trim().length
          ? edited_html
          : convertResumeJsonToHtml(improvedData)) || ""
      );
      if (!resumeHtml.trim()) return;

      const captureRoot = document.createElement("div");
      captureRoot.style.position = "fixed";
      captureRoot.style.left = "-10000px";
      captureRoot.style.top = "0";
      captureRoot.style.width = "850px";
      captureRoot.style.background = "#fff";
      captureRoot.style.color = "#222";
      captureRoot.style.padding = "28px 30px";
      captureRoot.style.boxSizing = "border-box";
      captureRoot.style.zIndex = "-1";

      captureRoot.innerHTML = `
        <style>
          .resume-export-root { font-family: Georgia, 'Times New Roman', serif; color: #222; line-height: 1.7; }
          .resume-export-root h1 { margin: 0 0 8px; font-family: 'EB Garamond', Georgia, serif; font-size: 30px; line-height: 1.2; font-weight: 800; color: #111; }
          .resume-export-root h2 { margin: 0 0 14px; font-family: 'EB Garamond', Georgia, serif; font-size: 20px; line-height: 1.3; font-weight: 700; color: #222; }
          .resume-export-root h3 { margin: 18px 0 8px; font-family: 'EB Garamond', Georgia, serif; font-size: 15px; line-height: 1.35; font-weight: 700; color: #222; }
          .resume-export-root p, .resume-export-root li { font-size: 12px; color: #444; line-height: 1.75; }
          .resume-export-root ul, .resume-export-root ol { margin: 0 0 12px; padding-left: 22px; }
          .resume-export-root .ql-size-small { font-size: 11px; }
          .resume-export-root .ql-size-large { font-size: 14px; }
          .resume-export-root .ql-size-huge { font-size: 18px; }
          .resume-export-root img, .resume-export-root table { max-width: 100%; height: auto; }
        </style>
        <div class="resume-export-root">${resumeHtml}</div>
      `;

      document.body.appendChild(captureRoot);

      try {
        const canvas = await html2canvas(captureRoot, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollY: 0,
          windowWidth: captureRoot.scrollWidth,
          windowHeight: captureRoot.scrollHeight,
        });

        const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 22;
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;

        const imgData = canvas.toDataURL("image/png", 1.0);
        const renderedHeight = (canvas.height * usableWidth) / canvas.width;

        let heightLeft = renderedHeight;
        let yOffset = margin;

        pdf.addImage(imgData, "PNG", margin, yOffset, usableWidth, renderedHeight, undefined, "FAST");
        heightLeft -= usableHeight;

        while (heightLeft > 0) {
          pdf.addPage();
          yOffset = margin - (renderedHeight - heightLeft);
          pdf.addImage(imgData, "PNG", margin, yOffset, usableWidth, renderedHeight, undefined, "FAST");
          heightLeft -= usableHeight;
        }

        const cleanUserName = (userName || "resume").replace(/\s+/g, "_");
        pdf.save(`${cleanUserName}_resume.pdf`);
      } finally {
        if (captureRoot.parentNode) captureRoot.parentNode.removeChild(captureRoot);
      }
    }
  const [tab,     setTab]     = useState("overview");
  const [applied, setApplied] = useState({});
  const [saved,   setSaved]   = useState(false);
  const [improvedLoading, setImprovedLoading] = useState(false);
  const [improvedError, setImprovedError] = useState("");
  const improveRequestKeyRef = useRef("");
  const improveInFlightRef = useRef(false);

  const overallScore = analysis ? analysis.overallScore : 0;

  const applyFix = (id) => setApplied(prev => ({ ...prev, [id]: true }));


  useEffect(() => {
    if (!resumeId || !jobDesc) return;

    const requestKey = `${resumeId}::${String(jobDesc).trim()}`;
    const lastImproved = improvedResume && improvedResume._meta && improvedResume._meta.resumeId === resumeId && improvedResume._meta.jobDesc === jobDesc;

    if (lastImproved) {
      improveRequestKeyRef.current = requestKey;
      return;
    }

    if (improveInFlightRef.current && improveRequestKeyRef.current === requestKey) {
      return;
    }

    let active = true;
    const controller = new AbortController();

    improveRequestKeyRef.current = requestKey;
    improveInFlightRef.current = true;
    setImprovedLoading(true);
    setImprovedError("");
    setImprovedResume(null);

    fetch(buildBackendUrl(ENDPOINTS.RESUME_IMPROVE), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ resume_id: resumeId, job_description: jobDesc }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.detail || "Failed to generate improved resume");
        return data;
      })
      .then((data) => {
        if (!active) return;
        setImprovedResume({ ...(data?.improved || {}), _meta: { resumeId, jobDesc } });
      })
      .catch((err) => {
        if (!active) return;
        if (err?.name === "AbortError") return;
        setImprovedError(err?.message || "Failed to generate improved resume.");
      })
      .finally(() => {
        if (!active) return;
        improveInFlightRef.current = false;
        setImprovedLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
      improveInFlightRef.current = false;
    };
  }, [resumeId, jobDesc, improvedResume, setImprovedResume]);

  const TABS = [
    ["overview", "Overview"],
    ["keywords", "Keywords"],
    ["tailored", "Tailored Resume"],
  ];

  return (
    <div className="results-dashboard-shell">
      {/* Sub-tab bar */}
      <div className="results-dashboard-tabbar">
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
            className={`btn-export`}
            onClick={handleExportPdf}
            disabled={!improvedResume}
            title={!improvedResume ? "No tailored resume to export" : "Export tailored resume as .pdf"}
          >
            ↓ Download
          </button>
        </div>
      </div>
      <div className="results-dashboard-content">
        {tab === "overview" && <TabOverview applied={applied} analysis={analysis} />}
        {tab === "keywords" && <TabKeywords keywordsData={keywordsData} />}
        {tab === "tailored" && (
          <TabTailored
            selectedResumeId={resumeId}
            jobDescription={jobDesc}
            improved={improvedResume}
            loading={improvedLoading}
            error={improvedError}
            setImprovedResume={setImprovedResume}
          />
        )}
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
            <UserMenu />
          </div>
        </div>
      </nav>

      <div className="topbar">
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
      </div>
    </>
  );
}

export default function Paaila() {
  const [step, setStep] = useState(() => storage.getItem('resume_step') || "resume");
  const [resumeId, setResumeId] = useState(() => storage.getItem('resume_resumeId') || "");
  const [userName, setUserName] = useState("");
  const [analysis, setAnalysis] = useState(() => {
    try {
      const saved = storage.getItem('resume_analysis');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [keywordsData, setKeywordsData] = useState(() => {
    try {
      const saved = storage.getItem('resume_keywordsData');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [jobDesc, setJobDesc] = useState(() => storage.getItem('resume_jobDesc') || "");
  const [improvedResume, setImprovedResume] = useState(() => {
    try {
      const saved = storage.getItem('resume_improvedResume');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Fetch user data on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(buildBackendUrl(ENDPOINTS.API_USER), {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setUserName(data?.name || "User");
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setUserName("User");
      }
    })();
  }, []);

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
    const normalizedJobDescription = sanitizeText(jobDescription);
    const jobDescriptionError = validateAiInput(normalizedJobDescription, 'Job description');
    if (jobDescriptionError) {
      alert(jobDescriptionError);
      setStep('jobdesc');
      return;
    }
    setJobDesc(normalizedJobDescription);
    storage.setItem('resume_jobDesc', normalizedJobDescription);
    setStep("scanning");
    try {
      const payload = JSON.stringify({
        resume_id: resumeId,
        job_description: normalizedJobDescription,
      });
      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      };
      const analysisRes = await fetch(buildBackendUrl(ENDPOINTS.RESUME_ANALYZE), {
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
    setImprovedResume(null);
    setStep("resume");
    setJobDesc("");
    storage.removeItem('resume_step');
    storage.removeItem('resume_resumeId');
    storage.removeItem('resume_analysis');
    storage.removeItem('resume_keywordsData');
    storage.removeItem('resume_jobDesc');
    storage.removeItem('resume_improvedResume');
  };
  useEffect(() => {
    if (step === "scanning") {
      // Only retry if we have resumeId and jobDesc
      if (resumeId && jobDesc) {
        handleAnalyze(jobDesc);
      } else {
        // Not enough data, reset to jobdesc step
        setStep("jobdesc");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist step, resumeId, analysis, keywordsData
  useEffect(() => {
    storage.setItem('resume_step', step)
  }, [step])
  useEffect(() => {
    storage.setItem('resume_resumeId', resumeId)
  }, [resumeId])
  useEffect(() => {
    if (analysis) {
      storage.setItem('resume_analysis', JSON.stringify(analysis))
    } else {
      storage.removeItem('resume_analysis')
    }
  }, [analysis])
  useEffect(() => {
    if (keywordsData) {
      storage.setItem('resume_keywordsData', JSON.stringify(keywordsData))
    } else {
      storage.removeItem('resume_keywordsData')
    }
  }, [keywordsData])
  useEffect(() => {
    if (improvedResume) {
      storage.setItem('resume_improvedResume', JSON.stringify(improvedResume))
    } else {
      storage.removeItem('resume_improvedResume')
    }
  }, [improvedResume])

  return (
    <div className="resume-parser">
      <TopBar step={step} />
      <div className="paaila-bg-grid" />
      <div className="resume-parser__content">
        {step === "resume"   && <StepResume onNext={handleResumeReady} />}
        {step === "jobdesc"  && <StepJobDesc onNext={handleAnalyze} />}
        {step === "scanning" && <ScanningOverlay />}
        {step === "results"  && (
          <ResultsDashboard
            onReset={handleReset}
            analysis={analysis}
            keywordsData={keywordsData}
            resumeId={resumeId}
            jobDesc={jobDesc}
            improvedResume={improvedResume}
            setImprovedResume={setImprovedResume}
            userName={userName}
          />
        )}
      </div>
      <Footer/>
    </div>
  );
}