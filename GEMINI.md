# Flip 7 Tracker - Gemini Context

## App Purpose
"Flip 7 Tracker" is a whimsical, polished score-keeping application designed specifically for the "Flip 7" card game. It replaces pen and paper with a beautiful, interactive digital experience that tracks player scores round-by-round, calculates totals, identifies leaders, and declares winners based on a customizable target score. It emphasizes visual delight, smooth interactions, and ease of use on mobile devices.

## App Structure
The application is built with **React**, **TypeScript**, and **Vite**. It uses a flat component structure with a central state manager.

### Core Components
- **`App.tsx`**: The root orchestrator.
  - Manages global state: `games`, `activeGameId`, `theme` (light/dark), `view` (dashboard/game).
  - Handles persistence via `localStorage`.
  - Implements global actions: Create Game, Delete Game/Player, Toggle Theme.
- **`components/Dashboard.tsx`**: The landing view.
  - **Leaderboard**: Visual bar chart showing top players by Wins or Total Score.
  - **History**: Grid of past game cards. Each card displays the date, the winner (large emoji), and a progress bar.
- **`components/GameView.tsx`**: The active game interface.
  - **Grid Layout**: Dynamic CSS Grid allowing for horizontal scrolling of players and vertical scrolling of rounds.
  - **Sticky Headers**: Player headers and Round numbers stick to top/left for usability on small screens.
  - **Live Sorting**: Players can automatically reorder based on score (optional).
  - **Game Logic**: Tracks scores, detects winners (target score reached), adds rounds automatically.
- **`components/SettingsModal.tsx`**: Configuration for a specific game (Target Score, Auto-reorder).
- **`components/DeleteModal.tsx`**: A confirmation dialog for destructive actions, featuring whimsical copy ("Poof! Gone forever?").

### Data Model (`types.ts`)
- **Game**: `id` (timestamp), `targetScore`, `players` (array), `roundCount`, `reorderEnabled`.
- **Player**: `id`, `name`, `icon` (emoji), `scores` (array of numbers/null).

## Development Guidance & Principles

### Styling & Theming
The app relies heavily on **modern CSS** and **Tailwind CSS**, utilizing a custom "Magical" theme system backed by CSS variables.

**Design Tokens (CSS Variables in `index.html`):**
These tokens abstract the color palette, allowing for instant, smooth theme switching (Light/Dark).
- `--bg-app`: Main background.
- `--bg-surface`: Card/Header background.
- `--bg-surface-2`: Secondary surface (buttons, highlights).
- `--border`: Border color.
- `--text-main`: Primary text.
- `--text-muted`: Secondary text/icons.
- `--accent`: Primary action color (Pink/Purple variations).

**Tailwind Configuration:**
Mapped in `index.html` to the variables above:
- `bg-magical-bg`, `bg-magical-surface`, `text-magical-text`, `text-magical-accent`, etc.

### Core Principles
1.  **Experience First**: Do not modify user flows or functionality unless explicitly requested. Every animation and interaction is intentional.
2.  **CSS Over JS**: Use CSS for layout, theming, and animations whenever possible.
    - Use `sticky` positioning for headers.
    - Use CSS Grid for the score table.
    - Use CSS transitions for hover states, theme switches, and layout changes.
3.  **60fps Rendering**:
    - Avoid heavy JS calculations during scroll/render.
    - Use `transform` and `opacity` for animations (e.g., `.pop-in`, `.fade-in`, `.animate-float`).
    - Debounce heavy updates if necessary (currently handled via React state batching).
4.  **Simplicity**:
    - No external state libraries (Redux/Zustand) needed; React Context/State is sufficient.
    - No complex routing; simple conditional rendering (`view === 'dashboard'`).
5.  **Mobile Optimization**:
    - Respect Safe Area Insets (`var(--safe-top)`, etc.).
    - Touch-friendly tap targets (min 44px).
    - `inputMode="numeric"` for score entry.

### Animation & Motion
- **Transitions**: Global `transition: background-color 0.5s ease` for theme switching.
- **Keyframes**:
  - `float`: Gentle background blob movement.
  - `bounce-sm`: Subtle feedback on button clicks.
  - `fade-in`: Content entry.
  - `pop-in`: Modal entry.

### Future Changes
When modifying the app, maintain the "Magical" naming convention and ensure all new UI elements support both Light and Dark modes via the defined tokens. Prefer extending the existing CSS variables over introducing hardcoded values.
