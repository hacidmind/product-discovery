"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Textarea, Button, Card, Badge, EmptyState, Modal, Spinner } from "@/components/ui";
import type { Interview, Emotion } from "@/lib/types";

const emotionEmoji: Record<Emotion, string> = {
  positive: "😊",
  negative: "😟",
  neutral: "😐",
  mixed: "🤔",
};

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [interviewee, setInterviewee] = useState("");
  const [transcript, setTranscript] = useState("");

  const fetchInterviews = useCallback(async () => {
    const res = await fetch("/api/interviews");
    const data = await res.json();
    setInterviews(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  const previousProductRef = useRef("");
  const loaded = useRef(false);
  useEffect(() => {
    const currentProduct = localStorage.getItem("active-product") || "";
    if (currentProduct !== previousProductRef.current) {
      previousProductRef.current = currentProduct;
      setLoading(true);
      fetchInterviews();
    } else if (!loaded.current) {
      loaded.current = true;
      fetchInterviews();
    }
  }, [fetchInterviews]);
  useEffect(() => {
    const refresh = () => { setLoading(true); fetchInterviews(); };
    window.addEventListener("active-product-changed", refresh);
    return () => window.removeEventListener("active-product-changed", refresh);
  }, [fetchInterviews]);

  const handleSubmit = async () => {
    if (!transcript.trim()) return;
    setSubmitting(true);

    const res = await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || transcript.slice(0, 80),
        interviewee: interviewee || "Anonymous",
        transcript,
        date: new Date().toISOString().split("T")[0],
      }),
    });

    const interview = await res.json();
    setInterviews((prev) => [interview, ...prev]);
    setTitle("");
    setInterviewee("");
    setTranscript("");
    setShowCreate(false);
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/interviews/${id}`, { method: "DELETE" });
    if (res.ok) {
      setInterviews((prev) => prev.filter((i) => i.id !== id));
      if (selectedInterview?.id === id) setSelectedInterview(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadein">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Interviews</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Paste interview transcripts and automatically extract pain points, themes, and opportunities.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Interview</Button>
      </div>

      {interviews.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No interviews yet"
          description="Paste an interview transcript and the system will automatically analyze it for pain points, feature requests, emotions, and opportunities."
          action={<Button onClick={() => setShowCreate(true)}>+ New Interview</Button>}
        />
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => (
            <Card
              key={interview.id}
              className="p-4 cursor-pointer hover:border-[var(--accent)] transition-colors"
              onClick={() => setSelectedInterview(interview)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium mb-1">{interview.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-2">
                    <span>{interview.interviewee}</span>
                    <span>·</span>
                    <span>{new Date(interview.date).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>{interview.analysis.painPoints.length} pain points</span>
                    <span>·</span>
                    <span>{interview.analysis.repeatedThemes.length} themes</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {interview.tags.slice(0, 5).map((tag) => (
                      <Badge key={tag} variant="accent">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(interview.id); }}
                  className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Interview Analysis">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Customer Discovery - Round 2"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                  text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Interviewee</label>
              <input
                value={interviewee}
                onChange={(e) => setInterviewee(e.target.value)}
                placeholder="e.g. Sarah (Marketing Lead)"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                  text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Transcript</label>
            <Textarea
              value={transcript}
              onChange={setTranscript}
              placeholder="Paste the full interview transcript here..."
              minRows={8}
              autoFocus
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              The system will automatically extract pain points, feature requests, emotions, themes, opportunities, unknowns, and assumptions.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!transcript.trim() || submitting}>
              {submitting ? <Spinner size={14} /> : "Analyze Transcript"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Analysis Detail Modal */}
      <Modal
        open={!!selectedInterview}
        onClose={() => setSelectedInterview(null)}
        title={selectedInterview?.title || ""}
      >
        {selectedInterview && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
              <span>{selectedInterview.interviewee}</span>
              <span>·</span>
              <span>{new Date(selectedInterview.date).toLocaleDateString()}</span>
            </div>

            {/* Pain Points */}
            {selectedInterview.analysis.painPoints.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>🔴</span> Pain Points ({selectedInterview.analysis.painPoints.length})
                </div>
                <div className="space-y-1">
                  {selectedInterview.analysis.painPoints.map((pp, i) => (
                    <p key={i} className="text-sm border-l-2 border-red-200 dark:border-red-900 pl-3 py-1">
                      {pp}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Feature Requests */}
            {selectedInterview.analysis.featureRequests.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>💡</span> Feature Requests ({selectedInterview.analysis.featureRequests.length})
                </div>
                <div className="space-y-1">
                  {selectedInterview.analysis.featureRequests.map((fr, i) => (
                    <p key={i} className="text-sm border-l-2 border-blue-200 dark:border-blue-900 pl-3 py-1">
                      {fr}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Repeated Themes */}
            {selectedInterview.analysis.repeatedThemes.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>📊</span> Repeated Themes
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedInterview.analysis.repeatedThemes.map((t, i) => (
                    <Badge key={i} variant="accent">
                      {t.theme} ({t.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Emotions */}
            {selectedInterview.analysis.emotions.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>🎭</span> Emotional Moments
                </div>
                <div className="space-y-1">
                  {selectedInterview.analysis.emotions.map((e, i) => (
                    <p key={i} className="text-sm flex items-start gap-2 border-l-2 border-yellow-200 dark:border-yellow-900 pl-3 py-1">
                      <span>{emotionEmoji[e.emotion]}</span>
                      <span>&ldquo;{e.quote}&rdquo;</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Opportunities */}
            {selectedInterview.analysis.opportunities.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>🌟</span> Potential Opportunities
                </div>
                <div className="space-y-1">
                  {selectedInterview.analysis.opportunities.map((o, i) => (
                    <p key={i} className="text-sm border-l-2 border-green-200 dark:border-green-900 pl-3 py-1">
                      {o}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Unknowns */}
            {selectedInterview.analysis.unknowns.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  ❓ Unknowns
                </div>
                <div className="space-y-1">
                  {selectedInterview.analysis.unknowns.map((u, i) => (
                    <p key={i} className="text-sm text-[var(--text-secondary)] border-l-2 border-gray-200 dark:border-gray-800 pl-3 py-1">
                      {u}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Full Transcript */}
            <div>
              <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Full Transcript
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-[var(--radius)] p-3 text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {selectedInterview.transcript}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}