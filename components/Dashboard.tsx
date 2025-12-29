
import React, { useMemo } from 'react';
import { Game, LeaderboardMetric, Theme } from '../types';
import { LOGO_URL } from '../constants';
import LongPressable from './LongPressable';

interface DashboardProps {
  games: Game[];
  metric: LeaderboardMetric;
  setMetric: (m: LeaderboardMetric) => void;
  onNewGame: () => void;
  onLoadGame: (id: number) => void;
  onPromptDelete: (type: 'game', id: number, name: string) => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  games, metric, setMetric, onNewGame, onLoadGame, onPromptDelete, theme, onToggleTheme 
}) => {

  const hasCompletedGame = useMemo(() => {
    return games.some(g => g.players.some(p => p.scores.reduce((a, b) => a + (b || 0), 0) >= g.targetScore));
  }, [games]);

  const leaderboard = useMemo(() => {
    if (!hasCompletedGame) return [];
    const stats: Record<string, { wins: number; score: number; icon: string }> = {};
    games.forEach(g => {
      let winnerName = null;
      let maxScore = -1;
      g.players.forEach(p => {
        const total = p.scores.reduce((a, b) => a + (b || 0), 0);
        if (!stats[p.name]) stats[p.name] = { wins: 0, score: 0, icon: p.icon };
        stats[p.name].score += total;
        if (total >= g.targetScore && total > maxScore) {
          maxScore = total;
          winnerName = p.name;
        }
      });
      if (winnerName) stats[winnerName].wins += 1;
    });
    const sorted = Object.entries(stats).map(([name, s]) => ({ name, ...s }));
    metric === 'wins' ? sorted.sort((a, b) => b.wins - a.wins || b.score - a.score) : sorted.sort((a, b) => b.score - a.score);
    return sorted.slice(0, 10);
  }, [games, metric, hasCompletedGame]);

  const maxVal = useMemo(() => {
    if (leaderboard.length === 0) return 1;
    return Math.max(...leaderboard.map(p => metric === 'wins' ? p.wins : p.score));
  }, [leaderboard, metric]);

  return (
    <div className="flex flex-col h-full z-10 fade-in overflow-y-auto no-scrollbar pb-[calc(3rem+var(--safe-bottom))] pt-[var(--safe-top)]">
      <div className="pt-6 px-6 flex justify-end items-center">
        <button className="w-10 h-10 rounded-full bg-magical-surface text-magical-muted hover:text-magical-text hover:bg-magical-surface2 transition-all flex items-center justify-center shadow-lg" onClick={onToggleTheme}>
          <span className="material-symbols-rounded text-xl">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>

      <div className="p-4 space-y-10 px-[calc(1rem+var(--safe-left))] pr-[calc(1rem+var(--safe-right))]">
        <div className="flex flex-col items-center justify-center px-2 -mt-8">
          <div className="relative group cursor-pointer" onClick={onToggleTheme}>
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-violet-500 rounded-3xl blur-[40px] opacity-40 animate-pulse"></div>
            <div className="relative w-80 h-40 bg-transparent flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
               <img src={LOGO_URL} alt="Flip 7 Logo" className="w-full h-full object-contain drop-shadow-2xl" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-magical-muted uppercase tracking-[0.4em] mt-4 opacity-60">Score Keeper</p>
        </div>

        {hasCompletedGame && leaderboard.length > 0 && (
          <div className="bg-magical-surface/40 backdrop-blur-md rounded-[2.5rem] p-6 shadow-none border-none">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xs font-bold text-magical-muted uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-rounded text-base">trophy</span> Top Players
              </h2>
              <div className="bg-magical-bg p-1 rounded-xl border border-magical-border flex text-[10px] font-bold">
                <button className={`px-3 py-1.5 rounded-lg transition-all ${metric === 'wins' ? 'bg-magical-surface2 text-magical-text shadow-sm' : 'text-magical-muted'}`} onClick={() => setMetric('wins')}>Wins</button>
                <button className={`px-3 py-1.5 rounded-lg transition-all ${metric === 'score' ? 'bg-magical-surface2 text-magical-text shadow-sm' : 'text-magical-muted'}`} onClick={() => setMetric('score')}>Score</button>
              </div>
            </div>
            <div className="flex items-end gap-3 h-44 overflow-x-auto no-scrollbar pb-2 px-1">
              {leaderboard.map((p, idx) => {
                const val = metric === 'wins' ? p.wins : p.score;
                const height = (val / maxVal) * 100;
                const colors = ['bg-pink-400', 'bg-violet-400', 'bg-indigo-400', 'bg-blue-400', 'bg-cyan-400'];
                const isTall = height > 25;
                return (
                  <div key={p.name} className="flex flex-col items-center justify-end h-full min-w-[3.75rem] cursor-default">
                    {!isTall && <div className="text-[10px] font-bold text-magical-accent mb-1">{val}</div>}
                    <div className={`w-full mx-1.5 rounded-t-xl ${colors[idx % colors.length]} opacity-80 group-hover:opacity-100 transition-all flex flex-col items-center justify-start pt-2`} style={{ height: `${Math.max(12, height)}%` }}>
                      {isTall && <div className="text-[10px] font-bold text-white/90 drop-shadow-sm">{val}</div>}
                    </div>
                    <div className="text-[10px] font-bold text-magical-muted mt-2 truncate w-full text-center">{p.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xs font-bold text-magical-muted uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
            <span className="material-symbols-rounded text-base">history</span> History
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="relative flex flex-col items-center justify-center h-40 border-2 border-dashed border-magical-border rounded-[1.5rem] hover:border-magical-accent hover:bg-magical-accent/5 transition-all group overflow-hidden" onClick={onNewGame}>
              <div className="w-14 h-14 rounded-full bg-magical-surface2 flex items-center justify-center shadow-lg mb-3 z-10"><span className="material-symbols-rounded text-2xl text-magical-accent">add</span></div>
              <span className="text-xs font-bold text-magical-muted uppercase tracking-wider z-10">New Game</span>
            </button>
            {games.map(g => {
              const d = new Date(g.id);
              const totals = g.players.map(p => ({ n: p.name, s: p.scores.reduce((acc, val) => acc + (val || 0), 0), icon: p.icon })).sort((a, b) => b.s - a.s);
              const leader = totals[0];
              const isOver = leader.s >= g.targetScore;
              return (
                <LongPressable key={g.id} onLongPress={() => onPromptDelete('game', g.id, `Game on ${d.toLocaleDateString()}`)} onClick={() => onLoadGame(g.id)}>
                  <div className={`bg-magical-surface border rounded-[1.5rem] p-4 flex flex-col justify-between h-40 cursor-pointer relative overflow-hidden group shadow-sm hover:shadow-xl hover:border-magical-accent ${isOver ? 'border-magical-accent/40' : 'border-magical-border'}`}>
                    <div className="flex justify-between items-start z-10"><span className="text-[10px] font-bold text-magical-muted bg-magical-bg px-2 py-1 rounded-lg">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span><span className="text-xs grayscale group-hover:grayscale-0 scale-125">{leader.icon}</span></div>
                    <div className="z-10 mt-2"><div className="flex justify-between items-end mb-2"><span className="text-sm font-bold truncate max-w-[100px]">{leader.n}</span><span className="text-[10px] font-mono text-magical-muted">{leader.s}/{g.targetScore}</span></div><div className="w-full bg-magical-bg h-2.5 rounded-full overflow-hidden border border-magical-border/50"><div className="bg-gradient-to-r from-pink-500 to-violet-500 h-full" style={{ width: `${Math.min(100, (leader.s / g.targetScore) * 100)}%` }}></div></div></div>
                  </div>
                </LongPressable>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
