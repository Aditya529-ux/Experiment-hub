'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { experimentsAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function TimelinePage() {
  const router = useRouter();
  const [timeline, setTimeline] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTimeline(); }, []);

  const loadTimeline = async () => {
    try { const res = await experimentsAPI.timeline(); setTimeline(res.data.timeline || {}); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const months = Object.keys(timeline).sort().reverse();
  const statusColor: Record<string, string> = { completed: '#10b981', 'in-progress': '#3b82f6', draft: '#6b7280', failed: '#ef4444' };

  const formatMonth = (key: string) => {
    const [y, m] = key.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>⏱️ Timeline</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>Your learning journey, visualized</p>
        </motion.div>

        {months.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Clock size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>No experiments yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Your timeline will appear as you create experiments</p>
          </div>
        )}

        <div style={{ position: 'relative', paddingLeft: 48 }}>
          <div style={{ position: 'absolute', left: 23, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, var(--accent), var(--accent-glow), transparent)' }} />

          {months.map((monthKey, mi) => (
            <motion.div key={monthKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: mi * 0.1 }} style={{ marginBottom: 32 }}>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <div style={{ position: 'absolute', left: -33, top: 4, width: 16, height: 16, borderRadius: '50%', background: 'var(--accent)', border: '3px solid var(--bg-primary)', boxShadow: '0 0 12px var(--accent-glow)' }} />
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-light)' }}>{formatMonth(monthKey)}</h2>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeline[monthKey].length} experiment{timeline[monthKey].length !== 1 ? 's' : ''}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {timeline[monthKey].map((exp, ei) => (
                  <motion.div key={exp._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: mi * 0.1 + ei * 0.05 }}
                    className="glass-card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => router.push(`/experiments/${exp._id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`status-dot status-${exp.status}`} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{exp.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(exp.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          {exp.project && <> • <span style={{ color: exp.project.color }}>{exp.project.name}</span></>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(exp.tags || []).slice(0, 2).map((t: string) => <span key={t} className="glass-badge" style={{ fontSize: 10, padding: '2px 8px' }}>{t}</span>)}
                      </div>
                      {exp.successRating != null && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: exp.successRating >= 7 ? '#10b981' : '#f59e0b' }}>{exp.successRating}/10</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
