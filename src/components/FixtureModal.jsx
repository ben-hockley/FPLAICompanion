import { useState, useEffect } from 'react';
import { TEAM_BADGES } from '../utils/teamBadges';

const FixtureModal = ({ fixture, teams, allPlayers, onClose, onPlayerClick }) => {
  const [fixtureDetails, setFixtureDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    fetchFixtureDetails();
  }, [fixture.id]);

  const fetchFixtureDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/fixtures/?event=${fixture.event}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch fixture details (${response.status})`);
      }
      
      const fixturesData = await response.json();
      const fixtureData = fixturesData.find(f => f.id === fixture.id);
      
      setFixtureDetails(fixtureData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getTeamBadgeUrl = (teamId) => {
    // Prefer explicit map entry, fall back to CDN template with 70px badges
    return TEAM_BADGES[teamId]
  };

  const formatKickoffTime = (kickoffTime) => {
    const date = new Date(kickoffTime);
    return date.toLocaleString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLineup = (teamId) => {
    if (!fixtureDetails || !fixtureDetails.stats) return [];
    
    // Get BPS list which includes all players who played
    const bpsList = fixtureDetails.stats.find(stat => stat.identifier === 'bps');
    if (!bpsList) return [];
    
    const teamBps = teamId === fixture.team_h ? bpsList.h : bpsList.a;
    if (!teamBps) return [];
    
    // Create player stats map
    const playerStatsMap = new Map();
    
    // Initialize all players from bps list
    teamBps.forEach(bpsEntry => {
      const player = allPlayers.find(p => p.id === bpsEntry.element);
      if (player) {
        playerStatsMap.set(bpsEntry.element, {
          player,
          goals: 0,
          assists: 0,
          bonus: 0,
          yellowCards: 0,
          redCards: 0,
          saves: 0,
          bps: bpsEntry.value || 0,
          defensiveContribution: 0
        });
      }
    });
    
    // Add goals
    const goalScorers = fixtureDetails.stats.find(stat => stat.identifier === 'goals_scored');
    if (goalScorers) {
      const teamGoals = teamId === fixture.team_h ? goalScorers.h : goalScorers.a;
      teamGoals?.forEach(stat => {
        const playerStat = playerStatsMap.get(stat.element);
        if (playerStat) {
          playerStat.goals = stat.value || 0;
        }
      });
    }
    
    // Add assists
    const assisters = fixtureDetails.stats.find(stat => stat.identifier === 'assists');
    if (assisters) {
      const teamAssists = teamId === fixture.team_h ? assisters.h : assisters.a;
      teamAssists?.forEach(stat => {
        const playerStat = playerStatsMap.get(stat.element);
        if (playerStat) {
          playerStat.assists = stat.value || 0;
        }
      });
    }
    
    // Add bonus points
    const bonusPoints = fixtureDetails.stats.find(stat => stat.identifier === 'bonus');
    if (bonusPoints) {
      const teamBonus = teamId === fixture.team_h ? bonusPoints.h : bonusPoints.a;
      teamBonus?.forEach(stat => {
        const playerStat = playerStatsMap.get(stat.element);
        if (playerStat) {
          playerStat.bonus = stat.value || 0;
        }
      });
    }
    
    // Add yellow cards
    const yellowCards = fixtureDetails.stats.find(stat => stat.identifier === 'yellow_cards');
    if (yellowCards) {
      const teamYellows = teamId === fixture.team_h ? yellowCards.h : yellowCards.a;
      teamYellows?.forEach(stat => {
        const playerStat = playerStatsMap.get(stat.element);
        if (playerStat) {
          playerStat.yellowCards = stat.value || 0;
        }
      });
    }
    
    // Add red cards
    const redCards = fixtureDetails.stats.find(stat => stat.identifier === 'red_cards');
    if (redCards) {
      const teamReds = teamId === fixture.team_h ? redCards.h : redCards.a;
      teamReds?.forEach(stat => {
        const playerStat = playerStatsMap.get(stat.element);
        if (playerStat) {
          playerStat.redCards = stat.value || 0;
        }
      });
    }
    
    // Add saves
    const saves = fixtureDetails.stats.find(stat => stat.identifier === 'saves');
    if (saves) {
      const teamSaves = teamId === fixture.team_h ? saves.h : saves.a;
      teamSaves?.forEach(stat => {
        const playerStat = playerStatsMap.get(stat.element);
        if (playerStat) {
          playerStat.saves = stat.value || 0;
        }
      });
    }
    
    // Add defensive contribution
    const defensiveContribution = fixtureDetails.stats.find(stat => stat.identifier === 'defensive_contribution');
    if (defensiveContribution) {
      const teamDefcon = teamId === fixture.team_h ? defensiveContribution.h : defensiveContribution.a;
      teamDefcon?.forEach(stat => {
        const playerStat = playerStatsMap.get(stat.element);
        if (playerStat) {
          playerStat.defensiveContribution = stat.value || 0;
        }
      });
    }
    
    // Convert map to array and sort by position then by BPS
    const lineup = Array.from(playerStatsMap.values())
      .sort((a, b) => {
        // Sort by position first (GK, DEF, MID, FWD)
        if (a.player.element_type !== b.player.element_type) {
          return a.player.element_type - b.player.element_type;
        }
        // Then by BPS
        return b.bps - a.bps;
      });
    
    return lineup;
  };

  const getPositionLabel = (elementType) => {
    const positions = {
      1: 'GK',
      2: 'DEF',
      3: 'MID',
      4: 'FWD'
    };
    return positions[elementType] || '';
  };

  const getPlayerIcons = (playerStat) => {
    const icons = [];
    const player = playerStat.player;
    const isDefender = player.element_type === 2; // DEF
    const isMidOrFwd = player.element_type === 3 || player.element_type === 4; // MID or FWD
    const isGK = player.element_type === 1; // GK
    
    // Goals
    if (playerStat.goals > 0) {
      icons.push({ emoji: '⚽', count: playerStat.goals, title: 'Goals' });
    }
    
    // Assists
    if (playerStat.assists > 0) {
      icons.push({ emoji: '🅰️', count: playerStat.assists, title: 'Assists' });
    }
    
    // Bonus points
    if (playerStat.bonus > 0) {
      icons.push({ emoji: '⭐', count: playerStat.bonus, title: 'Bonus Points' });
    }
    
    // Defensive contribution
    if ((isMidOrFwd && playerStat.defensiveContribution > 12) || (isDefender && playerStat.defensiveContribution > 10)) {
      icons.push({ emoji: '🛡️', count: playerStat.defensiveContribution, title: 'Defensive Contribution' });
    }
    
    // Saves for GK
    if (isGK && playerStat.saves > 3) {
      icons.push({ emoji: '🧤', count: playerStat.saves, title: 'Saves' });
    }
    
    // Yellow cards
    if (playerStat.yellowCards > 0) {
      icons.push({ emoji: '🟨', count: playerStat.yellowCards, title: 'Yellow Cards' });
    }
    
    // Red cards
    if (playerStat.redCards > 0) {
      icons.push({ emoji: '🟥', count: playerStat.redCards, title: 'Red Cards' });
    }
    
    return icons;
  };

  const handlePlayerClick = (player) => {
    onPlayerClick(player);
    onClose();
  };

  const getStatValue = (statIdentifier, isHome) => {
    if (!fixtureDetails?.stats) return null;
    const stat = fixtureDetails.stats.find(s => s.identifier === statIdentifier);
    if (!stat) return null;
    const value = isHome ? stat.h : stat.a;
    return Array.isArray(value) ? value.length : value;
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading fixture details...</p>
          </div>
        ) : error ? (
          <div className="p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Fixture Details</h2>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 text-3xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Fixture Score */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="flex items-center justify-center gap-8">
                {/* Home Team */}
                <div className="flex flex-col items-center flex-1">
                  <img
                    src={getTeamBadgeUrl(fixture.team_h)}
                    alt={teams[fixture.team_h]}
                    className="w-20 h-20 object-contain mb-3"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                  <h3 className="text-xl font-bold text-gray-800 text-center">
                    {teams[fixture.team_h]}
                  </h3>
                </div>

                {/* Score */}
                <div className="flex flex-col items-center">
                  {fixture.finished || fixture.started ? (
                    <>
                      <div className="text-5xl font-bold text-gray-800 flex gap-4">
                        <span>{fixture.team_h_score}</span>
                        <span className="text-gray-400">-</span>
                        <span>{fixture.team_a_score}</span>
                      </div>
                      {fixture.finished ? (
                        <span className="mt-2 text-sm font-medium text-green-600">Full Time</span>
                      ) : (
                        <span className="mt-2 text-sm font-medium text-red-600 animate-pulse">LIVE</span>
                      )}
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-400">VS</div>
                      <div className="text-sm text-gray-600 mt-2">
                        {formatKickoffTime(fixture.kickoff_time)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center flex-1">
                  <img
                    src={getTeamBadgeUrl(fixture.team_a)}
                    alt={teams[fixture.team_a]}
                    className="w-20 h-20 object-contain mb-3"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                  <h3 className="text-xl font-bold text-gray-800 text-center">
                    {teams[fixture.team_a]}
                  </h3>
                </div>
              </div>
            </div>

            {/* Lineups */}
            {(fixture.finished || fixture.started) && (
              <div className="p-6 border-t">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Lineups</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Home Team Lineup */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <img
                        src={getTeamBadgeUrl(fixture.team_h)}
                        alt={teams[fixture.team_h]}
                        className="w-5 h-5 object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      {teams[fixture.team_h]}
                    </h4>
                    <div className="space-y-1">
                      {getLineup(fixture.team_h).map((playerStat) => {
                        const icons = getPlayerIcons(playerStat);
                        return (
                          <button
                            key={playerStat.player.id}
                            onClick={() => handlePlayerClick(playerStat.player)}
                            className="w-full flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xs font-semibold text-gray-500 flex-shrink-0 w-8">
                                {getPositionLabel(playerStat.player.element_type)}
                              </span>
                              <span className="font-medium text-gray-800 text-sm truncate">
                                {playerStat.player.web_name}
                              </span>
                              <div className="flex gap-1 flex-wrap">
                                {icons.map((icon, idx) => (
                                  <span
                                    key={idx}
                                    className="text-sm"
                                    title={icon.title}
                                  >
                                    {icon.emoji}{icon.count !== null && icon.count > 1 ? icon.count : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 flex-shrink-0">→</div>
                          </button>
                        );
                      })}
                      {getLineup(fixture.team_h).length === 0 && (
                        <p className="text-sm text-gray-500 italic">Lineup not available</p>
                      )}
                    </div>
                  </div>

                  {/* Away Team Lineup */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <img
                        src={getTeamBadgeUrl(fixture.team_a)}
                        alt={teams[fixture.team_a]}
                        className="w-5 h-5 object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      {teams[fixture.team_a]}
                    </h4>
                    <div className="space-y-1">
                      {getLineup(fixture.team_a).map((playerStat) => {
                        const icons = getPlayerIcons(playerStat);
                        return (
                          <button
                            key={playerStat.player.id}
                            onClick={() => handlePlayerClick(playerStat.player)}
                            className="w-full flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xs font-semibold text-gray-500 flex-shrink-0 w-8">
                                {getPositionLabel(playerStat.player.element_type)}
                              </span>
                              <span className="font-medium text-gray-800 text-sm truncate">
                                {playerStat.player.web_name}
                              </span>
                              <div className="flex gap-1 flex-wrap">
                                {icons.map((icon, idx) => (
                                  <span
                                    key={idx}
                                    className="text-sm"
                                    title={icon.title}
                                  >
                                    {icon.emoji}{icon.count !== null && icon.count > 1 ? icon.count : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 flex-shrink-0">→</div>
                          </button>
                        );
                      })}
                      {getLineup(fixture.team_a).length === 0 && (
                        <p className="text-sm text-gray-500 italic">Lineup not available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FixtureModal;
