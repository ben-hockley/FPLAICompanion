import { useState, useEffect } from 'react';
import FixtureModal from './FixtureModal';
import { TEAM_BADGES } from '../utils/teamBadges';

const FixturesBar = ({ teams, allPlayers, onPlayerClick, onTeamClick }) => {
  const [fixtures, setFixtures] = useState([]);
  const [currentGameweek, setCurrentGameweek] = useState(null); // Actual current GW
  const [displayedGameweek, setDisplayedGameweek] = useState(null); // GW being displayed
  const [loading, setLoading] = useState(true);
  const [selectedFixture, setSelectedFixture] = useState(null);

  useEffect(() => {
    fetchFixtures();
  }, []);

  const fetchFixtures = async (gameweek = null) => {
    try {
      setLoading(true);
      
      // Fetch current gameweek info
      const bootstrapResponse = await fetch('/api/bootstrap-static/');
      const bootstrapData = await bootstrapResponse.json();
      const currentGW = bootstrapData.events.find(event => event.is_current)?.id || 15;
      setCurrentGameweek(currentGW);
      
      // Use provided gameweek or default to current
      const targetGW = gameweek || currentGW;
      setDisplayedGameweek(targetGW);
      
      // Fetch all fixtures
      const fixturesResponse = await fetch('/api/fixtures/');
      const fixturesData = await fixturesResponse.json();
      
      // Filter fixtures for target gameweek and sort by kickoff time
      const gwFixtures = fixturesData
        .filter(fixture => fixture.event === targetGW)
        .sort((a, b) => new Date(a.kickoff_time) - new Date(b.kickoff_time));
      
      setFixtures(gwFixtures);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch fixtures:', err);
      setLoading(false);
    }
  };

  const goToPreviousGameweek = () => {
    if (displayedGameweek > 1) {
      fetchFixtures(displayedGameweek - 1);
    }
  };

  const goToNextGameweek = () => {
    if (displayedGameweek < 38) {
      fetchFixtures(displayedGameweek + 1);
    }
  };

  const goToCurrentGameweek = () => {
    fetchFixtures(currentGameweek);
  };

  const formatKickoffTime = (kickoffTime) => {
    const date = new Date(kickoffTime);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();
    
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
      return `Today ${timeStr}`;
    } else if (isTomorrow) {
      return `Tomorrow ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      return `${dateStr} ${timeStr}`;
    }
  };

  const getTeamBadgeUrl = (teamId) => {
    // Prefer explicit map entry, fall back to CDN template with 50px badges
    return TEAM_BADGES[teamId] ? TEAM_BADGES[teamId].replace('/badges/70/', '/badges/50/') : null;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 1: return 'bg-green-100 border-green-300';
      case 2: return 'bg-green-50 border-green-200';
      case 3: return 'bg-gray-100 border-gray-300';
      case 4: return 'bg-orange-50 border-orange-200';
      case 5: return 'bg-red-100 border-red-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="text-center text-gray-500">Loading fixtures...</div>
      </div>
    );
  }

  if (fixtures.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
      <div className="flex items-center justify-center gap-3 mb-4">
        {/* Previous Gameweek Button */}
        {displayedGameweek > 1 && (
          <button
            onClick={goToPreviousGameweek}
            disabled={loading}
            className="bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous gameweek"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Jump to Current Gameweek (left side - when viewing future) */}
        {displayedGameweek > currentGameweek && (
          <button
            onClick={goToCurrentGameweek}
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg shadow-md px-3 py-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Go to current gameweek"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            <span className="text-xs font-medium">Current</span>
          </button>
        )}

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-800">
          Gameweek {displayedGameweek} Fixtures
        </h2>

        {/* Jump to Current Gameweek (right side - when viewing past) */}
        {displayedGameweek < currentGameweek && (
          <button
            onClick={goToCurrentGameweek}
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg shadow-md px-3 py-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Go to current gameweek"
          >
            <span className="text-xs font-medium">Current</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Next Gameweek Button */}
        {displayedGameweek < 38 && (
          <button
            onClick={goToNextGameweek}
            disabled={loading}
            className="bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next gameweek"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-2 justify-around" style={{ minWidth: 'min-content' }}>
          {fixtures.map((fixture) => (
            <div
              key={fixture.id}
              onClick={() => setSelectedFixture(fixture)}
              className={`flex-shrink-0 border-2 rounded-lg p-3 min-w-[200px] cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                fixture.finished ? 'bg-gray-50 border-gray-300 hover:border-gray-400' : 'bg-white border-blue-200 hover:border-blue-400'
              }`}
            >
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
                    <span 
                      className="text-sm font-semibold text-gray-800 truncate hover:text-blue-600 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTeamClick && onTeamClick(fixture.team_h);
                      }}
                    >
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
                    <span 
                      className="text-sm font-semibold text-gray-800 truncate hover:text-blue-600 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTeamClick && onTeamClick(fixture.team_a);
                      }}
                    >
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
          ))}
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
          onTeamClick={onTeamClick}
        />
      )}
    </div>
  );
};

export default FixturesBar;
