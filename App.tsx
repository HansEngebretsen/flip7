
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Game, Player, LeaderboardMetric } from './types';
import { DB_KEY, getRandomEmoji } from './constants';
import Dashboard from './components/Dashboard';
import GameView from './components/GameView';
import DeleteModal from './components/DeleteModal';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { reorderEnabled: true, ...parsed };
      } catch (e) { console.error("Error loading state", e); }
    }
    return {
      view: 'dashboard',
      activeGameId: null,
      leaderboardMetric: 'wins',
      theme: 'dark',
      games: [],
      reorderEnabled: true
    };
  });

  const [deleteContext, setDeleteContext] = useState<{ type: 'game' | 'player' | null; id: string | number | null; name: string }>({
    type: null, id: null, name: ''
  });

  // 1. Sync Theme Color and Color Scheme with the browser chrome
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
    document.documentElement.style.colorScheme = state.theme;
    
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      // Fuchsia 50 for light, Violet 950 for dark
      themeColorMeta.setAttribute('content', state.theme === 'dark' ? '#2e1065' : '#fdf4ff');
    }
  }, [state.theme]);

  // 2. Safari Viewport and Keyboard Fixes
  useEffect(() => {
    const vv = window.visualViewport;
    
    const handleViewportChange = () => {
      if (vv) {
        document.documentElement.style.setProperty('--app-height', `${vv.height}px`);
        // If Safari has scrolled the layout viewport (e.g. keyboard open), try to keep it at 0,0
        if (window.scrollY !== 0) {
          window.scrollTo(0, 0);
        }
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        // Force the layout viewport back to the top when keyboard starts closing.
        // A slightly longer timeout (100ms) ensures Safari has processed the keyboard dismissal.
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
          handleViewportChange();
        }, 100);
      }
    };

    vv?.addEventListener('resize', handleViewportChange);
    vv?.addEventListener('scroll', handleViewportChange);
    document.addEventListener('focusout', handleFocusOut);

    handleViewportChange();

    return () => {
      vv?.removeEventListener('resize', handleViewportChange);
      vv?.removeEventListener('scroll', handleViewportChange);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  useEffect(() => { localStorage.setItem(DB_KEY, JSON.stringify(state)); }, [state]);

  const toggleTheme = useCallback(() => {
    setState(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const setMetric = useCallback((metric: LeaderboardMetric) => {
    setState(prev => ({ ...prev, leaderboardMetric: metric }));
  }, []);

  const createNewGame = useCallback(() => {
    const lastGame = state.games[0];
    let newPlayers: Player[] = [];

    if (lastGame) {
      newPlayers = lastGame.players.map((p, idx) => ({
        id: `p${Date.now()}${idx}`,
        name: p.name,
        icon: p.icon,
        scores: [null]
      }));
    } else {
      newPlayers = [
        { id: `p${Date.now()}1`, name: "P1", icon: getRandomEmoji(), scores: [null] },
        { id: `p${Date.now()}2`, name: "P2", icon: getRandomEmoji(), scores: [null] },
        { id: `p${Date.now()}3`, name: "P3", icon: getRandomEmoji(), scores: [null] },
        { id: `p${Date.now()}4`, name: "P4", icon: getRandomEmoji(), scores: [null] }
      ];
    }

    const newGame: Game = {
      id: Date.now(),
      targetScore: lastGame ? lastGame.targetScore : 200,
      roundCount: 1,
      players: newPlayers,
      reorderEnabled: state.reorderEnabled
    };

    setState(prev => ({
      ...prev,
      games: [newGame, ...prev.games],
      activeGameId: newGame.id,
      view: 'game'
    }));
  }, [state.games, state.reorderEnabled]);

  const loadGame = useCallback((id: number) => {
    setState(prev => ({ ...prev, activeGameId: id, view: 'game' }));
  }, []);

  const goToDashboard = useCallback(() => {
    setState(prev => ({ ...prev, view: 'dashboard', activeGameId: null }));
  }, []);

  const updateGameState = useCallback((updatedGame: Game) => {
    setState(prev => ({
      ...prev,
      games: prev.games.map(g => g.id === updatedGame.id ? updatedGame : g)
    }));
  }, []);

  const promptDelete = useCallback((type: 'game' | 'player', id: string | number, name: string) => {
    setDeleteContext({ type, id, name });
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteContext.type === 'game') {
      setState(prev => ({
        ...prev,
        games: prev.games.filter(g => g.id !== deleteContext.id),
        view: prev.activeGameId === deleteContext.id ? 'dashboard' : prev.view,
        activeGameId: prev.activeGameId === deleteContext.id ? null : prev.activeGameId
      }));
    } else if (deleteContext.type === 'player') {
      setState(prev => {
        const activeGame = prev.games.find(g => g.id === prev.activeGameId);
        if (activeGame && activeGame.players.length > 1) {
          const updatedPlayers = activeGame.players.filter(p => p.id !== deleteContext.id);
          const updatedGame = { ...activeGame, players: updatedPlayers };
          return { ...prev, games: prev.games.map(g => g.id === updatedGame.id ? updatedGame : g) };
        }
        return prev;
      });
    }
    setDeleteContext({ type: null, id: null, name: '' });
  }, [deleteContext]);

  const activeGame = state.games.find(g => g.id === state.activeGameId);

  return (
    <div id="root">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }}></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-4s' }}></div>
      </div>

      {state.view === 'dashboard' ? (
        <Dashboard 
          games={state.games} metric={state.leaderboardMetric} setMetric={setMetric} onNewGame={createNewGame} 
          onLoadGame={loadGame} onPromptDelete={promptDelete} theme={state.theme} onToggleTheme={toggleTheme} 
        />
      ) : activeGame ? (
        <GameView game={activeGame} onGoBack={goToDashboard} onUpdate={updateGameState} onPromptDelete={promptDelete} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
            <button onClick={goToDashboard} className="p-4 bg-magical-accent text-white rounded-xl">Back to Dashboard</button>
        </div>
      )}

      {deleteContext.type && (
        <DeleteModal type={deleteContext.type} name={deleteContext.name} onConfirm={confirmDelete} onCancel={() => setDeleteContext({ type: null, id: null, name: '' })} />
      )}
    </div>
  );
};

export default App;
