import { useState, useEffect, useRef } from 'react';

const Navbar = ({ players = [], teams = {}, onPlayerClick, onTeamClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [filteredResults, setFilteredResults] = useState({ players: [], teams: [] });
  const searchRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter results based on search query (accent-insensitive)
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setFilteredResults({ players: [], teams: [] });
      setShowResults(false);
      return;
    }

    // Normalize string by removing diacritics and lowercasing
    const normalize = (s) => (
      (s || '')
        .normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s
    ).toLowerCase();

    const q = normalize(searchQuery);

    // Filter players (normalize names to handle accents)
    const matchedPlayers = players
      .filter(player => {
        const web = normalize(player.web_name || '');
        const first = normalize(player.first_name || '');
        const second = normalize(player.second_name || '');
        return web.includes(q) || first.includes(q) || second.includes(q);
      })
      .slice(0, 10);

    // Filter teams (normalize team names)
    const matchedTeams = Object.entries(teams)
      .map(([id, name]) => ({ id: parseInt(id), name, nameNorm: normalize(name) }))
      .filter(t => t.nameNorm.includes(q))
      .map(t => ({ id: t.id, name: t.name }))
      .slice(0, 5);

    setFilteredResults({ players: matchedPlayers, teams: matchedTeams });
    setShowResults(true);
  }, [searchQuery, players, teams]);

  const handlePlayerSelect = (player) => {
    if (onPlayerClick) {
      onPlayerClick(player);
    }
    setSearchQuery('');
    setShowResults(false);
  };

  const handleTeamSelect = (teamId) => {
    if (onTeamClick) {
      onTeamClick(teamId);
    }
    setSearchQuery('');
    setShowResults(false);
  };

  const hasResults = filteredResults.players.length > 0 || filteredResults.teams.length > 0;

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg fixed top-0 left-24 right-0 z-40">
      <div className="max-w-full mx-auto px-8">
        <div className="flex items-center justify-center h-16">
          {/* Search Bar */}
          <div className="w-full max-w-2xl" ref={searchRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 2 && hasResults && setShowResults(true)}
                className="block w-full pl-10 pr-3 py-2 border border-blue-400 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent placeholder-gray-500 text-gray-900"
                placeholder="Search players, teams, or stats..."
              />

              {/* Search Results Dropdown */}
              {showResults && hasResults && (
                <div 
                  className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                  style={{ maxHeight: '50vh' }}
                >
                  <div className="overflow-y-auto" style={{ maxHeight: '50vh' }}>
                    {/* Teams Section */}
                    {filteredResults.teams.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
                          <h3 className="text-xs font-semibold text-gray-600 uppercase">Teams</h3>
                        </div>
                        {filteredResults.teams.map((team) => (
                          <button
                            key={`team-${team.id}`}
                            onClick={() => handleTeamSelect(team.id)}
                            className="w-full px-4 py-3 hover:bg-blue-50 text-left transition-colors border-b border-gray-100 flex items-center gap-3"
                          >
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-sm">T</span>
                            </div>
                            <span className="text-gray-900 font-medium">{team.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Players Section */}
                    {filteredResults.players.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
                          <h3 className="text-xs font-semibold text-gray-600 uppercase">Players</h3>
                        </div>
                        {filteredResults.players.map((player) => (
                          <button
                            key={`player-${player.id}`}
                            onClick={() => handlePlayerSelect(player)}
                            className="w-full px-4 py-3 hover:bg-blue-50 text-left transition-colors border-b border-gray-100 flex items-center gap-3"
                          >
                            <img
                              src={`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`}
                              alt={player.web_name}
                              className="w-10 h-14 object-cover rounded"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/40x56/E5E7EB/6B7280?text=Player';
                              }}
                            />
                            <div className="flex-1">
                              <div className="text-gray-900 font-medium">{player.web_name}</div>
                              <div className="text-sm text-gray-500">
                                {teams[player.team]} • £{(player.now_cost / 10).toFixed(1)}m
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
