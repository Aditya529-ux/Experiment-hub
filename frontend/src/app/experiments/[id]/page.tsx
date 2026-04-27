'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit3, Share2, Sparkles, MessageSquare, GitBranch, Clock, Eye, Tag } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { experimentsAPI, commentsAPI, aiAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function ExperimentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [exp, setExp] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [tab, setTab] = useState<'details' | 'versions' | 'comments'>('details');
  const [aiSummary, setAiSummary] = useState('');

  useEffect(() => { if (id) loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [expRes, commentRes, versionRes] = await Promise.allSettled([
        experimentsAPI.get(id as string),
        commentsAPI.list(id as string),
        experimentsAPI.versions(id as string),
      ]);
      if (expRes.status === 'fulfilled') setExp(expRes.value.data.experiment);
      if (commentRes.status === 'fulfilled') setComments(commentRes.value.data.comments || []);
      if (versionRes.status === 'fulfilled') setVersions(versionRes.value.data.versions || []);
    } catch (e) { console.error(e); }
  };

  const handleAISummary = async () => {
    try {
      const res = await aiAPI.summarize({ title: exp.title, objective: exp.objective, steps: exp.steps, results: exp.results });
      setAiSummary(res.data.summary);
    } catch (e) { console.error(e); }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      await commentsAPI.create(id as string, { content: newComment });
      setNewComment('');
      const res = await commentsAPI.list(id as string);
      setComments(res.data.comments || []);
    } catch (e) { console.error(e); }
  };

  const handleShare = async () => {
    try {
      const res = await experimentsAPI.share(id as string);
      const url = `${window.location.origin}/shared/${res.data.shareToken}`;
      navigator.clipboard.writeText(url);
      alert('Share link copied to clipboard!');
    } catch (e) { console.error(e); }
  };

  if (!exp) return <AppLayout><div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div></AppLayout>;

  const statusColor: Record<string, string> = { completed: '#10b981', 'in-progress': '#3b82f6', draft: '#6b7280', failed: '#ef4444' };

  return (
    <AppLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Back + Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={() => router.push('/experiments')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14 }}>
              <ArrowLeft size={16} /> Back
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="glass-button-secondary" style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleShare}><Share2 size={14} /> Share</button>
              <button className="glass-button-secondary" style={{ padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleAISummary}><Sparkles size={14} /> AI Summary</button>
            </div>
          </div>

          {/* Header Card */}
          <div className="glass-card-static" style={{ padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div className={`status-dot status-${exp.status}`} />
              <span style={{ fontSize: 12, fontWeight: 600, color: statusColor[exp.status], textTransform: 'uppercase' }}>{exp.status}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}><Eye size={12} style={{ display: 'inline', marginRight: 4 }} />{exp.viewCount || 0} views</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>v{exp.currentVersion}</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>{exp.title}</h1>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {(exp.tags || []).map((t: string) => <span key={t} className="glass-badge">{t}</span>)}
              {(exp.aiTags || []).map((t: string) => <span key={t} className="glass-badge badge-info">{t}</span>)}
            </div>
            {exp.successRating != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                Success Rating: <span style={{ fontWeight: 700, color: exp.successRating >= 7 ? '#10b981' : exp.successRating >= 4 ? '#f59e0b' : '#ef4444' }}>{exp.successRating}/10</span>
              </div>
            )}
          </div>

          {aiSummary && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card-static" style={{ padding: 20, marginBottom: 20, borderLeft: '3px solid var(--accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--accent-light)' }}><Sparkles size={14} /> AI Summary</div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{aiSummary}</p>
            </motion.div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--glass-border)', paddingBottom: 0 }}>
            {(['details', 'versions', 'comments'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '10px 20px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
                color: tab === t ? 'var(--accent-light)' : 'var(--text-muted)',
                borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.2s'
              }}>{t.charAt(0).toUpperCase() + t.slice(1)}{t === 'comments' ? ` (${comments.length})` : t === 'versions' ? ` (${versions.length})` : ''}</button>
            ))}
          </div>

          {tab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="glass-card-static" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: 'var(--accent-light)' }}>🎯 Objective</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{exp.objective}</p>
              </div>
              {exp.steps && (
                <div className="glass-card-static" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: 'var(--accent-light)' }}>📋 Steps</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{exp.steps}</p>
                </div>
              )}
              {exp.results && (
                <div className="glass-card-static" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: 'var(--accent-light)' }}>📊 Results</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{exp.results}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'versions' && (
            <div style={{ position: 'relative', paddingLeft: 36 }}>
              <div style={{ position: 'absolute', left: 14, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, var(--accent), transparent)' }} />
              {versions.map((v, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="glass-card-static" style={{ padding: 16, marginBottom: 12, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -28, top: 16, width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-primary)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Version {v.versionNumber}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(v.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{v.changes}</p>
                </motion.div>
              ))}
              {versions.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No version history yet.</p>}
            </div>
          )}

          {tab === 'comments' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input className="glass-input" placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment()} />
                <button className="glass-button" style={{ padding: '10px 20px' }} onClick={handleComment}>Post</button>
              </div>
              {comments.map((c, i) => (
                <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ padding: 14, borderRadius: 10, background: 'var(--surface)', marginBottom: 8, border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--gradient-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 700 }}>
                      {c.user?.name?.charAt(0) || 'U'}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{c.user?.name || 'User'}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.content}</p>
                </motion.div>
              ))}
              {comments.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No comments yet. Be the first!</p>}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
