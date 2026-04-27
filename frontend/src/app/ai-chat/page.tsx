'use client';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { aiAPI } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m your AI experiment assistant. I can help you analyze experiments, suggest improvements, recommend next steps, and answer questions about your work. What would you like to know?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const quickActions = [
    'Summarize my recent experiments',
    'Suggest improvements for my work',
    'What should I experiment with next?',
    'Analyze my success patterns',
  ];

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.chat({ message: msg });
      const assistantMsg: Message = { role: 'assistant', content: res.data.reply, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date() }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={24} style={{ color: 'var(--accent)' }} /> AI Assistant
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>Ask questions about your experiments and get smart insights</p>
        </motion.div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'assistant' ? 'var(--gradient-1)' : 'var(--surface)',
                border: msg.role === 'user' ? '1px solid var(--glass-border)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {msg.role === 'assistant' ? <Bot size={16} color="white" /> : <User size={16} style={{ color: 'var(--text-secondary)' }} />}
              </div>
              <div style={{
                maxWidth: '75%', padding: '12px 16px', borderRadius: 14,
                background: msg.role === 'assistant' ? 'var(--glass-bg)' : 'rgba(99,102,241,0.15)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(10px)',
                borderTopLeftRadius: msg.role === 'assistant' ? 4 : 14,
                borderTopRightRadius: msg.role === 'user' ? 4 : 14,
              }}>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)' }}>{msg.content}</p>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, display: 'block' }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} color="white" />
              </div>
              <div style={{ padding: '12px 16px', borderRadius: 14, borderTopLeftRadius: 4, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Thinking...
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {quickActions.map(qa => (
              <motion.button key={qa} whileHover={{ scale: 1.03 }} className="glass-button-secondary"
                style={{ fontSize: 12, padding: '8px 14px', borderRadius: 20 }} onClick={() => handleSend(qa)}>
                {qa}
              </motion.button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 0' }}>
          <input ref={inputRef} className="glass-input" style={{ flex: 1, fontSize: 14, padding: '14px 18px' }}
            placeholder="Ask me anything about your experiments..."
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && handleSend()} disabled={loading} />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="glass-button"
            style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => handleSend()} disabled={loading || !input.trim()}>
            <Send size={16} />
          </motion.button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppLayout>
  );
}
