import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { roadmapService, skillService } from '../services/apiService';
import { Brain, Loader2, Map, CheckCircle2, Rocket, Download, Sparkles, Target, Clock as ClockIcon } from 'lucide-react';
import jsPDF from 'jspdf';

const RoadmapPlanner = () => {
  const [careerGoal, setCareerGoal] = useState('');
  const [knownSkills, setKnownSkills] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [message, setMessage] = useState('');

  const steps = useMemo(
    () => selectedRoadmap?.roadmap_data?.steps || selectedRoadmap?.steps || [],
    [selectedRoadmap]
  );

  useEffect(() => {
    loadMySkills();
    loadMyRoadmaps();
  }, []);

  const loadMySkills = async () => {
    try {
      const result = await skillService.getMySkills();
      setKnownSkills((result || []).map((item) => item.skill_name).filter(Boolean));
    } catch (_e) {
      setKnownSkills([]);
    }
  };

  const loadMyRoadmaps = async () => {
    setLoadingRoadmaps(true);
    try {
      const result = await roadmapService.getMyRoadmaps(false);
      const allRoadmaps = result?.roadmaps || [];
      setRoadmaps(allRoadmaps);
      if (allRoadmaps.length > 0) {
        setSelectedRoadmap(allRoadmaps[0]);
      }
    } catch (error) {
      setMessage(error?.response?.data?.detail || 'Unable to load roadmaps');
    }
    setLoadingRoadmaps(false);
  };

  const handleGenerateRoadmap = async (e) => {
    e.preventDefault();
    if (!careerGoal.trim()) return;

    setLoading(true);
    setMessage('');
    try {
      const response = await roadmapService.generate(careerGoal.trim(), knownSkills);
      const generated = response?.roadmap;
      if (generated?.roadmap_id) {
        await loadMyRoadmaps();
      } else {
        setSelectedRoadmap(generated);
      }
      setCareerGoal('');
      setMessage('Roadmap generated successfully.');
    } catch (error) {
      setMessage(error?.response?.data?.detail || 'Failed to generate roadmap');
    }
    setLoading(false);
  };

  const markCompleted = async () => {
    if (!selectedRoadmap?.id) return;
    setUpdatingProgress(true);
    try {
      await roadmapService.complete(selectedRoadmap.id);
      await loadMyRoadmaps();
            setMessage('Roadmap marked as completed.');
    } catch (error) {
      setMessage(error?.response?.data?.detail || 'Failed to complete roadmap');
    }
    setUpdatingProgress(false);
  };

  const downloadPDF = () => {
    if (!selectedRoadmap) return;
    const goal = selectedRoadmap.career_goal || selectedRoadmap?.roadmap_data?.career_goal || 'Roadmap';
    const estTime = selectedRoadmap?.roadmap_data?.estimated_total_time || selectedRoadmap?.estimated_total_time || 'N/A';

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = margin;

    const addText = (text, options = {}) => {
      const { size = 11, bold = false, color = [30, 30, 30], lineGap = 4 } = options;
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
      lines.forEach((ln) => {
        if (y > pageHeight - margin) { doc.addPage(); y = margin; }
        doc.text(ln, margin, y);
        y += size + lineGap;
      });
    };

    doc.setFillColor(7, 11, 28);
    doc.rect(0, 0, pageWidth, 70, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Learning Roadmap', margin, 44);
    y = 100;

    addText(`Career Goal: ${goal}`, { size: 16, bold: true, color: [6, 182, 212] });
    addText(`Estimated Total Time: ${estTime}`, { size: 11, color: [80, 80, 80] });
    y += 8;

    steps.forEach((step, index) => {
      if (y > pageHeight - 120) { doc.addPage(); y = margin; }
      addText(`Step ${step.step_number || index + 1}: ${step.title || 'Untitled'}`, { size: 13, bold: true, color: [17, 24, 39] });
      if (step.description) addText(step.description, { size: 10, color: [55, 65, 81] });
      if (step.estimated_time) addText(`Estimated: ${step.estimated_time}`, { size: 10, color: [107, 114, 128] });
      if (Array.isArray(step.skills_to_learn) && step.skills_to_learn.length) {
        addText(`Skills: ${step.skills_to_learn.join(', ')}`, { size: 10, color: [55, 65, 81] });
      }
      if (Array.isArray(step.resources) && step.resources.length) {
        addText(`Resources: ${step.resources.join(', ')}`, { size: 10, color: [55, 65, 81] });
      }
      if (Array.isArray(step.projects) && step.projects.length) {
        addText(`Projects: ${step.projects.join(', ')}`, { size: 10, color: [55, 65, 81] });
      }
      y += 6;
    });

    doc.save(`${goal.replace(/s+/g, '_')}_roadmap.pdf`);
  };

  return (
    <div className="min-h-screen relative aurora-bg grid-bg overflow-hidden text-ink-950 dark:text-white" data-testid="roadmap-page">
      <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
      <div className="blob w-[440px] h-[440px] -right-32 top-40 bg-coral-400/25 pointer-events-none" style={{ animationDelay: '-6s' }} />
      <div className="blob w-[420px] h-[420px] left-[40%] bottom-[-10rem] bg-indigo-500/20 pointer-events-none" style={{ animationDelay: '-8s' }} />

      <div className="relative z-10">
        <Navbar />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header — ink-navy hero */}
        <div className="relative animate-scale-in">
          <div className="relative overflow-hidden rounded-[28px] bg-ink-950 text-white p-8 md:p-10 shadow-soft-lg">
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  'radial-gradient(600px 400px at 10% -10%, rgba(34,211,238,.28), transparent 60%), radial-gradient(600px 500px at 95% 110%, rgba(255,106,91,.22), transparent 60%)',
              }}
            />
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div>
                <span className="chip chip-cyan mb-3"><Brain className="w-3 h-3" /> AI copilot</span>
                <h1 className="font-display text-5xl md:text-6xl leading-[.95] tracking-tight" data-testid="roadmap-page-title">
                  Your AI <span className="italic text-gradient-cyan">study</span><br />
                  <span className="italic text-gradient">roadmap</span>.
                </h1>
                <p className="mt-3 text-ink-300">Generate personalized learning paths and track completion progress.</p>
              </div>
              <div className="glass rounded-2xl px-5 py-4 bg-white/5 border-white/10" data-testid="known-skills-count">
                <p className="text-[10px] uppercase tracking-widest text-cyan-300">Skills detected</p>
                <p className="font-display text-4xl text-white">{knownSkills.length}</p>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className="bento p-4 flex items-center gap-3" data-testid="roadmap-status-message">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span className="text-sm">{message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Generator form */}
          <form onSubmit={handleGenerateRoadmap} className="bento p-7 space-y-4" data-testid="roadmap-generate-form">
            <div>
              <span className="chip chip-coral mb-2"><Rocket className="w-3 h-3" /> generate</span>
              <h2 className="font-display text-3xl mt-2 leading-tight">
                New <span className="italic text-gradient">roadmap</span>
              </h2>
            </div>

            <label className="block">
              <span className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300">Career Goal</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-3 focus-within:border-cyan-400 focus-within:shadow-glow transition">
                <Target className="w-4 h-4 text-ink-400" />
                <input
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="e.g. Backend Developer"
                  className="flex-1 bg-transparent outline-none text-sm"
                  required
                  data-testid="roadmap-career-goal-input"
                />
              </div>
            </label>

            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 p-4" data-testid="roadmap-known-skills-list">
              <p className="text-xs uppercase tracking-widest text-ink-500 dark:text-ink-300 mb-2">Current skills</p>
              <p className="text-sm text-ink-700 dark:text-ink-200">
                {knownSkills.length ? knownSkills.join(', ') : 'No skills found yet in profile.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-coral py-3 disabled:opacity-60"
              data-testid="roadmap-generate-button"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              {loading ? 'Generating…' : 'Generate roadmap'}
            </button>

            <p className="text-xs text-ink-500 dark:text-ink-300 pt-2 border-t border-black/5 dark:border-white/10" data-testid="roadmap-token-note">
               Track milestones and download your roadmap as a PDF anytime.
            </p>
          </form>

          {/* Results panel */}
          <div className="lg:col-span-2 bento p-7" data-testid="roadmap-results-panel">
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <div>
                <span className="chip chip-cyan mb-2"><Map className="w-3 h-3" /> my roadmaps</span>
                <h2 className="font-display text-3xl mt-2 leading-tight">
                  Tracks <span className="italic text-gradient-cyan">in flight</span>
                </h2>
              </div>
              {loadingRoadmaps && <Loader2 className="w-4 h-4 animate-spin text-cyan-500" data-testid="roadmap-list-loading" />}
            </div>

            {roadmaps.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5" data-testid="roadmap-selector-list">
                {roadmaps.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedRoadmap(item)}
                    className={selectedRoadmap?.id === item.id ? 'btn btn-primary' : 'btn btn-ghost'}
                    data-testid="roadmap-selector-button"
                  >
                    {item.career_goal}
                  </button>
                ))}
              </div>
            )}

            {!selectedRoadmap ? (
              <div className="empty-state" data-testid="roadmap-empty-state">
                <Map className="w-8 h-8 text-ink-400" />
                <p className="font-display text-2xl">No roadmap yet</p>
                <p className="text-sm text-ink-500 max-w-sm">
                  Generate your first roadmap to see structured step-by-step guidance.
                </p>
              </div>
            ) : (
              <div className="space-y-5" data-testid="roadmap-details">
                <div className="relative overflow-hidden rounded-[24px] bg-ink-950 text-white p-6">
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      background:
                        'radial-gradient(500px 300px at 10% -10%, rgba(34,211,238,.3), transparent 60%), radial-gradient(500px 300px at 100% 110%, rgba(255,106,91,.22), transparent 60%)',
                    }}
                  />
                  <div className="relative">
                    <span className="chip chip-cyan mb-3">selected</span>
                    <h3 className="font-display text-3xl leading-tight" data-testid="roadmap-selected-goal">
                      {selectedRoadmap.career_goal || selectedRoadmap?.roadmap_data?.career_goal}
                    </h3>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="chip chip-ink ring-1 ring-white/10 bg-white/5 text-white" data-testid="roadmap-estimated-time">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {selectedRoadmap?.roadmap_data?.estimated_total_time || selectedRoadmap?.estimated_total_time || 'N/A'}
                      </span>
                      <span className="chip chip-coral" data-testid="roadmap-completion-percentage">
                        {Math.round(Number(selectedRoadmap.completion_percentage || 0))}% done
                      </span>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full animate-progress"
                        style={{
                          width: `${Math.round(Number(selectedRoadmap.completion_percentage || 0))}%`,
                          background: 'linear-gradient(90deg,#22d3ee,#ff6a5b)'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1" data-testid="roadmap-steps-list">
                  {steps.map((step, index) => (
                    <div key={`${step.step_number}-${index}`} className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/5 p-5 hover:shadow-soft transition">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 text-white text-xs font-bold grid place-items-center" data-testid="roadmap-step-number">
                          {step.step_number || index + 1}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-cyan-600 dark:text-cyan-300 font-semibold">step</span>
                      </div>
                      <h4 className="font-display text-xl leading-tight" data-testid="roadmap-step-title">{step.title}</h4>
                      <p className="text-sm text-ink-500 dark:text-ink-300 mt-1.5" data-testid="roadmap-step-description">{step.description}</p>
                      <p className="text-xs text-ink-400 mt-3 inline-flex items-center gap-1" data-testid="roadmap-step-time">
                        <ClockIcon className="w-3.5 h-3.5" /> {step.estimated_time || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>

                {selectedRoadmap && (
                  <div className="flex flex-wrap gap-3 pt-2" data-testid="roadmap-actions-row">
                    <button
                      onClick={downloadPDF}
                      className="btn btn-cyan"
                      data-testid="roadmap-download-pdf-button"
                    >
                      <Download className="w-4 h-4" />
                      Download as PDF
                    </button>

                    {selectedRoadmap?.id && (
                      <button
                        onClick={markCompleted}
                        disabled={updatingProgress}
                        className="btn btn-coral disabled:opacity-60"
                        data-testid="roadmap-complete-button"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Complete roadmap
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapPlanner;
