import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchFPL, fetchFPLDynamic } from '../utils/fplApi';
import StatusIcon from './StatusIcon';
import { getCountryCode } from '../utils/regionFlags';
import * as flags from 'country-flag-icons/react/3x2';

// Custom SVG UK Flags.
import { EnglandFlag, ScotlandFlag, WalesFlag, NorthernIrelandFlag } from '../utils/UKFlags';

const PlayerModal = ({ player, teams, players = [], onClose, onTeamClick }) => {
  const [playerDetails, setPlayerDetails] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showIctHelp, setShowIctHelp] = useState(false);

  // Map element-type (FPL API) to position name.
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
      
      // Fetch player details (dynamic endpoint - can't be pre-fetched)
      const detailsData = await fetchFPLDynamic(`element-summary/${player.id}`);
      
      // Fetch all fixtures (static endpoint - has fallback)
      const fixturesData = await fetchFPL('fixtures');
      
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
            opponentId: opponentId,
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
    // Updated URL format for 25/26 Premier League player pictures.
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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn p-2 sm:p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg p-4 sm:p-8 max-w-4xl w-full max-h-[95vh] overflow-y-auto">
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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn p-2 sm:p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg p-4 sm:p-8 max-w-4xl w-full">
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto animate-slideUp">
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
                  e.target.src = 'https://resources.premierleague.com/premierleague25/photos/players/110x140/placeholder.png';
                }}
              />
            </div>
            
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                {(() => {
                  const countryCode = getCountryCode(player.region);
                  if (countryCode) {
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
                  }
                  return null;
                })()}
                {player.first_name} {player.second_name}
                <StatusIcon status={player.status} news={player.news} className="w-5 h-5 text-xs" />
              </h2>
              <div className="flex flex-wrap gap-3 mb-3">
                <span 
                  onClick={() => {
                    if (onTeamClick) {
                      onClose();
                      onTeamClick(player.team);
                    }
                  }}
                  className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-opacity-30 transition"
                >
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

              {/* Universal Stats cards, shown for all 4 positions */}
              <div className="bg-blue-50 p-4 rounded-lg" title="Average points/match played in the last 30 days." aria-label="Form">
                <div className="text-sm text-gray-600">Form</div>
                <div className="text-2xl font-bold text-gray-800">{player.form}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg" title="Average points/match this season" aria-label="Points per match">
                <div className="text-sm text-gray-600">Points/Match</div>
                <div className="text-2xl font-bold text-gray-800">{player.points_per_game}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg" title="Total minutes played this season" aria-label="Minutes Played">
                <div className="text-sm text-gray-600">Minutes</div>
                <div className="text-2xl font-bold text-gray-800">{player.minutes}</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg" title="Bonus points earned this season, The three best performing players in each match are awarded bonus points." aria-label="Bonus Points">
                <div className="text-sm text-gray-600">Bonus Points</div>
                <div className="text-2xl font-bold text-gray-800">{player.bonus}</div>
              </div>

              {/* Stats cards only shown for outfield players (DEF, MID, FWD) */
              player.element_type !== 1 && (
                <>
                  <div className="bg-red-50 p-4 rounded-lg" title="Goals scored this season" aria-label="Goals">
                    <div className="text-sm text-gray-600">Goals</div>
                    <div className="text-2xl font-bold text-gray-800">{player.goals_scored}</div>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg" title="Assists made this season" aria-label="Assists">
                    <div className="text-sm text-gray-600">Assists</div>
                    <div className="text-2xl font-bold text-gray-800">{player.assists}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg" title="Average defensive contributions/match (Clearances, Blocks, Interceptions, Tackles + Ball Recoveries for MID & FWD) this season" aria-label="Defensive Contributions per match">
                    <div className="text-sm text-gray-600">DefCon/Match</div>
                    <div className="text-2xl font-bold text-gray-800">{player.defensive_contribution_per_90}</div>
                  </div>
                </>
              )}

              {/* Clean sheets shown for GK, DEF, MID */
              player.element_type !== 4 && (
              <div className="bg-teal-50 p-4 rounded-lg" title="Clean sheets kept this season" aria-label="Clean Sheets">
                <div className="text-sm text-gray-600">Clean Sheets</div>
                <div className="text-2xl font-bold text-gray-800">{player.clean_sheets}</div>
              </div>
              )}
              {/* Goals conceded shown for GK*/
              player.element_type === 1 && (
              <div className="bg-orange-50 p-4 rounded-lg" title="Average goals conceded per match this season, -1 point per goal conceded for GK and DEF" aria-label="Goals Conceded per match">
                <div className="text-sm text-gray-600">Goals Conceded/Match</div>
                <div className="text-2xl font-bold text-gray-800">{player.goals_conceded_per_90}</div>
              </div>
            )}

              {/* Goalkeeper Specific Stats */
              player.element_type === 1 && (
              <>
              <div className="bg-cyan-50 p-4 rounded-lg" title="Average Saves/Match made this season, GK get 1 point for every 3 saves." aria-label="Saves per match">
                <div className="text-sm text-gray-600">Saves/Match</div>
                <div className="text-2xl font-bold text-gray-800">{player.saves_per_90}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg" title="Penalty saves made this season, GK get 5 points for every penalty save." aria-label="Penalty Saves">
                <div className="text-sm text-gray-600">Penalty Saves</div>
                <div className="text-2xl font-bold text-gray-800">{player.penalties_saved}</div>
              </div>
              </>
              )}
            </div>
          </div>

          {/* Set Piece Taking Order */}
          {(player.penalties_order > 0 || player.direct_freekicks_order > 0 || player.corners_and_indirect_freekicks_order > 0) && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Set Pieces</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {player.penalties_order > 0 && (
                  <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-purple-600 rounded-full">
                        P
                      </span>
                      <div className="text-sm font-semibold text-gray-700">Penalties</div>
                    </div>
                    <div className="text-3xl font-bold text-purple-600">
                      #{player.penalties_order}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {player.penalties_order === 1 ? 'Primary taker' : `${player.penalties_order}${player.penalties_order === 2 ? 'nd' : player.penalties_order === 3 ? 'rd' : 'th'} choice`}
                    </div>
                  </div>
                )}
                {player.direct_freekicks_order > 0 && (
                  <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
                        F
                      </span>
                      <div className="text-sm font-semibold text-gray-700">Direct Free Kicks</div>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      #{player.direct_freekicks_order}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {player.direct_freekicks_order === 1 ? 'Primary taker' : `${player.direct_freekicks_order}${player.direct_freekicks_order === 2 ? 'nd' : player.direct_freekicks_order === 3 ? 'rd' : 'th'} choice`}
                    </div>
                  </div>
                )}
                {player.corners_and_indirect_freekicks_order > 0 && (
                  <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-green-600 rounded-full">
                        C
                      </span>
                      <div className="text-sm font-semibold text-gray-700">Corners & Indirect FKs</div>
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      #{player.corners_and_indirect_freekicks_order}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {player.corners_and_indirect_freekicks_order === 1 ? 'Primary taker' : `${player.corners_and_indirect_freekicks_order}${player.corners_and_indirect_freekicks_order === 2 ? 'nd' : player.corners_and_indirect_freekicks_order === 3 ? 'rd' : 'th'} choice`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Fixtures */}
          {fixtures.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Upcoming Fixtures</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {fixtures.map((fixture, index) => (
                  <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-500 mb-2">GW {fixture.gameweek}</div>
                    <div 
                      className="font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 hover:underline"
                      onClick={() => {
                        if (onTeamClick) {
                          onClose();
                          onTeamClick(fixture.opponentId);
                        }
                      }}
                    >
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase" title="Gameweek">GW</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Opponent</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Points</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Minutes</th>
                        {/* Stat columns for outfield players */}
                        {player.element_type !== 1 && (
                        <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Goals</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assists</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase" title="Defensive contributions">DefCon</th>
                        </>)}
                        {/* Stat columns for GK, DEF, MID */}
                        {player.element_type !== 4 && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase" title="Clean sheet">CS</th>
                        )}
                        {/* Stat columns for GK and DEF */}
                        {player.element_type <= 2 && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase" title="Goals conceded">GC</th>
                        )}
                        {/* Stat columns for GK */}
                        {player.element_type === 1 && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Saves</th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Bonus</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {playerDetails.history.map((match, index) => (
                        <tr key={index} className="hover:bg-gray-50">

                          {/* Match Details */}
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {match.round}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {getOpponentName(match.opponent_team, match.was_home)}
                          </td>

                          {/* Universal Stat Columns */}
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-600">
                            {match.total_points}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {match.minutes}
                          </td>

                          {/* Stat columns for outfield players */
                          player.element_type !== 1 && (
                          <>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {match.goals_scored}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {match.assists}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {match.defensive_contribution}
                          </td>
                          </>
                          )}

                          {/* Stat columns for GK, DEF, MID */
                          player.element_type !== 4 && (
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              {match.clean_sheets}
                            </td>
                          )}
                          {/* Stat columns for GK and DEF */
                          player.element_type <= 2 && (
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              {match.goals_conceded}
                            </td>
                          )}
                          {/* Stat columns for GK */
                          player.element_type === 1 && (
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              {match.saves}
                            </td>
                          )}

                          {/* Universal Stat Column */}
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

          {/* ICT Index Breakdown */}
          {players.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center justify-center gap-2">
                ICT Index
                <button
                  type="button"
                  onClick={() => setShowIctHelp(true)}
                  className="text-blue-600 hover:text-blue-700 transition"
                  title="What is ICT Index?"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </button>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Influence */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 text-center">
                  <h4 className="text-lg font-semibold text-purple-900 mb-2">Influence</h4>
                  <div className="text-3xl font-bold text-purple-700 mb-2">{player.influence}</div>
                  <div className="text-sm text-gray-700">
                    <div className="mb-1">
                      {' '}
                      {player.influence_rank} out of {players.length} Players.
                    </div>
                    <div>
                      {player.influence_rank_type} out of{' '}
                      {players.filter(p => p.element_type === player.element_type).length} {' '}
                      {POSITION_MAP[player.element_type]}s.
                    </div>
                  </div>
                </div>

                {/* Creativity */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 text-center">
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">Creativity</h4>
                  <div className="text-3xl font-bold text-blue-700 mb-2">{player.creativity}</div>
                  <div className="text-sm text-gray-700">
                    <div className="mb-1">
                      {player.creativity_rank} out of {players.length} Players.
                    </div>
                    <div>
                      {player.creativity_rank_type} out of {' '}
                      {players.filter(p => p.element_type === player.element_type).length} {' '}
                      {POSITION_MAP[player.element_type]}s.
                    </div>
                  </div>
                </div>

                {/* Threat */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200 text-center">
                  <h4 className="text-lg font-semibold text-red-900 mb-2">Threat</h4>
                  <div className="text-3xl font-bold text-red-700 mb-2">{player.threat}</div>
                  <div className="text-sm text-gray-700">
                    <div className="mb-1">
                      {player.threat_rank} out of {players.length} Players.
                    </div>
                    <div>
                      {player.threat_rank_type} out of{' '}
                      {players.filter(p => p.element_type === player.element_type).length} {' '}
                      {POSITION_MAP[player.element_type]}s.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ICT Index Help Modal */}
      {showIctHelp && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 animate-fadeIn"
          onClick={() => setShowIctHelp(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">What is ICT Index?</h2>
                <button
                  onClick={() => setShowIctHelp(false)}
                  className="text-white hover:text-gray-200 text-3xl leading-none transition"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-600 p-5 rounded-r">
                <h3 className="font-bold text-indigo-900 text-lg mb-2">ICT Index Overview</h3>
                <p className="text-indigo-800">
                  The <strong>ICT Index</strong> is a statistical metric that combines three key performance indicators to help FPL managers identify the most impactful players. It provides a comprehensive view of a player's offensive contribution beyond just goals and assists.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                      I
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-900 text-lg mb-2">Influence</h4>
                      <p className="text-purple-800 text-sm mb-2">
                        Measures a player's impact on a match, taking into account actions that could directly or indirectly affect the outcome.
                      </p>
                      <ul className="text-purple-700 text-sm space-y-1 ml-4 list-disc">
                        <li>Big chances created</li>
                        <li>Successful passes in the final third</li>
                        <li>Shots on target</li>
                        <li>Defensive actions (clearances, blocks, interceptions)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                      C
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 text-lg mb-2">Creativity</h4>
                      <p className="text-blue-800 text-sm mb-2">
                        Assesses a player's ability to create goal-scoring opportunities for teammates.
                      </p>
                      <ul className="text-blue-700 text-sm space-y-1 ml-4 list-disc">
                        <li>Key passes and assists</li>
                        <li>Successful crosses and corners</li>
                        <li>Through balls</li>
                        <li>Passes leading to shots</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                      T
                    </div>
                    <div>
                      <h4 className="font-bold text-red-900 text-lg mb-2">Threat</h4>
                      <p className="text-red-800 text-sm mb-2">
                        Evaluates a player's potential to score goals based on their attacking actions.
                      </p>
                      <ul className="text-red-700 text-sm space-y-1 ml-4 list-disc">
                        <li>Shots on goal</li>
                        <li>Touches in the opposition box</li>
                        <li>Big chances (high xG opportunities)</li>
                        <li>Attacking positioning</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-400 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-green-900 mb-2">How FPL Managers Can Use ICT Index</h4>
                    <ul className="text-sm text-green-800 space-y-2">
                      <li><strong>Identify Hidden Gems:</strong> Players with high ICT scores but low ownership can be excellent differential picks</li>
                      <li><strong>Predict Future Returns:</strong> High ICT scores often precede goals and assists, helping you transfer players in before price rises</li>
                      <li><strong>Compare Players:</strong> When choosing between two similarly-priced players, ICT Index provides objective data</li>
                      <li><strong>Position-Specific Analysis:</strong> Compare players within their position group to find the best value picks</li>
                      <li><strong>Form Tracking:</strong> Consistent ICT performers are more reliable captain choices and long-term holds</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-yellow-900">Pro Tip</h4>
                    <p className="text-sm text-yellow-800">Combine ICT Index with fixture difficulty and form to make the most informed transfer decisions. A player with excellent ICT stats facing easy fixtures is often a must-have!</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowIctHelp(false)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition font-medium shadow-md"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerModal;
