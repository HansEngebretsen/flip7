
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Game, Player, LeaderboardMetric, GameType } from './types';
import { DB_KEY, getRandomEmoji } from './constants';
import Dashboard from './components/Dashboard';
import GameView from './components/GameView';
import DeleteModal from './components/DeleteModal';
import GameSelectionModal from './components/GameSelectionModal';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(DB_KEY);
    const hash = window.location.hash;
    
    // Hash Routing Parsing
    let initialView: 'dashboard' | 'game' = 'dashboard';
    let initialGameType: GameType = 'flip7';
    let initialGameId: number | null = null;
    let initialShowSelector = false;

    if (hash === '#/13') {
        initialGameType = 'thirteen';
    } else if (hash === '#/flip7') {
        initialGameType = 'flip7';
    } else if (hash.startsWith('#/game')) {
        const urlParams = new URLSearchParams(hash.split('?')[1]);
        const gameIdParam = urlParams.get('id');
        if (gameIdParam) {
            initialView = 'game';
            initialGameId = parseInt(gameIdParam);
        } else {
            // Invalid game hash, fallback
            initialShowSelector = true;
        }
    } else {
        // Root or unknown hash
        initialShowSelector = true;
    }

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const games = (parsed.games || []).map((g: any) => ({
           ...g,
           type: g.type || 'flip7',
           targetScore: g.targetScore !== undefined ? g.targetScore : 200
        }));
        
        // If loading a game directly, find its type
        if (initialView === 'game' && initialGameId) {
            const game = games.find((g: Game) => g.id === initialGameId);
            if (game) {
                initialGameType = game.type;
            } else {
                // Game not found, redirect to dashboard
                initialView = 'dashboard';
                initialGameId = null;
                window.location.hash = '#/';
                initialShowSelector = true;
            }
        }

        return { 
          leaderboardMetric: 'wins',
          theme: 'dark',
          reorderEnabled: true,
          ...parsed,
          view: initialView,
          activeGameId: initialGameId,
          activeGameType: initialGameType,
          games
        };
      } catch (e) { console.error("Error loading state", e); }
    }
    
    return {
      view: initialView,
      activeGameId: initialGameId,
      leaderboardMetric: 'wins',
      theme: 'dark',
      games: [],
      reorderEnabled: true,
      activeGameType: initialGameType
    };
  });

  const [deleteContext, setDeleteContext] = useState<{ type: 'game' | 'player' | null; id: string | number | null; name: string }>({
    type: null, id: null, name: ''
  });

  const [showGameSelector, setShowGameSelector] = useState(() => {
      // Show selector if hash is empty or just #/
      return window.location.hash === '' || window.location.hash === '#/';
  });

  // Handle Hash Navigation
  useEffect(() => {
      const handleHashChange = () => {
          const hash = window.location.hash;
          
          if (hash.startsWith('#/game')) {
              const urlParams = new URLSearchParams(hash.split('?')[1]);
              const gameIdParam = urlParams.get('id');
              if (gameIdParam) {
                  const id = parseInt(gameIdParam);
                  const game = state.games.find(g => g.id === id);
                  if (game) {
                      setState(prev => ({ ...prev, view: 'game', activeGameId: id, activeGameType: game.type }));
                      setShowGameSelector(false);
                  } else {
                      // Game not found
                      window.location.hash = '#/';
                  }
              }
          } else if (hash === '#/13') {
              setState(prev => ({ ...prev, view: 'dashboard', activeGameId: null, activeGameType: 'thirteen' }));
              setShowGameSelector(false);
          } else if (hash === '#/flip7') {
              setState(prev => ({ ...prev, view: 'dashboard', activeGameId: null, activeGameType: 'flip7' }));
              setShowGameSelector(false);
          } else {
              // Root or Selector
              setState(prev => ({ ...prev, view: 'dashboard', activeGameId: null, activeGameType: 'flip7' })); // Default underlying type
              setShowGameSelector(true);
          }
      };
      
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
  }, [state.games]);

  useEffect(() => {
    const isThirteen = state.activeGameType === 'thirteen';
    document.documentElement.classList.toggle('thirteen-mode', isThirteen);
    
    if (isThirteen) {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) themeColorMeta.setAttribute('content', '#f1e7ca');
    } else {
        document.documentElement.classList.toggle('dark', state.theme === 'dark');
        document.documentElement.style.colorScheme = state.theme;
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
          themeColorMeta.setAttribute('content', state.theme === 'dark' ? '#2e1065' : '#fdf4ff');
        }
    }
  }, [state.theme, state.activeGameType]);

  useEffect(() => { localStorage.setItem(DB_KEY, JSON.stringify(state)); }, [state]);

  const toggleTheme = useCallback(() => {
    setState(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const switchGameType = useCallback((type: GameType) => {
    setState(prev => ({ ...prev, activeGameType: type }));
    setShowGameSelector(false);
    
    const hash = type === 'thirteen' ? '#/13' : '#/flip7';
    window.location.hash = hash;
  }, []);

  const setMetric = useCallback((metric: LeaderboardMetric) => {
    setState(prev => ({ ...prev, leaderboardMetric: metric }));
  }, []);

  const createNewGame = useCallback(() => {
    const lastGame = state.games.find(g => g.type === state.activeGameType);
    let newPlayers: Player[] = [];
    const isThirteen = state.activeGameType === 'thirteen';

    if (lastGame) {
      newPlayers = lastGame.players.map((p, idx) => ({
        id: `p${Date.now()}${idx}`,
        name: p.name,
        icon: p.icon,
        scores: isThirteen ? new Array(13).fill(null) : [null]
      }));
    } else {
      newPlayers = [
        { id: `p${Date.now()}1`, name: "P1", icon: getRandomEmoji(), scores: isThirteen ? new Array(13).fill(null) : [null] },
        { id: `p${Date.now()}2`, name: "P2", icon: getRandomEmoji(), scores: isThirteen ? new Array(13).fill(null) : [null] },
        { id: `p${Date.now()}3`, name: "P3", icon: getRandomEmoji(), scores: isThirteen ? new Array(13).fill(null) : [null] },
        { id: `p${Date.now()}4`, name: "P4", icon: getRandomEmoji(), scores: isThirteen ? new Array(13).fill(null) : [null] }
      ];
    }

    const newGame: Game = {
      id: Date.now(),
      type: state.activeGameType,
      targetScore: isThirteen ? null : (lastGame ? lastGame.targetScore : 200),
      roundCount: isThirteen ? 13 : 1,
      players: newPlayers,
      reorderEnabled: state.reorderEnabled
    };

    setState(prev => ({
      ...prev,
      games: [newGame, ...prev.games],
      activeGameId: newGame.id,
      view: 'game'
    }));
    
    window.location.hash = `#/game?id=${newGame.id}`;
  }, [state.games, state.reorderEnabled, state.activeGameType]);

  const loadGame = useCallback((id: number) => {
    // Find game to determine type
    const game = state.games.find(g => g.id === id);
    if (game) {
        setState(prev => ({ ...prev, activeGameId: id, view: 'game', activeGameType: game.type }));
        window.location.hash = `#/game?id=${id}`;
    }
  }, [state.games]);

  const goToDashboard = useCallback(() => {
    setState(prev => ({ ...prev, view: 'dashboard', activeGameId: null }));
    const hash = state.activeGameType === 'thirteen' ? '#/13' : '#/flip7';
    window.location.hash = hash;
  }, [state.activeGameType]);

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
      setState(prev => {
          const nextState = {
            ...prev,
            games: prev.games.filter(g => g.id !== deleteContext.id),
            view: prev.activeGameId === deleteContext.id ? 'dashboard' : prev.view,
            activeGameId: prev.activeGameId === deleteContext.id ? null : prev.activeGameId
          };
          if (prev.activeGameId === deleteContext.id) {
              const hash = prev.activeGameType === 'thirteen' ? '#/13' : '#/flip7';
              window.location.hash = hash;
          }
          return nextState;
      });
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
  const displayedGames = state.games.filter(g => g.type === state.activeGameType);

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {state.activeGameType !== 'thirteen' && (
          <>
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
            <div className="absolute top-1/2 right-0 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }}></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-4s' }}></div>
          </>
        )}
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        {state.view === 'dashboard' ? (
          <Dashboard 
            key={state.activeGameType}
            games={displayedGames} 
            activeGameType={state.activeGameType}
            metric={state.leaderboardMetric} 
            setMetric={setMetric} 
            onNewGame={createNewGame} 
            onLoadGame={loadGame} 
            onPromptDelete={promptDelete} 
            theme={state.theme} 
            onToggleTheme={toggleTheme}
            onLogoClick={() => setShowGameSelector(true)}
          />
        ) : activeGame ? (
          <GameView game={activeGame} onGoBack={goToDashboard} onUpdate={updateGameState} onPromptDelete={promptDelete} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-12">
              <button onClick={goToDashboard} className="px-8 py-4 bg-magical-accent text-white rounded-2xl font-bold shadow-xl">Back to Dashboard</button>
          </div>
        )}
      </div>

      {deleteContext.type && (
        <DeleteModal type={deleteContext.type} name={deleteContext.name} onConfirm={confirmDelete} onCancel={() => setDeleteContext({ type: null, id: null, name: '' })} />
      )}

      {showGameSelector && (
        <GameSelectionModal activeType={state.activeGameType} onSelect={switchGameType} onClose={() => setShowGameSelector(false)} />
      )}
    </div>
  );
};

export default App;
