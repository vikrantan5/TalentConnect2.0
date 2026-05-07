import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/apiService';
import Navbar from '../components/Navbar';
import {
  Wifi, ShieldCheck, Bug, Sparkles, Hash, ArrowLeftRight, UserCircle2, Layers, Terminal,
} from 'lucide-react';

const WebSocketDebugger = () => {
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState([]);
  const [myExchanges, setMyExchanges] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [marketplace, mine] = await Promise.all([
        taskService.getSkillExchangeTasks('open'),
        taskService.getMySkillExchangeTasks(),
      ]);
      setExchanges(marketplace);
      setMyExchanges(mine);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  return (
    <div className="min-h-screen relative aurora-bg grid-bg overflow-x-hidden text-ink-950 dark:text-white" data-testid="ws-debugger-page">
      <div className="blob w-[520px] h-[520px] -left-40 -top-32 bg-cyan-400/30 pointer-events-none" />
      <div className="blob w-[440px] h-[440px] -right-32 top-40 bg-coral-400/25 pointer-events-none" style={{ animationDelay: '-6s' }} />
      <div className="blob w-[420px] h-[420px] left-[40%] bottom-[-10rem] bg-indigo-500/20 pointer-events-none" style={{ animationDelay: '-8s' }} />

      <div className="relative z-10">
        <Navbar />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero header — ink-navy */}
        <div className="relative mb-8 animate-scale-in">
          <div className="relative overflow-hidden rounded-[28px] bg-ink-950 text-white p-6 md:p-8 shadow-soft-lg">
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  'radial-gradient(600px 400px at 10% -10%, rgba(34,211,238,.28), transparent 60%), radial-gradient(600px 500px at 95% 110%, rgba(255,106,91,.22), transparent 60%)',
              }}
            />
            <div className="relative flex items-center justify-between flex-wrap gap-5">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-3xl bg-white/10 ring-1 ring-white/15 grid place-items-center text-cyan-300 backdrop-blur-md">
                  <Bug className="w-8 h-8" />
                </div>
                <div>
                  <span className="chip chip-cyan mb-2"><Sparkles className="w-3 h-3" /> developer tools</span>
                  <h1 className="font-display text-4xl md:text-5xl leading-[.95] tracking-tight">
                    WebSocket <span className="italic text-gradient-cyan">debugger</span>
                  </h1>
                  <p className="mt-2 text-ink-300 text-sm">Inspect live exchange rooms and verify chat sync.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip chip-cyan"><Wifi className="w-3 h-3" /> realtime</span>
                <span className="chip chip-coral"><ShieldCheck className="w-3 h-3" /> private</span>
              </div>
            </div>
          </div>
        </div>

        {/* User info card */}
        <div className="bento p-7 mb-8" data-testid="ws-user-card">
          <div className="flex items-center gap-2 mb-3">
            <UserCircle2 className="w-4 h-4 text-cyan-500" />
            <span className="chip chip-cyan">current user</span>
          </div>
          <h2 className="font-display text-2xl mb-3">Session identity</h2>
          <pre className="font-mono text-xs leading-relaxed glass rounded-2xl p-4 overflow-auto border border-black/5 dark:border-white/10">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        {/* Two-column lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bento p-7" data-testid="ws-marketplace">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <span className="chip chip-cyan mb-2"><Layers className="w-3 h-3" /> open</span>
                <h3 className="font-display text-2xl leading-tight">Marketplace <span className="italic text-gradient-cyan">exchanges</span></h3>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-ink-500">{exchanges.length} rooms</span>
            </div>

            {exchanges.length === 0 ? (
              <div className="empty-state">
                <Hash className="w-8 h-8 text-ink-400" />
                <p className="text-sm text-ink-500">No open exchanges right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exchanges.map((task) => (
                  <div key={task.id} className="rounded-2xl glass p-4 border border-transparent hover:border-black/5 dark:hover:border-white/10 transition">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-2">ID · {task.id}</div>
                    <div className="font-display text-xl flex items-center gap-2 flex-wrap">
                      <span className="chip chip-cyan">{task.skill_offered}</span>
                      <ArrowLeftRight className="w-4 h-4 text-ink-400" />
                      <span className="chip chip-coral">{task.skill_requested}</span>
                    </div>
                    <p className="text-xs text-ink-500 mt-2 truncate">creator: {task.creator_id}</p>
                    <p className="text-xs text-ink-500">status: {task.status}</p>
                    {task.acceptor_id && <p className="text-xs text-ink-500">acceptor: {task.acceptor_id}</p>}
                    <div className="mt-3 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20 px-3 py-2 text-[11px] font-mono text-amber-700 dark:text-amber-300">
                      Room ID for chat: <b>{task.id}</b>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bento p-7" data-testid="ws-mine">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <span className="chip chip-coral mb-2"><Sparkles className="w-3 h-3" /> active</span>
                <h3 className="font-display text-2xl leading-tight">My <span className="italic text-gradient">exchanges</span></h3>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-ink-500">{myExchanges.length} rooms</span>
            </div>

            {myExchanges.length === 0 ? (
              <div className="empty-state">
                <Hash className="w-8 h-8 text-ink-400" />
                <p className="text-sm text-ink-500">No exchanges started yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myExchanges.map((task) => (
                  <div key={task.id} className="rounded-2xl glass p-4 border border-transparent hover:border-black/5 dark:hover:border-white/10 transition">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-2">ID · {task.id}</div>
                    <div className="font-display text-xl flex items-center gap-2 flex-wrap">
                      <span className="chip chip-cyan">{task.skill_offered}</span>
                      <ArrowLeftRight className="w-4 h-4 text-ink-400" />
                      <span className="chip chip-coral">{task.skill_requested}</span>
                    </div>
                    <p className="text-xs text-ink-500 mt-2 truncate">creator: {task.creator_id}</p>
                    <p className="text-xs text-ink-500">status: {task.status}</p>
                    {task.acceptor_id && <p className="text-xs text-ink-500">acceptor: {task.acceptor_id}</p>}
                    <div className="mt-3 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 px-3 py-2 text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                      Room ID for chat: <b>{task.id}</b>
                    </div>
                    <div className="mt-2 rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/20 px-3 py-2 text-[11px] font-mono text-cyan-700 dark:text-cyan-300 space-y-0.5">
                      <p><b>Am I creator?</b> {task.creator_id === user?.id ? 'YES' : 'NO'}</p>
                      <p><b>Am I acceptor?</b> {task.acceptor_id === user?.id ? 'YES' : 'NO'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Debugging checklist */}
        <div className="bento p-7 mt-8 bg-ink-950 text-white relative overflow-hidden" data-testid="ws-checklist">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background:
                'radial-gradient(500px 300px at 10% -10%, rgba(255,106,91,.32), transparent 60%), radial-gradient(500px 400px at 95% 110%, rgba(34,211,238,.22), transparent 60%)',
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-cyan-300" />
              <span className="chip chip-cyan">checklist</span>
            </div>
            <h3 className="font-display text-3xl leading-tight mb-5">Debug <span className="italic text-gradient">checklist</span></h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-ink-300">
              <li>Both users must click <b>Chat</b> on a task with the <b>SAME ID</b>.</li>
              <li>If creator opens ID <code className="font-mono text-cyan-300">abc-123</code>, the acceptor must also see <code className="font-mono text-cyan-300">abc-123</code>.</li>
              <li>Verify the <b>Room ID for chat</b> above is identical for both users.</li>
              <li>Open dev-tools console and confirm WebSocket connects to:
                <code className="block bg-black/40 ring-1 ring-white/10 text-cyan-300 font-mono p-3 mt-2 rounded-2xl text-xs">
                  ws://127.0.0.1:8000/api/realtime/ws/exchange/SAME-ID?token=...
                </code>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebSocketDebugger;
