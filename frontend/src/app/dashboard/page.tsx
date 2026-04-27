'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, CheckCircle, XCircle, Clock, TrendingUp, Sparkles, Plus, ArrowRight, Zap, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AppLayout from '@/components/AppLayout';
import { analyticsAPI, experimentsAPI, aiAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

const COLORS = ['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } })
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentExperiments, setRecentExperiments] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analyticsRes, expRes, patternRes] = await Promise.allSettled([
        analyticsAPI.get(),
        experimentsAPI.list({ limit: 5, sort: '-updatedAt' }),
        aiAPI.patterns()
      ]);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
      if (expRes.status === 'fulfilled') setRecentExperiments(expRes.value.data.experiments || []);
      if (patternRes.status === 'fulfilled') setPatterns(patternRes.value.data.patterns || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const stats = analytics ? [
    { label: 'Total Experiments', value: analytics.overview.total, icon: FlaskConical, color: '#6366f1' },
    { label: 'Completed', value: analytics.overview.completed, icon: CheckCircle, color: '#10b981' },
    { label: 'In Progress', value: analytics.overview.inProgress, icon: Clock, color: '#3b82f6' },
    { label: 'Success Rate', value: `${analytics.successRate}%`, icon: TrendingUp, color: '#f59e0b' },
  ] : [
    { label: 'Total Experiments', value: 0, icon: FlaskConical, color: '#6366f1' },
    { label: 'Completed', value: 0, icon: CheckCircle, color: '#10b981' },
    { label: 'In Progress', value: 0, icon: Clock, color: '#3b82f6' },
    { label: 'Success Rate', value: '0%', icon: TrendingUp, color: '#f59e0b' },
  ];

  const statusColor: Record<string, string> = { completed: '#10b981', 'in-progress': '#3b82f6', draft: '#6b7280', failed: '#ef4444' };

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>
            Welcome back, <span style={{ background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0] || 'Researcher'}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>Here&apos;s your experiment overview and AI insights.</p>
        </motion.div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} custom={i} initial="hidden" animate="visible" variants={cardVariants}
                className="glass-card stat-card" style={{ padding: 20, cursor: 'default' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 6 }}>{stat.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} style={{ color: stat.color }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* Activity Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card-static" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>📈 Experiment Activity</h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.monthly || []}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 10, fontSize: 12 }} />
                  <Area type="monotone" dataKey="created" stroke="#6366f1" fill="url(#colorCreated)" strokeWidth={2} />
                  <Area type="monotone" dataKey="completed" stroke="#10b981" fill="url(#colorCompleted)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Tag Distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card-static" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>🏷️ Tag Distribution</h3>
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {analytics?.tagDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.tagDistribution} dataKey="count" nameKey="tag" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                      {analytics.tagDistribution.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Target size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <p style={{ fontSize: 13 }}>Add tags to experiments to see distribution</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Recent Experiments */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card-static" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>🧪 Recent Experiments</h3>
              <button className="glass-button-secondary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => router.push('/experiments')}>
                View All <ArrowRight size={12} style={{ marginLeft: 4 }} />
              </button>
            </div>
            {recentExperiments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <FlaskConical size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                <p style={{ fontSize: 13 }}>No experiments yet.</p>
                <button className="glass-button" style={{ marginTop: 12, fontSize: 13, padding: '8px 20px' }} onClick={() => router.push('/experiments')}>
                  <Plus size={14} style={{ marginRight: 6 }} /> Create First Experiment
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentExperiments.map((exp) => (
                  <motion.div key={exp._id} whileHover={{ x: 4 }} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 10, background: 'var(--surface)', cursor: 'pointer', transition: 'background 0.2s'
                  }} onClick={() => router.push(`/experiments/${exp._id}`)}>
                    <div className={`status-dot status-${exp.status}`} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exp.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(exp.updatedAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(exp.tags || []).slice(0, 2).map((t: string) => (
                        <span key={t} className="glass-badge" style={{ fontSize: 10, padding: '2px 8px' }}>{t}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* AI Patterns */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card-static" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} style={{ color: 'var(--accent)' }} /> AI Insights
            </h3>
            {patterns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                <Zap size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                <p style={{ fontSize: 13 }}>Add experiments to unlock AI insights</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {patterns.map((p, i) => (
                  <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{p.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: p.trend === 'positive' ? '#10b981' : p.trend === 'negative' ? '#ef4444' : 'var(--text-primary)' }}>{p.value}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* FAB */}
      <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} className="fab" onClick={() => router.push('/experiments?new=true')}>
        <Plus size={24} />
      </motion.button>
    </AppLayout>
  );
}
