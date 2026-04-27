'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { projectsAPI } from '@/lib/api';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [experiments, setExperiments] = useState<any[]>([]);

  useEffect(() => { if (id) loadProject(); }, [id]);

  const loadProject = async () => {
    try {
      const res = await projectsAPI.get(id as string);
      setProject(res.data.project);
      setExperiments(res.data.experiments || []);
    } catch (e) { console.error(e); }
  };

  if (!project) return <AppLayout><div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div></AppLayout>;

  const statusColor: Record<string, string> = { completed: '#10b981', 'in-progress': '#3b82f6', draft: '#6b7280', failed: '#ef4444' };

  return (
    <AppLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <button onClick={() => router.push('/projects')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, marginBottom: 20 }}>
          <ArrowLeft size={16} /> Back to Projects
        </button>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-static" style={{ padding: 28, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: project.color || 'var(--accent)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: `${project.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{project.icon}</div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>{project.name}</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{project.description || 'No description'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            <span><strong style={{ color: 'var(--text-primary)' }}>{experiments.length}</strong> experiments</span>
            <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </motion.div>

        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Experiments</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {experiments.map((exp, i) => (
            <motion.div key={exp._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card" style={{ padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
              onClick={() => router.push(`/experiments/${exp._id}`)}>
              <div className={`status-dot status-${exp.status}`} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{exp.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{exp.status} • {new Date(exp.updatedAt).toLocaleDateString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(exp.tags || []).slice(0, 2).map((t: string) => <span key={t} className="glass-badge" style={{ fontSize: 10 }}>{t}</span>)}
              </div>
            </motion.div>
          ))}
        </div>
        {experiments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <FlaskConical size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
            <p style={{ fontSize: 13 }}>No experiments in this project yet.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
