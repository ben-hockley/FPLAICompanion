import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatusIcon from './StatusIcon';

const PlayerModal = ({ player, teams, onClose }) => {
  const [playerDetails, setPlayerDetails] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const POSITION_MAP = {
    1: 'Goalkeeper',
    2: 'Defender',
    3: 'Midfielder',
    4: 'Forward'
  };

  useEffect(() => {
    // Close modal on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    fetchPlayerDetails();
  }, [player.id]);

  const fetchPlayerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch player details
      const detailsResponse = await fetch(`/api/element-summary/${player.id}/`);
      if (!detailsResponse.ok) {
        throw new Error(`Failed to fetch player details (${detailsResponse.status})`);
      }
      const detailsData = await detailsResponse.json();
      
      // Fetch all fixtures
      const fixturesResponse = await fetch('/api/fixtures/');
      let fixturesData = [];
      if (fixturesResponse.ok) {
        fixturesData = await fixturesResponse.json();
      }
      
      // Get upcoming fixtures for this player's team
      const upcomingFixtures = fixturesData
        .filter(f => !f.finished && (f.team_h === player.team || f.team_a === player.team))
        .slice(0, 5)
        .map(fixture => {
          const isHome = fixture.team_h === player.team;
          const opponentId = isHome ? fixture.team_a : fixture.team_h;
          const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
          return {
            opponent: teams[opponentId] || 'TBD',
            isHome,
            difficulty,
            gameweek: fixture.event
          };
        });
      
      setPlayerDetails(detailsData);
      setFixtures(upcomingFixtures);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getPhotoUrl = (code) => {
    return `https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`;
  };

  const getOpponentName = (opponentTeam, wasHome) => {
    const teamName = teams[opponentTeam] || 'Unknown';
    return wasHome ? `${teamName} (H)` : `${teamName} (A)`;
  };

  const getFormChartData = () => {
    if (!playerDetails || !playerDetails.history) return [];
    
    // Get last 5 games
    const last5 = playerDetails.history.slice(-5);
    return last5.map((match) => ({
      gw: `GW${match.round}`,
      points: match.total_points,
      opponent: teams[match.opponent_team]
    }));
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Error</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
            <button 
              onClick={fetchPlayerDetails}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formChartData = getFormChartData();

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 text-3xl leading-none font-light"
            aria-label="Close modal"
          >
            ×
          </button>
          
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <img 
                src={getPhotoUrl(player.code)} 
                alt={`${player.first_name} ${player.second_name}`}
                className="w-28 h-36 object-cover rounded-lg border-4 border-white shadow-lg bg-gray-100"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 140"%3E%3Crect fill="%23e5e7eb" width="110" height="140"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="16"%3ENo Photo%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
            
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                {player.first_name} {player.second_name}
                <StatusIcon status={player.status} className="w-5 h-5 text-xs" />
              </h2>
              <div className="flex flex-wrap gap-3 mb-3">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                  {teams[player.team]}
                </span>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                  {POSITION_MAP[player.element_type]}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <div className="text-sm opacity-90">Price</div>
                  <div className="text-2xl font-bold">£{(player.now_cost / 10).toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Total Points</div>
                  <div className="text-2xl font-bold">{player.total_points}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">ICT Index</div>
                  <div className="text-2xl font-bold">{player.ict_index}</div>
                </div>
                <div>
                  <div className="text-sm opacity-90">Ownership</div>
                  <div className="text-2xl font-bold">{player.selected_by_percent}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stats Overview */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Season Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Form</div>
                <div className="text-2xl font-bold text-gray-800">{player.form}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Points/Game</div>
                <div className="text-2xl font-bold text-gray-800">{player.points_per_game}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Minutes</div>
                <div className="text-2xl font-bold text-gray-800">{player.minutes}</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Bonus Points</div>
                <div className="text-2xl font-bold text-gray-800">{player.bonus}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Goals</div>
                <div className="text-2xl font-bold text-gray-800">{player.goals_scored}</div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Assists</div>
                <div className="text-2xl font-bold text-gray-800">{player.assists}</div>
              </div>
              <div className="bg-teal-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Clean Sheets</div>
                <div className="text-2xl font-bold text-gray-800">{player.clean_sheets}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Goals Conceded</div>
                <div className="text-2xl font-bold text-gray-800">{player.goals_conceded}</div>
              </div>
            </div>
          </div>

          {/* Upcoming Fixtures */}
          {fixtures.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Upcoming Fixtures</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {fixtures.map((fixture, index) => (
                  <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-500 mb-2">GW {fixture.gameweek}</div>
                    <div className="font-semibold text-gray-900 mb-2">
                      {fixture.isHome ? 'vs' : '@'} {fixture.opponent}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-gray-600">Difficulty:</span>
                      <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white ${
                        fixture.difficulty <= 2 ? 'bg-green-500' : 
                        fixture.difficulty >= 4 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}>
                        {fixture.difficulty}
                      </span>
                    </div>
                    <div className={`text-xs mt-2 font-medium ${
                      fixture.difficulty <= 2 ? 'text-green-600' : 
                      fixture.difficulty >= 4 ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {fixture.difficulty <= 2 ? 'Easy' : fixture.difficulty >= 4 ? 'Hard' : 'Medium'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Chart */}
          {formChartData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Form (Last 5 Games)</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={formChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="gw" />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                              <p className="font-semibold">{payload[0].payload.gw}</p>
                              <p className="text-sm text-gray-600">vs {payload[0].payload.opponent}</p>
                              <p className="text-blue-600 font-bold">{payload[0].value} points</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="points" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Match History */}
          {playerDetails && playerDetails.history && playerDetails.history.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Match History</h3>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">GW</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Opponent</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Points</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Minutes</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Goals</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assists</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">CS</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Bonus</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {playerDetails.history.map((match, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {match.round}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {getOpponentName(match.opponent_team, match.was_home)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-600">
                            {match.total_points}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {match.minutes}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {match.goals_scored}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {match.assists}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {match.clean_sheets}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {match.bonus}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;
