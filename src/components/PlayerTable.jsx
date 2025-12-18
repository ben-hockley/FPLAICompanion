import { useState, useEffect } from 'react';
import PlayerModal from './PlayerModal';
import FilterModal from './FilterModal';
import StatusIcon from './StatusIcon';

const PlayerTable = ({ players: initialPlayers, teams: initialTeams, myTeamPlayerIds = [], onTeamClick }) => {
  const [players, setPlayers] = useState(initialPlayers || []);
  const [teams, setTeams] = useState(initialTeams || {});
  const [sortConfig, setSortConfig] = useState({ key: 'total_points', direction: 'desc' });
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    playerName: '',
    team: '',
    position: '',
    minValue: '',
    maxValue: '',
    minPoints: '',
    maxPoints: '',
    minPPG: '',
    maxPPG: '',
    minForm: '',
    maxForm: '',
    inMyTeam: false,
    penaltyTaker: false,
    freeKickTaker: false,
    cornerTaker: false
  });

  // Update state when props change
  useEffect(() => {
    if (initialPlayers) setPlayers(initialPlayers);
  }, [initialPlayers]);

  useEffect(() => {
    if (initialTeams) setTeams(initialTeams);
  }, [initialTeams]);

  const POSITION_MAP = {
    1: 'GK',
    2: 'DEF',
    3: 'MID',
    4: 'FWD'
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const applyFilters = (playerList) => {
    return playerList.filter(player => {
      // Player name filter
      if (filters.playerName && !player.web_name.toLowerCase().includes(filters.playerName.toLowerCase())) {
        return false;
      }

      // Team filter
      if (filters.team && player.team.toString() !== filters.team) {
        return false;
      }

      // Position filter
      if (filters.position && player.element_type.toString() !== filters.position) {
        return false;
      }

      // Price range filter
      const price = player.now_cost / 10;
      if (filters.minValue && price < parseFloat(filters.minValue)) {
        return false;
      }
      if (filters.maxValue && price > parseFloat(filters.maxValue)) {
        return false;
      }

      // Total points range filter
      if (filters.minPoints && player.total_points < parseInt(filters.minPoints)) {
        return false;
      }
      if (filters.maxPoints && player.total_points > parseInt(filters.maxPoints)) {
        return false;
      }

      // Points per game range filter
      const ppg = parseFloat(player.points_per_game);
      if (filters.minPPG && ppg < parseFloat(filters.minPPG)) {
        return false;
      }
      if (filters.maxPPG && ppg > parseFloat(filters.maxPPG)) {
        return false;
      }

      // Player form range filter
      const form = parseFloat(player.form);
      if (filters.minForm && form < parseFloat(filters.minForm)) {
        return false;
      }
      if (filters.maxForm && form > parseFloat(filters.maxForm)) {
        return false;
      }

      // My team filter
      if (filters.inMyTeam && !myTeamPlayerIds.includes(player.id)) {
        return false;
      }

      // Set piece filters
      if (filters.penaltyTaker && player.penalties_order !== 1) {
        return false;
      }
      if (filters.freeKickTaker && player.direct_freekicks_order !== 1) {
        return false;
      }
      if (filters.cornerTaker && player.corners_and_indirect_freekicks_order !== 1) {
        return false;
      }

      return true;
    });
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '');
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const getSortedPlayers = () => {
    const filteredPlayers = applyFilters(players);
    const sortedPlayers = [...filteredPlayers];
    
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

  

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
  };

  const handleCloseModal = () => {
    setSelectedPlayer(null);
  };

  const sortedPlayers = getSortedPlayers();

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Fantasy Premier League Player Stats
        </h2>
        <button
          onClick={() => setShowFilterModal(true)}
          className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
            hasActiveFilters()
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {hasActiveFilters() ? 'Filters Active' : 'Filter'}
        </button>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
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
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Set-Pieces
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPlayers.map((player) => {
                const isInMyTeam = myTeamPlayerIds.includes(player.id);
                return (
                <tr 
                  key={player.id}
                  onClick={() => handlePlayerClick(player)}
                  className={`hover:bg-blue-50 transition-colors cursor-pointer ${
                    isInMyTeam ? 'bg-blue-100' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {player.web_name}
                      <StatusIcon status={player.status} news={player.news} />
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 cursor-pointer hover:text-blue-600 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTeamClick && onTeamClick(player.team);
                    }}
                  >
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      {player.penalties_order === 1 && (
                        <span 
                          className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-purple-600 rounded-full"
                          title="Penalty Taker"
                          aria-label="Penalty Taker"
                        >
                          P
                        </span>
                      )}
                      {player.direct_freekicks_order === 1 && (
                        <span 
                          className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-blue-600 rounded-full"
                          title="Direct Free Kick Taker"
                          aria-label="Direct Free Kick Taker"
                        >
                          F
                        </span>
                      )}
                      {player.corners_and_indirect_freekicks_order === 1 && (
                        <span 
                          className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-green-600 rounded-full"
                          title="Corner & Indirect Free Kick Taker"
                          aria-label="Corner & Indirect Free Kick Taker"
                        >
                          C
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex-shrink-0">
          <p className="text-sm text-gray-600">
            Showing {sortedPlayers.length} players • Click any row for detailed stats
          </p>
        </div>
      </div>

      {/* Player Modal */}
      {selectedPlayer && (
        <PlayerModal 
          player={selectedPlayer} 
          teams={teams}
          players={players}
          onClose={handleCloseModal}
          onTeamClick={onTeamClick}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
        teams={teams}
        hasMyTeam={myTeamPlayerIds.length > 0}
      />
    </>
  );
};

export default PlayerTable;
