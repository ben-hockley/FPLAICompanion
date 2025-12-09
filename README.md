# FPL AI Companion

A React application that displays Fantasy Premier League player data in an interactive, sortable table.

## Features

- **Live FPL Data**: Fetches real-time player statistics from the official FPL API
- **Sortable Columns**: Click any column header to sort ascending/descending
- **Scrollable Table**: Fixed header with scrollable body for easy navigation
- **Responsive Design**: Clean, modern UI built with Tailwind CSS
- **Loading & Error States**: Proper handling for data fetching states
- **Color-Coded Positions**: Visual indicators for GK, DEF, MID, FWD

## Player Stats Displayed

- Player Name
- Team
- Position (GK/DEF/MID/FWD)
- Price (£)
- Total Points
- Points per Game
- Form
- Selected by % of managers

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Building for Production

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **FPL API** - Data source

## Project Structure

```
FPLAICompanion/
├── src/
│   ├── components/
│   │   └── PlayerTable.jsx    # Main table component
│   ├── App.jsx                 # Root component
│   ├── main.jsx                # Entry point
│   └── index.css               # Tailwind imports
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## API Reference

This application uses the official Fantasy Premier League API:
- Endpoint: `https://fantasy.premierleague.com/api/bootstrap-static/`
- Returns: Player data, team data, and game statistics

## License

MIT
