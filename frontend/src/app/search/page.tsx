'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Filter, Calendar, Star } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { searchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [filters, setFilters] = useState({ tags: '', status: '', dateFrom: '', dateTo: '', minRating: '' });
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async () => {
    try {
      const params: any = {};
      if (query) params.q = query;
      if (filters.tags) params.tags = filters.tags;
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.minRating) params.minRating = filters.minRating;
      const res = await searchAPI.search(params);
      setResults(res.data.experiments || []);
      setSearched(true);
    } catch (e) { console.error(e); }
  };

  const statusColor: Record<string, string> = { completed: '#10b981', 'in-progress': '#3b82f6', draft: '#6b7280', failed: '#ef4444' };

  return (
    <AppLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>🔍 Search</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>Find experiments by keywords, tags, or filters</p>
        </motion.div>

        {/* Search Bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <SearchIcon size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="glass-input" style={{ paddingLeft: 44, fontSize: 15, padding: '14px 16px 14px 44px' }} placeholder="Search experiments..." value={query}
              onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          </div>
          <button className="glass-button-secondary" style={{ padding: '12px 16px' }} onClick={() => setShowFilters(!showFilters)}><Filter size={18} /></button>
          <button className="glass-button" style={{ padding: '12px 24px' }} onClick={handleSearch}>Search</button>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card-static" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tags (comma-sep)</label>
                <input className="glass-input" placeholder="ai, web, ml" value={filters.tags} onChange={e => setFilters({ ...filters, tags: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Status</label>
                <select className="glass-input" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                  <option value="">All</option>
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="draft">Draft</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>From Date</label>
                <input className="glass-input" type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Min Rating</label>
                <input className="glass-input" type="number" min="0" max="10" placeholder="0-10" value={filters.minRating} onChange={e => setFilters({ ...filters, minRating: e.target.value })} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {searched && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{results.length} result{results.length !== 1 ? 's' : ''} found</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {results.map((exp, i) => (
            <motion.div key={exp._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card" style={{ padding: 18, cursor: 'pointer' }} onClick={() => router.push(`/experiments/${exp._id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className={`status-dot status-${exp.status}`} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{exp.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{exp.objective}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {(exp.tags || []).slice(0, 3).map((t: string) => <span key={t} className="glass-badge" style={{ fontSize: 10 }}>{t}</span>)}
                </div>
                {exp.successRating != null && <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', flexShrink: 0 }}>{exp.successRating}/10</span>}
              </div>
            </motion.div>
          ))}
        </div>

        {searched && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
            <SearchIcon size={36} style={{ marginBottom: 10, opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>No experiments match your search</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
