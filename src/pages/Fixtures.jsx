import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchFPL } from '../utils/fplApi';
import FixtureModal from '../components/FixtureModal';
import { TEAM_BADGES } from '../utils/teamBadges';

const Fixtures = ({ teams, allPlayers, onPlayerClick, onTeamClick }) => {
  const { gameweek } = useParams();
  const navigate = useNavigate();
  const [fixtures, setFixtures] = useState([]);
  const [currentGameweek, setCurrentGameweek] = useState(null);
  const [displayedGameweek, setDisplayedGameweek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFixture, setSelectedFixture] = useState(null);

  useEffect(() => {
    fetchFixtures(gameweek ? parseInt(gameweek) : null);
  }, [gameweek]);

  const fetchFixtures = async (gw = null) => {
    try {
      setLoading(true);
      
      const bootstrapData = await fetchFPL('bootstrap-static');
      const currentGW = bootstrapData.events.find(event => event.is_current)?.id || 15;
      setCurrentGameweek(currentGW);
      
      const targetGW = gw || currentGW;
      setDisplayedGameweek(targetGW);
      
      const fixturesData = await fetchFPL('fixtures');
      
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
      navigate(`/fixtures/${displayedGameweek - 1}`);
    }
  };

  const goToNextGameweek = () => {
    if (displayedGameweek < 38) {
      navigate(`/fixtures/${displayedGameweek + 1}`);
    }
  };

  const goToCurrentGameweek = () => {
    navigate(`/fixtures/${currentGameweek}`);
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
    return TEAM_BADGES[teamId] ? TEAM_BADGES[teamId].replace('/badges/70/', '/badges/50/') : null;
  };

  if (loading) {
    return (
      <div className="p-4 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center text-gray-500">Loading fixtures...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:px-8 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header with Navigation */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {displayedGameweek > 1 && (
              <button
                onClick={goToPreviousGameweek}
                className="bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition"
                title="Previous gameweek"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {displayedGameweek > currentGameweek && (
              <button
                onClick={goToCurrentGameweek}
                className="bg-blue-600 text-white rounded-lg shadow-md px-3 py-2 hover:bg-blue-700 transition flex items-center gap-1"
                title="Go to current gameweek"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
                <span className="text-xs font-medium">Current</span>
              </button>
            )}

            <h1 className="text-2xl font-bold text-gray-800">
              Gameweek {displayedGameweek} Fixtures
            </h1>

            {displayedGameweek < currentGameweek && (
              <button
                onClick={goToCurrentGameweek}
                className="bg-blue-600 text-white rounded-lg shadow-md px-3 py-2 hover:bg-blue-700 transition flex items-center gap-1"
                title="Go to current gameweek"
              >
                <span className="text-xs font-medium">Current</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {displayedGameweek < 38 && (
              <button
                onClick={goToNextGameweek}
                className="bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition"
                title="Next gameweek"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Fixtures Grid */}
          <div className="space-y-3">
            {fixtures.map((fixture) => (
              <div
                key={fixture.id}
                onClick={() => setSelectedFixture(fixture)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                  fixture.finished ? 'bg-gray-50 border-gray-300 hover:border-gray-400' : 'bg-white border-blue-200 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Home Team */}
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={getTeamBadgeUrl(fixture.team_h)}
                      alt={teams[fixture.team_h]}
                      className="w-10 h-10 object-contain"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <span 
                      className="text-lg font-semibold text-gray-800 hover:text-blue-600 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTeamClick && onTeamClick(fixture.team_h);
                      }}
                    >
                      {teams[fixture.team_h]}
                    </span>
                  </div>

                  {/* Score or Time */}
                  <div className="px-6 text-center">
                    {fixture.finished ? (
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-900">{fixture.team_h_score}</span>
                        <span className="text-gray-400">-</span>
                        <span className="text-2xl font-bold text-gray-900">{fixture.team_a_score}</span>
                      </div>
                    ) : fixture.started ? (
                      <span className="text-sm font-medium text-red-600 animate-pulse">Live</span>
                    ) : (
                      <span className="text-sm text-gray-600">
                        {formatKickoffTime(fixture.kickoff_time)}
                      </span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <span 
                      className="text-lg font-semibold text-gray-800 hover:text-blue-600 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTeamClick && onTeamClick(fixture.team_a);
                      }}
                    >
                      {teams[fixture.team_a]}
                    </span>
                    <img
                      src={getTeamBadgeUrl(fixture.team_a)}
                      alt={teams[fixture.team_a]}
                      className="w-10 h-10 object-contain"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
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

export default Fixtures;
