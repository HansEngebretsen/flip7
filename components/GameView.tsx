
import React, { useState, useMemo } from 'react';
import { Game, Player } from '../types';
import { LOGO_URL, getRandomEmoji } from '../constants';
import LongPressable from './LongPressable';
import SettingsModal from './SettingsModal';

interface GameViewProps {
  game: Game;
  onGoBack: () => void;
  onUpdate: (game: Game) => void;
  onPromptDelete: (type: 'player', id: string, name: string) => void;
}

const GameView: React.FC<GameViewProps> = ({ game, onGoBack, onUpdate, onPromptDelete }) => {
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [focusedCell, setFocusedCell] = useState<{ pId: string; r: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const playerStats = useMemo(() => {
    const meta = game.players.map(p => ({ total: p.scores.reduce((a, b) => a + (b || 0), 0) }));
    const maxScore = Math.max(...meta.map(m => m.total));
    return game.players.map((p, idx) => ({
      ...p,
      total: meta[idx].total,
      played: p.scores.filter(s => s !== null).length,
      scored: p.scores.filter(s => s !== null && s > 0).length,
      isLeader: meta[idx].total === maxScore && meta[idx].total > 0
    }));
  }, [game]);

  const sortPlayersByLeader = (players: Player[]) => [...players].sort((a, b) => {
    const totalA = a.scores.reduce((acc, v) => acc + (v || 0), 0);
    const totalB = b.scores.reduce((acc, v) => acc + (v || 0), 0);
    return totalB - totalA;
  });

  const handleScoreInput = (pId: string, rowIndex: number, value: string) => {
    const val = value === "" ? null : parseInt(value);
    const updatedPlayers = game.players.map(p => {
      if (p.id === pId) {
        const newScores = [...p.scores];
        newScores[rowIndex] = val;
        return { ...p, scores: newScores };
      }
      return p;
    });

    let newRoundCount = game.roundCount;
    if (val !== null && rowIndex === game.roundCount - 1) {
      newRoundCount++;
      updatedPlayers.forEach(p => p.scores.push(null));
    }
    onUpdate({ ...game, players: updatedPlayers, roundCount: newRoundCount });
  };

  const onCellBlur = (rowIndex: number) => {
    setActiveRow(null);
    setFocusedCell(null);
    if (game.reorderEnabled) {
      const isRowComplete = game.players.every(p => p.scores[rowIndex] !== null);
      if (isRowComplete) {
        setTimeout(() => {
          const sorted = sortPlayersByLeader(game.players);
          if (JSON.stringify(sorted.map(p => p.id)) !== JSON.stringify(game.players.map(p => p.id))) {
            onUpdate({ ...game, players: sorted });
          }
        }, 50);
      }
    }
  };

  const date = new Date(game.id);

  return (
    <div className="flex flex-col h-full z-10 transition-opacity duration-300">
      <header className="bg-magical-bg/95 backdrop-blur-xl border-b border-magical-border shrink-0 z-50 shadow-sm relative overflow-visible pt-[var(--safe-top)]">
        <div className="flex items-center justify-between px-3 h-14">
          <div className="flex items-center gap-1 z-10">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-magical-surface transition-colors active:scale-90 text-magical-muted" onClick={onGoBack}>
              <span className="material-symbols-rounded text-2xl">arrow_back_ios_new</span>
            </button>
            <span className="text-[0.65rem] text-magical-muted font-mono font-bold uppercase tracking-tight whitespace-nowrap pt-1 opacity-80">
              {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="absolute left-1/2 top-[var(--safe-top)] transform -translate-x-1/2 h-14 flex items-start pt-1 overflow-visible pointer-events-none">
            <div className="relative h-14 w-auto overflow-visible">
              <img src={LOGO_URL} alt="Flip 7" className="h-[4.5rem] w-auto object-contain drop-shadow-xl" />
            </div>
          </div>
          <div className="flex items-center gap-1 z-10">
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-magical-muted" onClick={() => setShowSettings(true)}>
              <span className="material-symbols-rounded text-xl">tune</span>
            </button>
            <button className="h-9 px-3 rounded-full bg-magical-surface text-magical-text border border-magical-border font-bold text-xs shadow-lg flex items-center gap-1" onClick={() => onUpdate({ ...game, players: [...game.players, { id: `p${Date.now()}`, name: `P${game.players.length + 1}`, icon: getRandomEmoji(), scores: new Array(game.roundCount).fill(null) }] })}>
              <span className="material-symbols-rounded text-base text-magical-accent">person_add</span> Add
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden w-full pb-[var(--safe-bottom)]">
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '3.5rem repeat(var(--player-count), minmax(6rem, 1fr))', 
            gridTemplateRows: 'var(--header-height)', 
            gridAutoRows: 'var(--row-height)', 
            overflowX: 'auto', 
            overflowY: 'auto', 
            height: '100%', 
            '--player-count': game.players.length 
          } as any} 
          className="no-scrollbar px-[var(--safe-left)] pr-[var(--safe-right)]"
        >
          {/* Top Left Sticky Corner */}
          <div className="sticky top-0 left-0 z-50 border-b border-r-2 border-magical-border bg-magical-bg flex items-center justify-center h-[var(--header-height)]">
            <span className="text-xs font-mono text-magical-muted font-bold">#</span>
          </div>

          {/* Sticky Header Row */}
          {playerStats.map(p => {
             const rem = game.targetScore - p.total;
             return (
               <div key={p.id} className={`sticky top-0 z-40 border-b border-r border-magical-border h-[var(--header-height)] p-1.5 transition-all duration-300 ${p.isLeader ? 'is-leader-header-alt' : 'bg-magical-bg'}`}>
                 <LongPressable onLongPress={() => onPromptDelete('player', p.id, p.name)}>
                    <div className="flex flex-col justify-between h-full py-1.5 relative overflow-hidden group">
                      {p.isLeader && <div className="absolute -top-6 -right-6 w-12 h-12 bg-yellow-400/20 rounded-full blur-lg animate-pulse"></div>}
                      <div className="flex flex-col items-start gap-1 cursor-pointer z-10 pl-1" onClick={() => onUpdate({ ...game, players: game.players.map(pl => pl.id === p.id ? { ...pl, icon: getRandomEmoji() } : pl) })}>
                        <div className="text-2xl sm:text-3xl emoji-font leading-none group-hover:scale-110 transition-transform origin-left drop-shadow-sm">{p.icon}</div>
                        <input 
                          className={`bg-transparent w-full min-w-0 font-bold text-base sm:text-lg lg:text-xl text-magical-muted focus:text-magical-text outline-none p-0 text-left truncate tracking-tight transition-colors ${p.isLeader ? 'text-magical-accent' : ''}`} 
                          value={p.name} 
                          onChange={(e) => onUpdate({ ...game, players: game.players.map(pl => pl.id === p.id ? { ...pl, name: e.target.value } : pl) })} 
                          onFocus={(e) => e.target.select()} 
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="text-center z-10"><div className={`text-4xl font-bold tracking-tighter ${p.isLeader ? 'text-magical-accent' : 'text-magical-text'}`}>{p.total}</div></div>
                      <div className="text-center z-10 px-1"><div className={`text-[0.55rem] font-bold font-mono tracking-tighter whitespace-nowrap uppercase overflow-hidden ${rem <= 0 ? 'text-magical-accent animate-pulse' : 'text-magical-muted'}`}>{rem <= 0 ? 'WINNER!' : `${p.scored}/${p.played} | ${rem} LEFT`}</div></div>
                    </div>
                 </LongPressable>
               </div>
             );
          })}

          {/* Grid Body */}
          {Array.from({ length: game.roundCount }).map((_, r) => (
            <React.Fragment key={r}>
              {/* Sticky Column 1 (Round Numbers) */}
              <div className={`sticky left-0 z-30 border-r-2 border-b border-magical-border bg-magical-bg flex items-center justify-center font-bold font-mono text-xs ${activeRow === r ? 'text-magical-accent' : 'text-magical-muted'}`}>
                {r + 1}
              </div>
              {/* Score Cells */}
              {game.players.map(p => {
                const isFocused = focusedCell?.pId === p.id && focusedCell?.r === r;
                return (
                  <div key={`${p.id}-${r}`} className={`border-r border-b border-magical-border h-[var(--row-height)] transition-all ${isFocused ? 'bg-magical-surface/80 ring-2 ring-inset ring-magical-accent z-10' : ''} ${activeRow === r && !isFocused ? 'bg-magical-surface/40' : 'bg-transparent'}`}>
                    <input 
                      type="number" 
                      inputMode="numeric" 
                      className={`w-full h-full bg-transparent text-center font-mono font-bold text-lg outline-none border-none focus:ring-0 transition-opacity ${p.scores[r] === 0 ? 'opacity-30' : ''}`} 
                      value={p.scores[r] ?? ''} 
                      placeholder="-" 
                      onFocus={() => { setActiveRow(r); setFocusedCell({ pId: p.id, r }); }} 
                      onBlur={() => onCellBlur(r)} 
                      onChange={(e) => handleScoreInput(p.id, r, e.target.value)} 
                    />
                  </div>
                );
              })}
            </React.Fragment>
          ))}
          <div style={{ gridColumn: '1 / -1', height: '12rem' }}></div>
        </div>
      </main>
      
      {showSettings && (
        <SettingsModal 
          targetScore={game.targetScore} 
          reorderEnabled={game.reorderEnabled ?? true} 
          onSave={(targetScore, reorderEnabled) => { 
            onUpdate({ ...game, targetScore, reorderEnabled, players: reorderEnabled ? sortPlayersByLeader(game.players) : game.players }); 
            setShowSettings(false); 
          }} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      <style>{`
        .is-leader-header-alt {
            background-color: var(--bg-surface) !important;
            background-image: linear-gradient(180deg, rgba(244, 114, 182, 0.2) 0%, rgba(244, 114, 182, 0.08) 100%) !important;
            border-bottom-color: var(--border) !important;
        }
        .dark .is-leader-header-alt { 
          background-image: linear-gradient(180deg, rgba(244, 114, 182, 0.15) 0%, rgba(244, 114, 182, 0.05) 100%) !important; 
        }
        .is-leader-header-alt input { color: var(--accent) !important; }
      `}</style>
    </div>
  );
};

export default GameView;
