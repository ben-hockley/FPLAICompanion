import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import MyTeam from './pages/MyTeam'
import PlayerStats from './pages/PlayerStats'
import Fixtures from './pages/Fixtures'
import News from './pages/News'
import Articles from './pages/Articles'
import PredictedPoints from './pages/PredictedPoints'
import LeagueTable from './pages/LeagueTable'
import PlayerModal from './components/PlayerModal'
import TeamModal from './components/TeamModal'

function App() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myTeamPlayerIds, setMyTeamPlayerIds] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    fetchFPLData();
  }, []);

  const fetchFPLData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bootstrap-static/');
      
      if (!response.ok) {
        throw new Error(`FPL API returned ${response.status}`);
      }

      const data = await response.json();
      
      // Create team map
      const teamMap = {};
      data.teams.forEach(team => {
        teamMap[team.id] = team.name;
      });
      
      setTeams(teamMap);
      setPlayers(data.elements);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleTeamLoaded = (playerIds) => {
    setMyTeamPlayerIds(playerIds);
  };

  const handlePlayerClick = (player) => {
    setSelectedTeam(null); // Close team modal if open
    setSelectedPlayer(player);
  };

  const handleTeamClick = (teamId) => {
    setSelectedPlayer(null); // Close player modal if open
    setSelectedTeam(teamId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading FPL data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={fetchFPLData}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Sidebar />
        <Navbar />
        
        {/* Main content area with left margin for sidebar and top padding for navbar */}
        <div className="ml-24 pt-16">
          <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route 
            path="/home" 
            element={
              <Home
                players={players}
                teams={teams}
                onPlayerClick={handlePlayerClick}
                onTeamClick={handleTeamClick}
              />
            } 
          />
          <Route 
            path="/my-team" 
            element={
              <MyTeam
                players={players}
                teams={teams}
                myTeamPlayerIds={myTeamPlayerIds}
                onTeamLoaded={handleTeamLoaded}
                onTeamClick={handleTeamClick}
              />
            } 
          />
          <Route 
            path="/player-stats" 
            element={
              <PlayerStats
                players={players}
                teams={teams}
                myTeamPlayerIds={myTeamPlayerIds}
                onTeamClick={handleTeamClick}
              />
            } 
          />
          <Route 
            path="/fixtures/:gameweek" 
            element={
              <Fixtures
                teams={teams}
                allPlayers={players}
                onPlayerClick={handlePlayerClick}
                onTeamClick={handleTeamClick}
              />
            } 
          />
          <Route 
            path="/fixtures" 
            element={
              <Fixtures
                teams={teams}
                allPlayers={players}
                onPlayerClick={handlePlayerClick}
                onTeamClick={handleTeamClick}
              />
            }
          />
          <Route 
            path="/news/:news_id" 
            element={<News />}
          />
          <Route 
            path="/articles" 
            element={<Articles />}
          />
          <Route 
            path="/predicted-points" 
            element={
              <PredictedPoints 
                myTeamPlayerIds={myTeamPlayerIds}
                onTeamClick={handleTeamClick}
              />
            } 
          />
          <Route 
            path="/league-table" 
            element={
              <LeagueTable 
                teams={teams}
                onTeamClick={handleTeamClick}
              />
            } 
          />
        </Routes>
        </div>
        
        {/* Player Modal */}
        {selectedPlayer && (
          <PlayerModal
            player={selectedPlayer}
            teams={teams}
            players={players}
            onClose={() => setSelectedPlayer(null)}
            onTeamClick={handleTeamClick}
          />
        )}
        
        {/* Team Modal */}
        {selectedTeam && (
          <TeamModal
            teamId={selectedTeam}
            teamName={teams[selectedTeam]}
            allPlayers={players}
            onClose={() => setSelectedTeam(null)}
            onPlayerClick={handlePlayerClick}
            onTeamClick={handleTeamClick}
          />
        )}
      </div>
    </Router>
  )
}

export default App
