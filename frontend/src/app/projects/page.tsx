'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FolderKanban, X, Save, Trash2, FlaskConical } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { projectsAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

const ICONS = ['🧪', '🚀', '🤖', '🌐', '📊', '🔬', '💡', '⚡', '🎯', '📱'];
const COLORS = ['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon: '🧪', color: '#6366f1', visibility: 'private' });

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try { const res = await projectsAPI.list(); setProjects(res.data.projects || []); } catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try { await projectsAPI.create(form); setShowModal(false); setForm({ name: '', description: '', icon: '🧪', color: '#6366f1', visibility: 'private' }); loadProjects(); } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? Experiments will be unlinked.')) return;
    try { await projectsAPI.delete(id); loadProjects(); } catch (e) { console.error(e); }
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700 }}>📁 Projects</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>Organize experiments into workspaces</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="glass-button" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Project
          </motion.button>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {projects.map((p, i) => (
            <motion.div key={p._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="glass-card" style={{ padding: 24, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              onClick={() => router.push(`/projects/${p._id}`)}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: p.color || 'var(--accent)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.color || '#6366f1'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {p.icon || '🧪'}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.experimentCount || 0} experiments</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              </div>
              {p.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>}
              <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                {(p.tags || []).slice(0, 3).map((t: string) => <span key={t} className="glass-badge" style={{ fontSize: 10 }}>{t}</span>)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, borderTop: '1px solid var(--glass-border)', paddingTop: 10 }}>
                Updated {new Date(p.updatedAt).toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </div>

        {projects.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <FolderKanban size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>No projects yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Create a project to organize your experiments</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="glass-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>New Project</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Name *</label>
                  <input className="glass-input" placeholder="Project name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Description</label>
                  <textarea className="glass-input" style={{ minHeight: 70, resize: 'vertical' }} placeholder="What is this project about?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Icon</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ICONS.map(ic => (
                      <button key={ic} onClick={() => setForm({ ...form, icon: ic })} style={{
                        width: 40, height: 40, borderRadius: 10, border: form.icon === ic ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                        background: form.icon === ic ? 'rgba(99,102,241,0.15)' : 'var(--surface)', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>{ic}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Color</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setForm({ ...form, color: c })} style={{
                        width: 32, height: 32, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '2px solid transparent',
                        cursor: 'pointer', boxShadow: form.color === c ? `0 0 12px ${c}60` : 'none'
                      }} />
                    ))}
                  </div>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} className="glass-button" style={{ width: '100%', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={handleSave}>
                <Save size={16} /> Create Project
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
