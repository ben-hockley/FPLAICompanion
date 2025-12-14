import { useState } from 'react';
import PlayerModal from './PlayerModal';
import StatusIcon from './StatusIcon';
import TransferRecommendations from './TransferRecommendations';
import { getCountryCode } from '../utils/regionFlags';
import * as flags from 'country-flag-icons/react/3x2';
import { EnglandFlag, ScotlandFlag, WalesFlag, NorthernIrelandFlag } from '../utils/UKFlags';
import { TEAM_BADGES } from '../utils/teamBadges';

const TeamFormation = ({ allPlayers, teams, onTeamLoaded }) => {
  const [managerId, setManagerId] = useState('');
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showTransferRecs, setShowTransferRecs] = useState(false);
  const [currentGameweek, setCurrentGameweek] = useState(15);
  const [showHelp, setShowHelp] = useState(false);
  const [managerInfo, setManagerInfo] = useState(null);
  const [loadedManagerId, setLoadedManagerId] = useState(null);

  const CURRENT_GAMEWEEK = 15;

  const POSITION_MAP = {
    1: 'GK',
    2: 'DEF',
    3: 'MID',
    4: 'FWD'
  };

  const getTeamBadgeUrl = (teamId) => {
    return TEAM_BADGES[teamId];
  };

  const renderFlag = (regionId) => {
    const countryCode = getCountryCode(regionId);
    if (!countryCode) return null;

    // Handle UK countries with custom flags
    if (countryCode === 'ENG') {
      return <EnglandFlag className="w-6 h-4 inline-block rounded shadow-sm" />;
    } else if (countryCode === 'SCT') {
      return <ScotlandFlag className="w-6 h-4 inline-block rounded shadow-sm" />;
    } else if (countryCode === 'WLS') {
      return <WalesFlag className="w-6 h-4 inline-block rounded shadow-sm" />;
    } else if (countryCode === 'NIR') {
      return <NorthernIrelandFlag className="w-6 h-4 inline-block rounded shadow-sm" />;
    } else {
      // Use country-flag-icons for other countries
      const FlagComponent = flags[countryCode];
      return FlagComponent ? <FlagComponent className="w-6 h-4 inline-block rounded shadow-sm" title={countryCode} /> : null;
    }
  };

  

  const fetchTeam = async (gameweek = currentGameweek) => {
    if (!managerId || managerId.trim() === '') {
      setError('Please enter a valid Manager ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch manager info if manager ID has changed
      if (loadedManagerId !== managerId) {
        try {
          const managerResponse = await fetch(`/api/entry/${managerId}/`);
          if (managerResponse.ok) {
            const managerData = await managerResponse.json();
            setManagerInfo({
              name: managerData.player_first_name + ' ' + managerData.player_last_name,
              teamName: managerData.name,
              region: managerData.player_region_id,
              favouriteTeam: managerData.favourite_team
            });
            setLoadedManagerId(managerId);
          }
        } catch (err) {
          console.error('Failed to fetch manager info:', err);
        }
      }
      
      const response = await fetch(`/api/entry/${managerId}/event/${gameweek}/picks/`);
      
      if (!response.ok) {
        throw new Error('Manager ID not found or invalid');
      }

      const data = await response.json();
      
      // Fetch player details for this gameweek to get correct points
      const enrichedPicks = await Promise.all(data.picks.map(async pick => {
        const player = allPlayers.find(p => p.id === pick.element);
        
        // Fetch player's gameweek history to get points for this specific gameweek
        try {
          const playerResponse = await fetch(`/api/element-summary/${pick.element}/`);
          if (playerResponse.ok) {
            const playerData = await playerResponse.json();
            const gwHistory = playerData.history.find(h => h.round === gameweek);
            
            return {
              ...pick,
              playerData: {
                ...player,
                event_points: gwHistory ? gwHistory.total_points : 0
              }
            };
          }
        } catch (err) {
          console.error(`Failed to fetch player ${pick.element} details:`, err);
        }
        
        return {
          ...pick,
          playerData: {
            ...player,
            event_points: 0
          }
        };
      }));

      const teamDataObj = {
        ...data,
        picks: enrichedPicks
      };
      setTeamData(teamDataObj);
      setCurrentGameweek(gameweek);
      setLoading(false);
      
      // Notify parent of loaded team player IDs
      if (onTeamLoaded) {
        const playerIds = enrichedPicks.map(pick => pick.element);
        onTeamLoaded(playerIds);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchTeam();
  };

  const goToPreviousGameweek = () => {
    if (currentGameweek > 1) {
      fetchTeam(currentGameweek - 1);
    }
  };

  const goToNextGameweek = () => {
    if (currentGameweek < CURRENT_GAMEWEEK) {
      fetchTeam(currentGameweek + 1);
    }
  };

  const goToCurrentGameweek = () => {
    fetchTeam(CURRENT_GAMEWEEK);
  };

  const clearTeam = () => {
    setTeamData(null);
    setManagerId('');
    setError(null);
    setManagerInfo(null);
    setLoadedManagerId(null);
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
          <div className={`${isSub ? 'text-xs' : 'text-sm'} font-bold text-gray-900 truncate w-full px-1 flex items-center justify-center gap-1`}>
            <span className="truncate">{player.web_name}</span>
            <StatusIcon status={player.status} news={player.news} />
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
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            FPL Manager ID
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="text-blue-600 hover:text-blue-700 transition"
              title="How to find your Manager ID"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </button>
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
          {/* Manager and Team Name */}
          {managerInfo && (
            <div className="text-center mb-6 bg-white rounded-lg shadow-md p-4">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                {managerInfo.teamName}
              </h3>
              <p className="text-gray-600 mt-1 flex items-center justify-center gap-2">
                {managerInfo.region && renderFlag(managerInfo.region)}
                <span>Manager: {managerInfo.name}</span>
              </p>
            </div>
          )}
          
          {/* Total Points with Gameweek Navigation */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3">
              {/* Previous Gameweek Button */}
              {currentGameweek > 1 && (
                <button
                  onClick={goToPreviousGameweek}
                  disabled={loading}
                  className="bg-white rounded-lg shadow-md p-3 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous gameweek"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Points Display */}
              <div className="bg-white rounded-lg shadow-md px-8 py-4">
                <div className="text-sm text-gray-600 font-medium">Gameweek {currentGameweek} Points</div>
                <div className="text-4xl font-bold text-blue-600">{calculateTotalPoints()}</div>
              </div>

              {/* Next Gameweek Button */}
              {currentGameweek < CURRENT_GAMEWEEK && (
                <button
                  onClick={goToNextGameweek}
                  disabled={loading}
                  className="bg-white rounded-lg shadow-md p-3 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next gameweek"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Go to Current Gameweek Button */}
              {currentGameweek !== CURRENT_GAMEWEEK && (
                <button
                  onClick={goToCurrentGameweek}
                  disabled={loading}
                  className="bg-blue-600 text-white rounded-lg shadow-md px-4 py-3 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                  title="Go to current gameweek"
                >
                  <span className="text-sm">Current GW</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              )}
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

          {/* AI Transfer Recommendations Button */}
          <div className="mt-6">
            <button
              onClick={() => setShowTransferRecs(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition font-medium shadow-lg flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-lg">Get AI Transfer Recommendations</span>
            </button>
          </div>
        </div>
      )}
      
      {selectedPlayer && (
        <PlayerModal player={selectedPlayer} teams={teams} players={allPlayers} onClose={handleCloseModal} />
      )}

      {/* Transfer Recommendations Modal */}
      {showTransferRecs && teamData && (
        <TransferRecommendations
          isOpen={showTransferRecs}
          onClose={() => setShowTransferRecs(false)}
          teamData={teamData}
          allPlayers={allPlayers}
          teams={teams}
        />
      )}

      {/* Help Modal */}
      {showHelp && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowHelp(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">How to Find Your FPL Manager ID</h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-white hover:text-gray-200 text-3xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                  <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                    Go to the FPL Website
                  </h3>
                  <p className="text-blue-800 ml-8">
                    Visit <a href="https://fantasy.premierleague.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">fantasy.premierleague.com</a> and sign in to your account.
                  </p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
                  <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                    Navigate to the Points Tab
                  </h3>
                  <p className="text-green-800 ml-8">
                    Once signed in, click on the <strong>"Points"</strong> tab in the navigation menu.
                  </p>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded">
                  <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                    <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                    Find Your Manager ID in the URL
                  </h3>
                  <p className="text-purple-800 ml-8">
                    Look at the URL in your browser's address bar. Your Manager ID is the number that appears after <code className="bg-purple-200 px-2 py-1 rounded">/entry/</code>
                  </p>
                  <p className="text-purple-800 ml-8 mt-2 text-sm">
                    Example: In the URL <code className="bg-purple-200 px-2 py-1 rounded text-xs">fantasy.premierleague.com/entry/<strong>2235133</strong>/event/15</code>, the Manager ID is <strong>2235133</strong>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 text-center">Visual Guide</h3>
                <img 
                  src="/manager-id-help.svg" 
                  alt="How to find Manager ID" 
                  className="w-full rounded-lg shadow-md"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-yellow-900">Note</h4>
                    <p className="text-sm text-yellow-800">Your Manager ID is unique to your FPL account and remains the same throughout all seasons.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowHelp(false)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default TeamFormation;
