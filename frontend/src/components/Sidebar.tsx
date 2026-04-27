'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FlaskConical, FolderKanban, BarChart3,
  Clock, Search, MessageSquare, Settings, LogOut, Sun, Moon,
  ChevronLeft, Sparkles, Bell
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/experiments', label: 'Experiments', icon: FlaskConical },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/timeline', label: 'Timeline', icon: Clock },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/ai-chat', label: 'AI Assistant', icon: Sparkles },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, theme, toggleTheme, logout, sidebarOpen, toggleSidebar } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>
          <span style={{ fontSize: 28 }}>🧪</span>
          <span style={{ fontSize: 18, fontWeight: 700, background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ExperimentHub
          </span>
        </div>
      </div>

      {/* User Card */}
      <div style={{ padding: '12px 16px', margin: '8px 12px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white'
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email || ''}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        <div style={{ padding: '0 20px', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Menu</span>
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname?.startsWith(item.path));
          const Icon = item.icon;
          return (
            <motion.div
              key={item.path}
              whileHover={{ x: 4 }}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => router.push(item.path)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.path === '/ai-chat' && (
                <span style={{
                  marginLeft: 'auto', fontSize: 9, padding: '2px 8px', borderRadius: 10,
                  background: 'var(--gradient-1)', color: 'white', fontWeight: 700
                }}>AI</span>
              )}
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--glass-border)' }}>
        <div className="sidebar-nav-item" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </div>
        <div className="sidebar-nav-item" onClick={handleLogout} style={{ color: '#f87171' }}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </div>
      </div>
    </aside>
  );
}
