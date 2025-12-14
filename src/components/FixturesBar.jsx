import { useState, useEffect } from 'react';

const FixturesBar = ({ teams }) => {
  const [fixtures, setFixtures] = useState([]);
  const [currentGameweek, setCurrentGameweek] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFixtures();
  }, []);

  const fetchFixtures = async () => {
    try {
      setLoading(true);
      
      // Fetch current gameweek info
      const bootstrapResponse = await fetch('/api/bootstrap-static/');
      const bootstrapData = await bootstrapResponse.json();
      const currentGW = bootstrapData.events.find(event => event.is_current)?.id || 15;
      setCurrentGameweek(currentGW);
      
      // Fetch all fixtures
      const fixturesResponse = await fetch('/api/fixtures/');
      const fixturesData = await fixturesResponse.json();
      
      // Filter fixtures for current gameweek and sort by kickoff time
      const gwFixtures = fixturesData
        .filter(fixture => fixture.event === currentGW)
        .sort((a, b) => new Date(a.kickoff_time) - new Date(b.kickoff_time));
      
      setFixtures(gwFixtures);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch fixtures:', err);
      setLoading(false);
    }
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
    return `https://resources.premierleague.com/premierleague/badges/50/t${teamId}.png`;
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
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
        Gameweek {currentGameweek} Fixtures
      </h2>
      
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-2 justify-around" style={{ minWidth: 'min-content' }}>
          {fixtures.map((fixture) => (
            <div
              key={fixture.id}
              className={`flex-shrink-0 border-2 rounded-lg p-3 min-w-[200px] ${
                fixture.finished ? 'bg-gray-50 border-gray-300' : 'bg-white border-blue-200'
              }`}
            >
              {/* Teams */}
              <div className="space-y-2 mb-2">
                {/* Home Team */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/*<img
                      src={getTeamBadgeUrl(fixture.team_h)}
                      alt={teams[fixture.team_h]}
                      className="w-6 h-6 object-contain flex-shrink-0"
                      onError={(e) => e.target.style.display = 'none'}
                    />*/}
                    <span className="text-sm font-semibold text-gray-800 truncate">
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
                    {/*}
                    <img
                      src={getTeamBadgeUrl(fixture.team_a)}
                      alt={teams[fixture.team_a]}
                      className="w-6 h-6 object-contain flex-shrink-0"
                      onError={(e) => e.target.style.display = 'none'}
                    />*/}
                    <span className="text-sm font-semibold text-gray-800 truncate">
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
    </div>
  );
};

export default FixturesBar;
