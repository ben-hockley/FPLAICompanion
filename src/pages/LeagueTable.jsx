import { useState, useEffect } from 'react';
import { TEAM_BADGES } from '../utils/teamBadges';
import { fetchFPLApi } from '../utils/api';

const LeagueTable = ({ teams, onTeamClick }) => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    calculateLeagueTable();
  }, []);

  const calculateLeagueTable = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all fixtures
      const response = await fetchFPLApi('fixtures/');
      if (!response.ok) {
        throw new Error(`Failed to fetch fixtures (${response.status})`);
      }

      const fixtures = await response.json();

      // Initialize table data for each team
      const table = {};
      Object.keys(teams).forEach(teamId => {
        table[teamId] = {
          teamId: parseInt(teamId),
          teamName: teams[teamId],
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          cleanSheets: 0,
          points: 0
        };
      });

      // Process finished fixtures only
      const finishedFixtures = fixtures.filter(f => f.finished);
      
      finishedFixtures.forEach(fixture => {
        const homeTeam = table[fixture.team_h];
        const awayTeam = table[fixture.team_a];

        if (!homeTeam || !awayTeam) return;

        // Update games played
        homeTeam.played++;
        awayTeam.played++;

        // Update goals
        homeTeam.goalsFor += fixture.team_h_score;
        homeTeam.goalsAgainst += fixture.team_a_score;
        awayTeam.goalsFor += fixture.team_a_score;
        awayTeam.goalsAgainst += fixture.team_h_score;

        // Clean sheets
        if (fixture.team_h_score === 0) {
          awayTeam.cleanSheets++;
        }
        if (fixture.team_a_score === 0) {
          homeTeam.cleanSheets++;
        }

        // Determine result
        if (fixture.team_h_score > fixture.team_a_score) {
          // Home win
          homeTeam.won++;
          homeTeam.points += 3;
          awayTeam.lost++;
        } else if (fixture.team_h_score < fixture.team_a_score) {
          // Away win
          awayTeam.won++;
          awayTeam.points += 3;
          homeTeam.lost++;
        } else {
          // Draw
          homeTeam.drawn++;
          awayTeam.drawn++;
          homeTeam.points++;
          awayTeam.points++;
        }

        // Update goal difference
        homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
        awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;
      });

      // Convert to array and sort
      const sortedTable = Object.values(table).sort((a, b) => {
        // Sort by points (descending)
        if (b.points !== a.points) return b.points - a.points;
        // Then by goal difference (descending)
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        // Then by goals scored (descending)
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        // Then alphabetically by team name
        return a.teamName.localeCompare(b.teamName);
      });

      setTableData(sortedTable);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getTeamBadgeUrl = (teamId) => {
    return TEAM_BADGES[teamId] || null;
  };

  const handleTeamRowClick = (teamId) => {
    onTeamClick && onTeamClick(teamId);
  };

  if (loading) {
    return (
      <div className="p-4 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Getting latest table...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-semibold">Error loading table</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:px-8 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-3 border-b-2 border-gray-200">
            Premier League Table
          </h2>
          
          {tableData.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="text-left p-3 font-bold text-gray-700 text-sm">Pos</th>
                    <th className="text-left p-3 font-bold text-gray-700 text-sm">Team</th>
                    <th className="text-center p-3 font-bold text-gray-700 text-sm">P</th>
                    <th className="text-center p-3 font-bold text-gray-700 text-sm">W</th>
                    <th className="text-center p-3 font-bold text-gray-700 text-sm">D</th>
                    <th className="text-center p-3 font-bold text-gray-700 text-sm">L</th>
                    <th className="text-center p-3 font-bold text-gray-700 text-sm">GF</th>
                    <th className="text-center p-3 font-bold text-gray-700 text-sm">GA</th>
                    <th className="text-center p-3 font-bold text-gray-700 text-sm">GD</th>
                    <th className="text-center p-3 font-bold text-gray-700 text-sm">CS</th>
                    <th className="text-center p-3 font-bold text-gray-700 text-sm bg-blue-100">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((team, index) => (
                    <tr
                      key={team.teamId}
                      onClick={() => handleTeamRowClick(team.teamId)}
                      className="border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="p-3 text-center font-semibold text-gray-700">{index + 1}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {getTeamBadgeUrl(team.teamId) && (
                            <img
                              src={getTeamBadgeUrl(team.teamId)}
                              alt={team.teamName}
                              className="w-8 h-8 object-contain flex-shrink-0"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          )}
                          <span className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                            {team.teamName}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center text-gray-700">{team.played}</td>
                      <td className="p-3 text-center text-gray-700">{team.won}</td>
                      <td className="p-3 text-center text-gray-700">{team.drawn}</td>
                      <td className="p-3 text-center text-gray-700">{team.lost}</td>
                      <td className="p-3 text-center text-gray-700">{team.goalsFor}</td>
                      <td className="p-3 text-center text-gray-700">{team.goalsAgainst}</td>
                      <td className="p-3 text-center text-gray-700 font-medium">
                        {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                      </td>
                      <td className="p-3 text-center text-gray-700">{team.cleanSheets}</td>
                      <td className="p-3 text-center font-bold text-blue-600 bg-blue-50">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeagueTable;
