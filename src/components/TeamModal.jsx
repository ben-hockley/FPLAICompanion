import { useState, useEffect } from 'react';
import { TEAM_BADGES } from '../utils/teamBadges';
import StatusIcon from './StatusIcon';
import FixtureModal from './FixtureModal';
import { getCountryCode } from '../utils/regionFlags';
import * as flags from 'country-flag-icons/react/3x2';
import { EnglandFlag, ScotlandFlag, WalesFlag, NorthernIrelandFlag } from '../utils/UKFlags';

const TeamModal = ({ teamId, teamName, allPlayers, onClose, onPlayerClick, onTeamClick }) => {
  const [teamPlayers, setTeamPlayers] = useState({ GK: [], DEF: [], MID: [], FWD: [] });
  const [loading, setLoading] = useState(true);
  const [fixtures, setFixtures] = useState([]);
  const [teams, setTeams] = useState({});
  const [loadingFixtures, setLoadingFixtures] = useState(true);
  const [selectedFixture, setSelectedFixture] = useState(null);

  useEffect(() => {
    if (teamId && allPlayers) {
      loadTeamSquad();
      loadTeamFixtures();
    }
  }, [teamId, allPlayers]);

  const loadTeamSquad = () => {
    setLoading(true);
    
    // Filter players by team
    const squad = allPlayers.filter(p => p.team === teamId);
    
    // Sort by position
    const sorted = {
      GK: squad.filter(p => p.element_type === 1).sort((a, b) => b.total_points - a.total_points),
      DEF: squad.filter(p => p.element_type === 2).sort((a, b) => b.total_points - a.total_points),
      MID: squad.filter(p => p.element_type === 3).sort((a, b) => b.total_points - a.total_points),
      FWD: squad.filter(p => p.element_type === 4).sort((a, b) => b.total_points - a.total_points)
    };
    
    setTeamPlayers(sorted);
    setLoading(false);
  };

  const loadTeamFixtures = async () => {
    setLoadingFixtures(true);
    try {
      // Fetch all fixtures
      const fixturesResponse = await fetch('/api/fixtures/');
      const fixturesData = await fixturesResponse.json();

      // Fetch teams for names
      const bootstrapResponse = await fetch('/api/bootstrap-static/');
      const bootstrapData = await bootstrapResponse.json();
      
      const teamMap = {};
      bootstrapData.teams.forEach(team => {
        teamMap[team.id] = team.name;
      });
      setTeams(teamMap);

      // Filter fixtures for this team and sort by gameweek
      const teamFixtures = fixturesData
        .filter(f => f.team_h === teamId || f.team_a === teamId)
        .sort((a, b) => a.event - b.event);

      setFixtures(teamFixtures);
    } catch (error) {
      console.error('Error loading fixtures:', error);
    } finally {
      setLoadingFixtures(false);
    }
  };

  const getPlayerImageUrl = (playerCode) => {
    return `https://resources.premierleague.com/premierleague25/photos/players/110x140/${playerCode}.png`;
  };

  const getTeamBadgeUrl = (tid) => {
    return TEAM_BADGES[tid] || null;
  };

  const handlePlayerClick = (player) => {
    onClose();
    onPlayerClick(player);
  };

  const renderFlag = (regionId) => {
    const countryCode = getCountryCode(regionId);
    if (!countryCode) return null;

    // Handle UK countries with custom flags
    if (countryCode === 'ENG') {
      return <EnglandFlag className="w-4 h-3 inline-block rounded shadow-sm" />;
    } else if (countryCode === 'SCT') {
      return <ScotlandFlag className="w-4 h-3 inline-block rounded shadow-sm" />;
    } else if (countryCode === 'WLS') {
      return <WalesFlag className="w-4 h-3 inline-block rounded shadow-sm" />;
    } else if (countryCode === 'NIR') {
      return <NorthernIrelandFlag className="w-4 h-3 inline-block rounded shadow-sm" />;
    } else {
      // Use country-flag-icons for other countries
      const FlagComponent = flags[countryCode];
      return FlagComponent ? <FlagComponent className="w-4 h-3 inline-block rounded shadow-sm" title={countryCode} /> : null;
    }
  };

  const getDisplayName = (player) => {
    const fullName = `${player.first_name} ${player.second_name}`;
    return fullName.length <= 20 ? fullName : player.web_name;
  };

  const formatKickoffTime = (kickoffTime) => {
    if (!kickoffTime) return 'TBD';
    const date = new Date(kickoffTime);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFixtureClick = (fixture) => {
    setSelectedFixture(fixture);
  };

  const PlayerCard = ({ player }) => (
    <div
      onClick={() => handlePlayerClick(player)}
      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer flex flex-col items-center gap-2"
    >
      <img
        src={getPlayerImageUrl(player.code)}
        alt={player.web_name}
        className="w-16 h-20 object-contain"
        onError={(e) => {
          e.target.src = 'https://resources.premierleague.com/premierleague25/photos/players/110x140/placeholder.png';
        }}
      />
      <div className="text-center w-full">
        <div className="text-sm font-semibold text-gray-900 truncate flex items-center justify-center gap-1">
          {renderFlag(player.region)}
          <span>{getDisplayName(player)}</span>
          <StatusIcon status={player.status} news={player.news} />
        </div>
        <div className="flex justify-between items-center mt-1 text-xs">
          <span className="text-blue-600 font-semibold">£{player.now_cost / 10}m</span>
          <span className="text-gray-700">{player.total_points} pts</span>
        </div>
      </div>
    </div>
  );

  const PositionSection = ({ title, players }) => (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-gray-200 pb-2">
        {title}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {players.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
      {players.length === 0 && (
        <div className="text-sm text-gray-500 italic">No players</div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getTeamBadgeUrl(teamId) && (
              <img
                src={getTeamBadgeUrl(teamId)}
                alt={teamName}
                className="w-12 h-12 object-contain"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            <h2 className="text-2xl font-bold">{teamName}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Fixtures Section */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Season Fixtures</h3>
          {loadingFixtures ? (
            <div className="text-sm text-gray-500">Loading fixtures...</div>
          ) : fixtures.length === 0 ? (
            <div className="text-sm text-gray-500">No fixtures available</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-3 pb-2" style={{ minWidth: 'min-content' }}>
                {fixtures.map((fixture) => {
                  const isHome = fixture.team_h === teamId;
                  const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
                  
                  return (
                    <div
                      key={fixture.id}
                      onClick={() => handleFixtureClick(fixture)}
                      className={`flex-shrink-0 border-2 rounded-lg p-3 min-w-[200px] cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                        fixture.finished ? 'bg-gray-50 border-gray-300 hover:border-gray-400' : 'bg-white border-blue-200 hover:border-blue-400'
                      }`}
                    >
                      {/* Gameweek and Home/Away */}
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-600">GW {fixture.event}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          isHome ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {isHome ? 'Home' : 'Away'}
                        </span>
                      </div>

                      {/* Teams */}
                      <div className="space-y-2 mb-2">
                        {/* Home Team */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <img
                              src={getTeamBadgeUrl(fixture.team_h)}
                              alt={teams[fixture.team_h]}
                              className="w-6 h-6 object-contain flex-shrink-0"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                            <span className={`text-sm font-semibold truncate ${
                              fixture.team_h === teamId ? 'text-blue-600' : 'text-gray-800'
                            }`}>
                              {teams[fixture.team_h]}
                            </span>
                          </div>
                          {fixture.finished && (
                            <span className="text-lg font-bold text-gray-900 flex-shrink-0">
                              {fixture.team_h_score}
                            </span>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <img
                              src={getTeamBadgeUrl(fixture.team_a)}
                              alt={teams[fixture.team_a]}
                              className="w-6 h-6 object-contain flex-shrink-0"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                            <span className={`text-sm font-semibold truncate ${
                              fixture.team_a === teamId ? 'text-blue-600' : 'text-gray-800'
                            }`}>
                              {teams[fixture.team_a]}
                            </span>
                          </div>
                          {fixture.finished && (
                            <span className="text-lg font-bold text-gray-900 flex-shrink-0">
                              {fixture.team_a_score}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Kickoff Time or Status */}
                      <div className="text-center pt-2 border-t border-gray-200">
                        {fixture.finished ? (
                          <span className="text-xs font-medium text-green-600">Full Time</span>
                        ) : fixture.started ? (
                          <span className="text-xs font-medium text-red-600 animate-pulse">Live</span>
                        ) : (
                          <span className="text-xs text-gray-600">
                            {formatKickoffTime(fixture.kickoff_time)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading squad...</div>
          ) : (
            <>
              <PositionSection title="Goalkeepers" players={teamPlayers.GK} />
              <PositionSection title="Defenders" players={teamPlayers.DEF} />
              <PositionSection title="Midfielders" players={teamPlayers.MID} />
              <PositionSection title="Forwards" players={teamPlayers.FWD} />
            </>
          )}
        </div>
      </div>

      {/* Fixture Modal */}
      {selectedFixture && (
        <FixtureModal
          fixture={selectedFixture}
          teams={teams}
          allPlayers={allPlayers}
          onClose={() => setSelectedFixture(null)}
          onPlayerClick={onPlayerClick}
          onTeamClick={(newTeamId) => {
            setSelectedFixture(null); // Close fixture modal
            onClose(); // Close current team modal
            onTeamClick && onTeamClick(newTeamId); // Open new team modal
          }}
        />
      )}
    </div>
  );
};

export default TeamModal;
