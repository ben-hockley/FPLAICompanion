import { useState } from 'react';
import PlayerModal from './PlayerModal';

const TeamFormation = ({ allPlayers, teams }) => {
  const [managerId, setManagerId] = useState('');
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const CURRENT_GAMEWEEK = 15;

  const POSITION_MAP = {
    1: 'GK',
    2: 'DEF',
    3: 'MID',
    4: 'FWD'
  };

  

  const fetchTeam = async () => {
    if (!managerId || managerId.trim() === '') {
      setError('Please enter a valid Manager ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/entry/${managerId}/event/${CURRENT_GAMEWEEK}/picks/`);
      
      if (!response.ok) {
        throw new Error('Manager ID not found or invalid');
      }

      const data = await response.json();
      
      // Match picks with player data
      const enrichedPicks = data.picks.map(pick => {
        const player = allPlayers.find(p => p.id === pick.element);
        return {
          ...pick,
          playerData: player
        };
      });

      setTeamData({
        ...data,
        picks: enrichedPicks
      });
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchTeam();
  };

  const clearTeam = () => {
    setTeamData(null);
    setManagerId('');
    setError(null);
  };

  const getPlayersByPosition = (picks, positionType) => {
    return picks.filter(pick => 
      pick.playerData && 
      pick.playerData.element_type === positionType &&
      pick.position <= 11
    );
  };

  const getSubstitutes = (picks) => {
    return picks.filter(pick => pick.position > 11).sort((a, b) => a.position - b.position);
  };

  const calculateTotalPoints = () => {
    if (!teamData) return 0;
    return teamData.picks
      .filter(pick => pick.position <= 11)
      .reduce((total, pick) => {
        const points = pick.playerData?.event_points || 0;
        const multiplier = pick.is_captain ? 2 : 1;
        return total + (points * multiplier);
      }, 0);
  };

  const PlayerCard = ({ pick, isSub = false }) => {
    const player = pick.playerData;
    if (!player) return null;

    const positionColors = {
      1: 'bg-yellow-400 border-yellow-600',
      2: 'bg-green-400 border-green-600',
      3: 'bg-blue-400 border-blue-600',
      4: 'bg-red-400 border-red-600'
    };

    return (
      <div 
        onClick={() => setSelectedPlayer(player)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') setSelectedPlayer(player); }}
        className={`
          ${isSub ? 'w-20 h-24' : 'w-24 h-28'} 
          ${positionColors[player.element_type]} 
          rounded-lg border-2 shadow-lg p-2 flex flex-col items-center justify-between
          transform transition-all hover:scale-105 animate-fadeIn
          ${isSub ? 'opacity-70' : ''}
          cursor-pointer
        `}
      >
        <div className="text-center flex-1 flex flex-col justify-center">
          <div className={`${isSub ? 'text-xs' : 'text-sm'} font-bold text-gray-900 truncate w-full px-1`}>
            {player.web_name}
          </div>
          <div className={`${isSub ? 'text-[10px]' : 'text-xs'} text-gray-800`}>
            {teams[player.team]}
          </div>
          {!isSub && (
            <div className="text-xs font-semibold text-gray-900 mt-1">
              {player.event_points || 0} pts
            </div>
          )}
        </div>
        
        <div className="flex gap-1 mt-1">
          {pick.is_captain && (
            <span className="bg-white text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
              C
            </span>
          )}
          {pick.is_vice_captain && (
            <span className="bg-gray-200 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
              VC
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleCloseModal = () => setSelectedPlayer(null);

  return (
    <>
      <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
        My FPL Team
      </h2>

      <div className="flex-1 flex flex-col overflow-y-auto px-4">
        {/* Manager ID Input */}
        <div className="mb-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            FPL Manager ID
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              placeholder="Enter your FPL Manager ID"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Loading...' : 'Load Team'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Gameweek {CURRENT_GAMEWEEK} • Find your Manager ID in the FPL app under "Points"
          </p>
          {/* Clear Team button removed as requested */}
        </form>

        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Team Formation Display */}
      {teamData && (
        <div className="max-w-5xl mx-auto">
          {/* Total Points */}
          <div className="text-center mb-6">
            <div className="inline-block bg-white rounded-lg shadow-md px-8 py-4">
              <div className="text-sm text-gray-600 font-medium">Gameweek {CURRENT_GAMEWEEK} Points</div>
              <div className="text-4xl font-bold text-blue-600">{calculateTotalPoints()}</div>
            </div>
          </div>

          {/* Football Pitch */}
          <div className="bg-gradient-to-b from-green-600 to-green-700 rounded-lg shadow-2xl p-8 relative overflow-hidden">
            {/* Pitch lines */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-px h-full bg-white"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white rounded-full"></div>
            </div>

            <div className="relative z-10 space-y-8">
              {/* Goalkeeper */}
              <div className="flex justify-center">
                <div className="flex gap-4">
                  {getPlayersByPosition(teamData.picks, 1).map(pick => (
                    <PlayerCard key={pick.element} pick={pick} />
                  ))}
                </div>
              </div>

              {/* Defenders */}
              <div className="flex justify-center">
                <div className="flex gap-4 flex-wrap justify-center max-w-2xl">
                  {getPlayersByPosition(teamData.picks, 2).map(pick => (
                    <PlayerCard key={pick.element} pick={pick} />
                  ))}
                </div>
              </div>

              {/* Midfielders */}
              <div className="flex justify-center">
                <div className="flex gap-4 flex-wrap justify-center max-w-2xl">
                  {getPlayersByPosition(teamData.picks, 3).map(pick => (
                    <PlayerCard key={pick.element} pick={pick} />
                  ))}
                </div>
              </div>

              {/* Forwards */}
              <div className="flex justify-center">
                <div className="flex gap-4 flex-wrap justify-center max-w-2xl">
                  {getPlayersByPosition(teamData.picks, 4).map(pick => (
                    <PlayerCard key={pick.element} pick={pick} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Substitutes Bench */}
          <div className="mt-6 bg-gray-100 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
              Substitutes
            </h3>
            <div className="flex justify-center gap-4 flex-wrap">
              {getSubstitutes(teamData.picks).map(pick => (
                <div key={pick.element} className="text-center">
                  <PlayerCard pick={pick} isSub={true} />
                  <div className="text-xs text-gray-600 mt-1">
                    {POSITION_MAP[pick.playerData?.element_type]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-sm text-gray-600">Team Value</div>
              <div className="text-2xl font-bold text-gray-800">
                £{((teamData.entry_history?.value || 0) / 10).toFixed(1)}m
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-sm text-gray-600">In The Bank</div>
              <div className="text-2xl font-bold text-gray-800">
                £{((teamData.entry_history?.bank || 0) / 10).toFixed(1)}m
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-sm text-gray-600">GW Rank</div>
              <div className="text-2xl font-bold text-gray-800">
                {(teamData.entry_history?.rank || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-sm text-gray-600">Overall Rank</div>
              <div className="text-2xl font-bold text-gray-800">
                {(teamData.entry_history?.overall_rank || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {selectedPlayer && (
        <PlayerModal player={selectedPlayer} teams={teams} onClose={handleCloseModal} />
      )}
    </div>
    </>
  );
};

export default TeamFormation;
