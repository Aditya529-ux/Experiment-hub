'use client';
import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, FlaskConical, Edit3, Trash2, Share2, X, Save, Sparkles, Eye } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { experimentsAPI, aiAPI } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';

const STATUS_OPTIONS = ['draft', 'in-progress', 'completed', 'failed'];
const TAG_PRESETS = ['ai', 'web', 'ml', 'python', 'data-science', 'devops', 'mobile', 'database', 'algorithms', 'testing'];

function ExperimentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ title: '', objective: '', steps: '', results: '', status: 'draft', tags: [] as string[], visibility: 'private', successRating: 5 });
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { loadExperiments(); }, [filterStatus]);
  useEffect(() => { if (searchParams.get('new') === 'true') { setShowModal(true); } }, [searchParams]);

  const loadExperiments = async () => {
    try {
      const params: any = { limit: 50 };
      if (filterStatus) params.status = filterStatus;
      const res = await experimentsAPI.list(params);
      setExperiments(res.data.experiments || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await experimentsAPI.update(editId, { ...form, createVersion: true, versionChanges: 'Updated via editor' });
      } else {
        await experimentsAPI.create(form);
      }
      setShowModal(false);
      setEditId(null);
      setForm({ title: '', objective: '', steps: '', results: '', status: 'draft', tags: [], visibility: 'private', successRating: 5 });
      loadExperiments();
    } catch (e) { console.error(e); }
  };

  const handleEdit = (exp: any) => {
    setEditId(exp._id);
    setForm({ title: exp.title, objective: exp.objective, steps: exp.steps || '', results: exp.results || '', status: exp.status, tags: exp.tags || [], visibility: exp.visibility || 'private', successRating: exp.successRating || 5 });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this experiment?')) return;
    try { await experimentsAPI.delete(id); loadExperiments(); } catch (e) { console.error(e); }
  };

  const handleAI = async () => {
    setAiLoading(true);
    try {
      const res = await aiAPI.summarize({ title: form.title, objective: form.objective, steps: form.steps, results: form.results });
      setForm(f => ({ ...f, tags: [...new Set([...f.tags, ...(res.data.tags || [])])] }));
      alert(`AI Summary: ${res.data.summary}\n\nRecommendations:\n${(res.data.recommendations || []).join('\n')}`);
    } catch (e) { console.error(e); }
    setAiLoading(false);
  };

  const toggleTag = (tag: string) => {
    setForm(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }));
  };

  const filtered = experiments.filter(e => !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const statusColor: Record<string, string> = { completed: '#10b981', 'in-progress': '#3b82f6', draft: '#6b7280', failed: '#ef4444' };

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700 }}>🧪 Experiments</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>{experiments.length} experiment{experiments.length !== 1 ? 's' : ''} tracked</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="glass-button" style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => { setEditId(null); setForm({ title: '', objective: '', steps: '', results: '', status: 'draft', tags: [], visibility: 'private', successRating: 5 }); setShowModal(true); }}>
            <Plus size={16} /> New Experiment
          </motion.button>
        </motion.div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="glass-input" style={{ paddingLeft: 40 }} placeholder="Search experiments..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <select className="glass-input" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        {/* Experiment Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map((exp, i) => (
            <motion.div key={exp._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => router.push(`/experiments/${exp._id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div className={`status-dot status-${exp.status}`} />
                    <span style={{ fontSize: 11, color: statusColor[exp.status] || 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{exp.status}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{exp.title}</h3>
                </div>
                {exp.successRating != null && (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${exp.successRating >= 7 ? '#10b981' : exp.successRating >= 4 ? '#f59e0b' : '#ef4444'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: exp.successRating >= 7 ? '#10b981' : exp.successRating >= 4 ? '#f59e0b' : '#ef4444' }}>
                    {exp.successRating}
                  </div>
                )}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {exp.objective}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {(exp.tags || []).slice(0, 4).map((t: string) => <span key={t} className="glass-badge" style={{ fontSize: 10 }}>{t}</span>)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(exp.updatedAt).toLocaleDateString()}</span>
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }} onClick={() => handleEdit(exp)}><Edit3 size={14} /></button>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }} onClick={() => handleDelete(exp._id)}><Trash2 size={14} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <FlaskConical size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>No experiments found</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Create your first experiment to get started!</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>{editId ? 'Edit' : 'New'} Experiment</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Title *</label>
                  <input className="glass-input" placeholder="Experiment title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Objective *</label>
                  <textarea className="glass-input" style={{ minHeight: 80, resize: 'vertical' }} placeholder="What are you trying to achieve?" value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Steps</label>
                  <textarea className="glass-input" style={{ minHeight: 80, resize: 'vertical' }} placeholder="Describe the steps you took..." value={form.steps} onChange={e => setForm({ ...form, steps: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Results</label>
                  <textarea className="glass-input" style={{ minHeight: 60, resize: 'vertical' }} placeholder="What were the results?" value={form.results} onChange={e => setForm({ ...form, results: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Status</label>
                    <select className="glass-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Rating (0-10)</label>
                    <input className="glass-input" type="number" min="0" max="10" value={form.successRating} onChange={e => setForm({ ...form, successRating: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Tags</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {TAG_PRESETS.map(tag => (
                      <button key={tag} onClick={() => toggleTag(tag)} className={form.tags.includes(tag) ? 'glass-badge' : 'glass-badge'} style={{
                        cursor: 'pointer', border: 'none', opacity: form.tags.includes(tag) ? 1 : 0.4,
                        background: form.tags.includes(tag) ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.08)'
                      }}>{tag}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <motion.button whileHover={{ scale: 1.02 }} className="glass-button" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={handleSave}>
                  <Save size={16} /> {editId ? 'Update' : 'Create'}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} className="glass-button-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleAI} disabled={aiLoading}>
                  <Sparkles size={16} /> {aiLoading ? 'Analyzing...' : 'AI Analyze'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

export default function ExperimentsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading experiments...</div>}>
      <ExperimentsContent />
    </Suspense>
  );
}
