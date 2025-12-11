import { useState, useEffect } from 'react'
import PlayerTable from './components/PlayerTable'
import TeamFormation from './components/TeamFormation'
import PredictedPointsTable from './components/PredictedPointsTable'

function App() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-full mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          FPL AI Companion
        </h1>
        
        {/* Two-column layout: side by side on large screens, stacked on small screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Left Box: My Team Formation */}
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col w-full max-h-[calc(100vh-8rem)]">
            <div className="flex-1 min-h-0 overflow-auto">
              <TeamFormation allPlayers={players} teams={teams} />
            </div>
          </div>

          {/* Right Box: Player Stats Table */}
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col w-full max-h-[calc(100vh-8rem)]">
            <div className="flex-1 min-h-0 overflow-auto">
              <PlayerTable players={players} teams={teams} />
            </div>
          </div>
        </div>

        {/* Predicted Points Section - Full Width Below */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <PredictedPointsTable />
        </div>
      </div>
    </div>
  )
}

export default App
