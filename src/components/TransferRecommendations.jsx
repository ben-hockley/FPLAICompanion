import { useState, useEffect } from 'react';
import StatusIcon from './StatusIcon';

const TransferRecommendations = ({ isOpen, onClose, teamData, allPlayers, teams }) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fixtures, setFixtures] = useState([]);

  useEffect(() => {
    if (isOpen && teamData) {
      fetchFixtures();
    }
  }, [isOpen, teamData]);

  const fetchFixtures = async () => {
    try {
      const response = await fetch('/api/fixtures/');
      if (response.ok) {
        const data = await response.json();
        setFixtures(data);
        generateRecommendations(data);
      } else {
        generateRecommendations([]);
      }
    } catch (err) {
      console.error('Failed to fetch fixtures:', err);
      generateRecommendations([]);
    }
  };

  const getPhotoUrl = (code) => {
    return `https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`;
  };

  const getPlayerFixtureDifficulty = (teamId, fixtureData) => {
    // Get next 3 fixtures for the team
    const teamFixtures = fixtureData
      .filter(f => !f.finished && (f.team_h === teamId || f.team_a === teamId))
      .slice(0, 3);

    if (teamFixtures.length === 0) return 3; // neutral if no fixture data

    // Calculate average difficulty (1-5 scale, lower is better)
    const avgDifficulty = teamFixtures.reduce((sum, fixture) => {
      const difficulty = fixture.team_h === teamId ? fixture.team_h_difficulty : fixture.team_a_difficulty;
      return sum + difficulty;
    }, 0) / teamFixtures.length;

    return avgDifficulty;
  };

  const getNextFixtures = (teamId, fixtureData, count = 3) => {
    const teamFixtures = fixtureData
      .filter(f => !f.finished && (f.team_h === teamId || f.team_a === teamId))
      .slice(0, count);

    return teamFixtures.map(fixture => {
      const isHome = fixture.team_h === teamId;
      const opponent = teams[isHome ? fixture.team_a : fixture.team_h];
      const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
      return {
        opponent: opponent || 'Unknown',
        isHome,
        difficulty,
        gameweek: fixture.event,
        display: `${isHome ? 'vs' : '@'} ${opponent || 'TBD'}`
      };
    });
  };

  const generateRecommendations = (fixtureData) => {
    setLoading(true);
    setError(null);

    try {
      const budget = (teamData.entry_history?.bank || 0) / 10;
      const currentTeam = teamData.picks.filter(p => p.position <= 11);
      const bench = teamData.picks.filter(p => p.position > 11);

      // Identify underperforming players to transfer out
      const transferOutCandidates = [...currentTeam, ...bench]
        .map(pick => {
          const player = pick.playerData;
          if (!player) return null;

          const form = parseFloat(player.form) || 0;
          const price = player.now_cost / 10;
          const ppg = parseFloat(player.points_per_game) || 0;
          const fixtureDifficulty = getPlayerFixtureDifficulty(player.team, fixtureData);
          const hasInjury = player.status && player.status !== 'a';

          // Score: lower is worse (more likely to transfer out)
          const score = (form * 2) + ppg - (fixtureDifficulty * 0.5) - (hasInjury ? 5 : 0);

          return {
            pick,
            player,
            score,
            form,
            price,
            ppg,
            fixtureDifficulty,
            hasInjury
          };
        })
        .filter(p => p !== null)
        .sort((a, b) => a.score - b.score);

      // Get available players to transfer in
      const teamPlayerIds = teamData.picks.map(p => p.element);
      const availablePlayers = allPlayers
        .filter(p => !teamPlayerIds.includes(p.id))
        .map(player => {
          const form = parseFloat(player.form) || 0;
          const price = player.now_cost / 10;
          const ppg = parseFloat(player.points_per_game) || 0;
          const fixtureDifficulty = getPlayerFixtureDifficulty(player.team, fixtureData);
          const hasInjury = player.status && player.status !== 'a';

          // Score: higher is better (more likely to transfer in)
          const score = (form * 2) + ppg - (fixtureDifficulty * 0.5) - (hasInjury ? 10 : 0);

          return {
            player,
            score,
            form,
            price,
            ppg,
            fixtureDifficulty,
            hasInjury
          };
        })
        .filter(p => !p.hasInjury && p.form > 0)
        .sort((a, b) => b.score - a.score);

      // Generate 3 transfer recommendations
      const transfers = [];
      const usedBudget = budget;
      const transferredOutIds = new Set();
      const transferredInIds = new Set();

      for (let i = 0; i < Math.min(3, transferOutCandidates.length); i++) {
        const outCandidate = transferOutCandidates[i];
        if (transferredOutIds.has(outCandidate.player.id)) continue;

        const sellPrice = outCandidate.price;
        const availableMoney = usedBudget + sellPrice;

        // Find best replacement in same position
        const replacement = availablePlayers.find(p => 
          p.player.element_type === outCandidate.player.element_type &&
          p.price <= availableMoney &&
          !transferredInIds.has(p.player.id) &&
          p.score > outCandidate.score + 1 // Must be meaningfully better
        );

        if (replacement) {
          const fixturesOut = getNextFixtures(outCandidate.player.team, fixtureData);
          const fixturesIn = getNextFixtures(replacement.player.team, fixtureData);

          let justification = '';
          
          if (outCandidate.hasInjury) {
            justification = `${outCandidate.player.web_name} is ${outCandidate.player.status === 'i' ? 'injured' : outCandidate.player.status === 'd' ? 'doubtful' : 'unavailable'}. `;
          }
          
          if (outCandidate.form < 2 && replacement.form > 3) {
            justification += `Upgrade from poor form (${outCandidate.form}) to excellent form (${replacement.form}). `;
          } else if (replacement.form > outCandidate.form + 1) {
            justification += `${replacement.player.web_name} is in better form (${replacement.form} vs ${outCandidate.form}). `;
          }

          if (replacement.fixtureDifficulty < outCandidate.fixtureDifficulty - 0.5) {
            const diffOut = outCandidate.fixtureDifficulty.toFixed(1);
            const diffIn = replacement.fixtureDifficulty.toFixed(1);
            justification += `Much better upcoming fixtures (difficulty ${diffIn} vs ${diffOut}). `;
          } else if (replacement.fixtureDifficulty < outCandidate.fixtureDifficulty - 0.3) {
            justification += `Easier upcoming fixtures. `;
          }

          if (replacement.ppg > outCandidate.ppg + 0.5) {
            justification += `Higher points per game average (${replacement.ppg} vs ${outCandidate.ppg}). `;
          }

          // Highlight specific good fixtures
          const easyFixtures = fixturesIn.filter(f => f.difficulty <= 2);
          if (easyFixtures.length >= 2) {
            justification += `Faces ${easyFixtures.length} easy fixtures in next 3 games. `;
          }

          if (!justification) {
            justification = `Overall better value and performance metrics for a similar price point.`;
          }

          transfers.push({
            out: {
              ...outCandidate.player,
              fixtures: fixturesOut,
              form: outCandidate.form,
              price: sellPrice
            },
            in: {
              ...replacement.player,
              fixtures: fixturesIn,
              form: replacement.form,
              price: replacement.price
            },
            justification: justification.trim(),
            costDiff: replacement.price - sellPrice
          });

          transferredOutIds.add(outCandidate.player.id);
          transferredInIds.add(replacement.player.id);
        }
      }

      setRecommendations(transfers);
      setLoading(false);
    } catch (err) {
      setError('Failed to generate recommendations');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">AI Transfer Recommendations</h2>
              <p className="text-sm opacity-90 mt-1">
                Budget available: £{((teamData.entry_history?.bank || 0) / 10).toFixed(1)}m
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {!loading && !error && recommendations && recommendations.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✓</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Team Looks Great!</h3>
              <p className="text-gray-600">
                No recommended transfers at this time. Your current squad is performing well.
              </p>
            </div>
          )}

          {!loading && !error && recommendations && recommendations.length > 0 && (
            <div className="space-y-6">
              {recommendations.map((transfer, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-bold text-gray-800">Recommended Transfer</h3>
                    <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
                      transfer.costDiff > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {transfer.costDiff > 0 ? `+£${transfer.costDiff.toFixed(1)}m` : 
                       transfer.costDiff < 0 ? `-£${Math.abs(transfer.costDiff).toFixed(1)}m` : 'Same price'}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-4">
                    {/* Transfer Out */}
                    <div className="bg-white rounded-lg p-4 border-2 border-red-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">OUT</div>
                        <span className="text-sm text-gray-600">{teams[transfer.out.team]}</span>
                      </div>
                      <div className="flex gap-4">
                        <img 
                          src={getPhotoUrl(transfer.out.code)}
                          alt={transfer.out.web_name}
                          className="w-20 h-28 object-cover rounded border-2 border-gray-200 bg-gray-100"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 140"%3E%3Crect fill="%23e5e7eb" width="110" height="140"/%3E%3C/svg%3E';
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900">{transfer.out.web_name}</h4>
                            <StatusIcon status={transfer.out.status} />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Price:</span>
                              <span className="font-semibold ml-1">£{transfer.out.price.toFixed(1)}m</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Form:</span>
                              <span className="font-semibold ml-1">{transfer.out.form}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600">Next 3:</span>
                              <div className="text-xs mt-1 space-y-1">
                                {transfer.out.fixtures.map((f, i) => (
                                  <div key={i} className="flex items-center gap-1">
                                    <span className="text-gray-500 w-8">GW{f.gameweek}</span>
                                    <span className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center text-white ${
                                      f.difficulty <= 2 ? 'bg-green-500' : f.difficulty >= 4 ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}>
                                      {f.difficulty}
                                    </span>
                                    <span>{f.display}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transfer In */}
                    <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">IN</div>
                        <span className="text-sm text-gray-600">{teams[transfer.in.team]}</span>
                      </div>
                      <div className="flex gap-4">
                        <img 
                          src={getPhotoUrl(transfer.in.code)}
                          alt={transfer.in.web_name}
                          className="w-20 h-28 object-cover rounded border-2 border-gray-200 bg-gray-100"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 140"%3E%3Crect fill="%23e5e7eb" width="110" height="140"/%3E%3C/svg%3E';
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900">{transfer.in.web_name}</h4>
                            <StatusIcon status={transfer.in.status} />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Price:</span>
                              <span className="font-semibold ml-1">£{transfer.in.price.toFixed(1)}m</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Form:</span>
                              <span className="font-semibold ml-1">{transfer.in.form}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600">Next 3:</span>
                              <div className="text-xs mt-1 space-y-1">
                                {transfer.in.fixtures.map((f, i) => (
                                  <div key={i} className="flex items-center gap-1">
                                    <span className="text-gray-500 w-8">GW{f.gameweek}</span>
                                    <span className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center text-white ${
                                      f.difficulty <= 2 ? 'bg-green-500' : f.difficulty >= 4 ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}>
                                      {f.difficulty}
                                    </span>
                                    <span>{f.display}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Justification */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Why this transfer?</h4>
                        <p className="text-sm text-blue-800">{transfer.justification}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-sm text-gray-700">
                <p className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>Note:</strong> These recommendations are based on current form, fixture difficulty, and available budget. 
                    Always consider your team strategy, upcoming gameweeks, and player news before making transfers.
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferRecommendations;
