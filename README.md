# FPL AI Companion

A React + Vite app that displays Fantasy Premier League player data in an interactive, sortable table and provides detailed player modals.

## Features

- **Live FPL Data**: Fetches real-time player statistics from the official FPL API via a dev proxy.
- **Sortable Columns**: Click any column header to sort ascending/descending.
- **Scrollable Table**: Fixed header with scrollable body for easy navigation.
- **Clickable Rows & Player Modal**: Click a player row to open a detailed modal with season stats, match history, and a recent form chart.
- **Responsive UI**: Built with Tailwind CSS, responsive and mobile-friendly.
- **Loading & Error States**: Shows loading spinners and retry options for both the main list and modal details.

## What the Modal Shows

- **Header**: Player photo, full name, team, position, price, total points, and ICT index.
- **Season Stats**: Form, points/game, minutes, bonus, goals, assists, clean sheets, goals conceded.
- **Match History**: Scrollable table with Gameweek, Opponent (H/A), Points, Minutes, Goals, Assists, Clean Sheets, Bonus.
- **Recent Form Chart**: Line chart for the last 5 games (uses `recharts`).

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:

```powershell
npm install
```

### Development Server

Start the dev server:

```powershell
npm run dev
```

Open `http://localhost:5173/` in your browser.

Note: The app uses a Vite dev proxy so client requests to `/api/*` are forwarded to `https://fantasy.premierleague.com`. This avoids CORS during development. If you change `vite.config.js`, restart the dev server.

### Build & Preview

```powershell
npm run build
npm run preview
```

## Dependencies & Libraries

- **React 18**
- **Vite**
- **Tailwind CSS**
- **Recharts** — used for the recent form chart inside the player modal

## Project Structure (important files)

```
FPLAICompanion/
├── src/
│   ├── components/
│   │   ├── PlayerTable.jsx    # Main table component (sortable, clickable rows)
│   │   └── PlayerModal.jsx    # Modal that fetches and shows detailed player data
+│   ├── App.jsx                # Root component
│   ├── main.jsx               # Entry point
│   └── index.css              # Tailwind imports + small custom animations
├── index.html
├── package.json
├── vite.config.js             # Includes `/api` dev proxy to FPL API
└── tailwind.config.js
```

## API Endpoints Used

- Bootstrap data (players & teams): `/api/bootstrap-static/` (proxied to `https://fantasy.premierleague.com/api/bootstrap-static/`)
- Player details (history): `/api/element-summary/{element_id}/` (proxied)

## Usage

- Click any row in the players table to open a modal with detailed stats and match history.
- Close modal with the X button, by clicking outside the modal, or pressing `Escape`.

## Troubleshooting

- If the table shows "Failed to fetch" in the browser console, ensure you restarted the dev server after edits to `vite.config.js`.
- If charts don't render, ensure `recharts` is installed: `npm install recharts`.

## License

MIT
