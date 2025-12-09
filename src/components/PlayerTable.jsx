import { useState, useEffect } from 'react';

const PlayerTable = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'total_points', direction: 'desc' });

  const POSITION_MAP = {
    1: 'GK',
    2: 'DEF',
    3: 'MID',
    4: 'FWD'
  };

  useEffect(() => {
    fetchFPLData();
  }, []);

  const fetchFPLData = async () => {
    try {
      setLoading(true);
      // Use local dev proxy to avoid CORS issues. In dev the Vite proxy
      // routes `/api` to https://fantasy.premierleague.com
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedPlayers = () => {
    const sortedPlayers = [...players];
    
    sortedPlayers.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Special handling for different data types
      if (sortConfig.key === 'web_name') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (sortConfig.key === 'team') {
        aValue = teams[a.team];
        bValue = teams[b.team];
      } else {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sortedPlayers;
  };

  const getSortIndicator = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="ml-1 text-gray-400">⇅</span>;
    }
    return sortConfig.direction === 'asc' ? 
      <span className="ml-1">↑</span> : 
      <span className="ml-1">↓</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading FPL data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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

  const sortedPlayers = getSortedPlayers();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        Fantasy Premier League Player Stats
      </h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-600 text-white sticky top-0">
                <tr>
                  <th 
                    onClick={() => handleSort('web_name')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                  >
                    Player {getSortIndicator('web_name')}
                  </th>
                  <th 
                    onClick={() => handleSort('team')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                  >
                    Team {getSortIndicator('team')}
                  </th>
                  <th 
                    onClick={() => handleSort('element_type')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                  >
                    Position {getSortIndicator('element_type')}
                  </th>
                  <th 
                    onClick={() => handleSort('now_cost')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                  >
                    Price {getSortIndicator('now_cost')}
                  </th>
                  <th 
                    onClick={() => handleSort('total_points')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                  >
                    Total Points {getSortIndicator('total_points')}
                  </th>
                  <th 
                    onClick={() => handleSort('points_per_game')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                  >
                    Points/Game {getSortIndicator('points_per_game')}
                  </th>
                  <th 
                    onClick={() => handleSort('form')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                  >
                    Form {getSortIndicator('form')}
                  </th>
                  <th 
                    onClick={() => handleSort('selected_by_percent')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                  >
                    Selected % {getSortIndicator('selected_by_percent')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPlayers.map((player) => (
                  <tr 
                    key={player.id}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {player.web_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {teams[player.team]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className={`px-2 py-1 rounded text-xs font-semibold
                        ${player.element_type === 1 ? 'bg-yellow-200 text-yellow-800' : ''}
                        ${player.element_type === 2 ? 'bg-green-200 text-green-800' : ''}
                        ${player.element_type === 3 ? 'bg-blue-200 text-blue-800' : ''}
                        ${player.element_type === 4 ? 'bg-red-200 text-red-800' : ''}
                      `}>
                        {POSITION_MAP[player.element_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      £{(player.now_cost / 10).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {player.total_points}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {player.points_per_game}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {player.form}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {player.selected_by_percent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {sortedPlayers.length} players
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerTable;
