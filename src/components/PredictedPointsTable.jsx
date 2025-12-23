/**
 * FPL Prediction Engine
 * A robust algorithm for forecasting player performance in the Fantasy Premier League.
 * 
 * Features:
 * - Simplified Predicted Points Calculation.
 * - Uses ICT Index to estimate goal and assist probabilities.
 */

import { fetchFPL } from '../utils/fplApi';

class FPLPredictor {
    constructor() {
        this.bootstrap = null;
        this.activePlayers = [];
        this.teamNames = {};
    }

    async init() {
        console.log("Initializing FPL Data...");
        
        try {
            this.bootstrap = await fetchFPL('bootstrap-static');

            // Build team name lookup
            this.bootstrap.teams.forEach(team => {
                this.teamNames[team.id] = team.name;
            });

            // Find upcoming gameweek (first with finished = false)
            const upcomingGW = this.bootstrap.events.find(event => event.finished === false);
            this.nextGwId = upcomingGW ? upcomingGW.id : null;
            console.log(`Upcoming Gameweek: ${this.nextGwId}`);

            // Filter for Active Players (not unavailable, not away)
            this.activePlayers = this.bootstrap.elements.filter(p => p.status !== 'u' && p.status !== 'n');
            console.log(`Active Players identified: ${this.activePlayers.length}`);

        } catch (error) {
            console.error("Initialization Error:", error);
            throw error;
        }
    }

    async generatePredictions() {
        const predictions = [];
        
        console.log("Starting prediction cycle...");

        // Process all active players directly - no need to fetch individual data
        for (let i = 0; i < this.activePlayers.length; i++) {
            const player = this.activePlayers[i];
            const prediction = this.analyzePlayer(player);
            predictions.push(prediction);
            
            // Progress Logging
            if ((i + 1) % 100 === 0) {
                console.log(`Processed ${i + 1} players...`);
            }
        }

        // Sort by Predicted Points Descending
        return predictions.sort((a, b) => b.predicted_points - a.predicted_points);
    }

    analyzePlayer(player) {
        // Get ICT scores from bootstrap data
        const threat = parseFloat(player.threat) || 0;
        const creativity = parseFloat(player.creativity) || 0;
        
        // Simplified predictions
        const goalProb = threat * 0.0015;
        const assistProb = creativity * 0.001;

        // Replace with team-wide clean sheet probability.
        const cleanSheetProb = (player.starts > 6) ? parseFloat(player.clean_sheets_per_90) || 0 : 0;
        
        const positionId = player.element_type; // 1:GK, 2:DEF, 3:MID, 4:FWD
        
        // Base points for playing 90 minutes (skip if injured or suspended)
        let predictedPoints = 2;
        
        // Add points based on position and probabilities
        if (positionId === 1) { // GK
            predictedPoints += (goalProb * 6) + (assistProb * 3) + (cleanSheetProb * 4) + 0.5;
        } else if (positionId === 2) { // DEF
            predictedPoints += (goalProb * 6) + (assistProb * 3) + (cleanSheetProb * 4);
        } else if (positionId === 3) { // MID
            predictedPoints += (goalProb * 5) + (assistProb * 3) + (cleanSheetProb * 1);
        } else if (positionId === 4) { // FWD
            predictedPoints += (goalProb * 4) + (assistProb * 3);
        }
        
        // Bonus points for high defensive contributions, add for players that surpass the threshold on average
        const defCon = parseFloat(player.defensive_contribution_per_90) || 0;
        if ((positionId === 3 || positionId === 4) && defCon > 12) {
            predictedPoints += 2;
        } else if (positionId === 2 && defCon > 10) {
            predictedPoints += 2;
        }
        
        return this.formatOutput(player, predictedPoints, goalProb, assistProb, cleanSheetProb);
    }

    formatOutput(player, points, goalProb, assistProb, cleanSheetProb) {
        const cost = player.now_cost / 10;
        let pPoints = parseFloat(points.toFixed(2));
        const positionId = player.element_type;
        return {
            id: player.id,
            name: player.web_name,
            status: player.status,
            news: player.news || "",
            team: this.teamNames[player.team],
            team_id: player.team,
            position: positionId === 1 ? 'GK' : positionId === 2 ? 'DEF' : positionId === 3 ? 'MID' : 'FWD',
            cost: cost,
            fixtures: 1, // Assume 1 fixture
            // Injured (I) or Suspended (S) => nailedness 0

            // Replace with more accurate assessment if player is likely to start
            nailedness: (player.status == "i" || player.status == "s" || player.status == "n") ? 0.0 : 1.0, // Set nailedness to 0 if injured/suspended/away
            
            goal_prob: parseFloat((goalProb || 0).toFixed(2)), // Simplify probabilities to 2 d.p
            assist_prob: parseFloat((assistProb || 0).toFixed(2)),
            clean_sheet_prob: positionId === 4 ? null : parseFloat((cleanSheetProb || 0).toFixed(2)),
            predicted_points: (player.status == "i" || player.status == "s" || player.status == "n") ? 0.0 : pPoints, // Set predicted points to 0 if injured/suspended/away
            roi: parseFloat((pPoints / cost).toFixed(2))
        };
    }
}

// React Component
import { useState, useEffect } from 'react';
import PlayerModal from './PlayerModal';
import StatusIcon from './StatusIcon';

export default function PredictedPointsTable({ myTeamPlayerIds = [], onTeamClick }) {
    const [allPlayers, setAllPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [gameweek, setGameweek] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'predicted_points', direction: 'desc' });
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [fullPlayersData, setFullPlayersData] = useState([]);
    const [teams, setTeams] = useState({});
    const [showMyTeamOnly, setShowMyTeamOnly] = useState(false);

    const POSITION_MAP = {
        'GK': 1,
        'DEF': 2,
        'MID': 3,
        'FWD': 4
    };

    const formatPercentage = (value) => {
        if (value === null) return '-';
        return `${(value * 100).toFixed(0)}%`;
    };

    useEffect(() => {
        async function fetchPredictions() {
            try {
                setLoading(true);
                
                // Fetch full player data for modal (uses static fallback)
                const data = await fetchFPL('bootstrap-static');
                
                // Create team map
                const teamMap = {};
                data.teams.forEach(team => {
                    teamMap[team.id] = team.name;
                });
                setTeams(teamMap);
                setFullPlayersData(data.elements);
                
                // Generate predictions
                const predictor = new FPLPredictor();
                await predictor.init();
                const rankings = await predictor.generatePredictions();

                setGameweek(predictor.nextGwId);
                setAllPlayers(rankings); // Store all players
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        }

        fetchPredictions();
    }, []);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedPlayers = () => {
        // Filter by my team if checkbox is checked
        let filteredPlayers = allPlayers;
        if (showMyTeamOnly && myTeamPlayerIds.length > 0) {
            filteredPlayers = allPlayers.filter(p => myTeamPlayerIds.includes(p.id));
        }
        
        const sortedPlayers = [...filteredPlayers];
        
        sortedPlayers.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Special handling for different data types
            if (sortConfig.key === 'name' || sortConfig.key === 'team') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            } else if (sortConfig.key === 'position') {
                aValue = POSITION_MAP[a.position];
                bValue = POSITION_MAP[b.position];
            } else {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return sortedPlayers;
    };

    const getSortIndicator = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <span className="ml-1 text-blue-200">⇅</span>;
        }
        return sortConfig.direction === 'asc' ? 
            <span className="ml-1">↑</span> : 
            <span className="ml-1">↓</span>;
    };

    const handlePlayerClick = (predictedPlayer) => {
        // Find the full player data by ID
        const fullPlayer = fullPlayersData.find(p => p.id === predictedPlayer.id);
        if (fullPlayer) {
            setSelectedPlayer(fullPlayer);
        }
    };

    const handleCloseModal = () => {
        setSelectedPlayer(null);
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Generating predictions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        );
    }

    const sortedPlayers = getSortedPlayers();

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                    Predicted Points for GW {gameweek}
                </h2>
                {myTeamPlayerIds.length > 0 && (
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showMyTeamOnly}
                            onChange={(e) => setShowMyTeamOnly(e.target.checked)}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Show only my team
                        </span>
                    </label>
                )}
            </div>

            <div>
                <div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-600 text-white sticky top-0">
                            <tr>
                                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Rank
                                </th>
                                <th 
                                    onClick={() => handleSort('name')}
                                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Player {getSortIndicator('name')}
                                </th>
                                <th 
                                    onClick={() => handleSort('team')}
                                    className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Team {getSortIndicator('team')}
                                </th>
                                <th 
                                    onClick={() => handleSort('position')}
                                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Pos {getSortIndicator('position')}
                                </th>
                                <th 
                                    onClick={() => handleSort('cost')}
                                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Cost {getSortIndicator('cost')}
                                </th>
                                <th 
                                    onClick={() => handleSort('fixtures')}
                                    className="hidden lg:table-cell px-3 sm:px-6 py-3 text-center text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Fix {getSortIndicator('fixtures')}
                                </th>
                                <th 
                                    onClick={() => handleSort('nailedness')}
                                    className="hidden xl:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Nail {getSortIndicator('nailedness')}
                                </th>
                                <th 
                                    onClick={() => handleSort('goal_prob')}
                                    className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Goal% {getSortIndicator('goal_prob')}
                                </th>
                                <th 
                                    onClick={() => handleSort('assist_prob')}
                                    className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Ast% {getSortIndicator('assist_prob')}
                                </th>
                                <th 
                                    onClick={() => handleSort('clean_sheet_prob')}
                                    className="hidden xl:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    CS% {getSortIndicator('clean_sheet_prob')}
                                </th>
                                <th 
                                    onClick={() => handleSort('predicted_points')}
                                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    <span className="hidden sm:inline">Predicted </span>Pts {getSortIndicator('predicted_points')}
                                </th>
                                <th 
                                    onClick={() => handleSort('roi')}
                                    className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    ROI {getSortIndicator('roi')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedPlayers.map((player, index) => {
                                const isInMyTeam = myTeamPlayerIds.includes(player.id);
                                return (
                                <tr 
                                    key={player.id} 
                                    onClick={() => handlePlayerClick(player)}
                                    className={`hover:bg-blue-50 transition-colors cursor-pointer ${
                                        isInMyTeam ? 'bg-blue-100' : ''
                                    }`}
                                >
                                    <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {index + 1}
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <div className="flex items-center gap-2">
                                            {player.name}
                                            <StatusIcon status={player.status} news={player.news} />
                                        </div>
                                    </td>
                                    <td 
                                        className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 cursor-pointer hover:text-blue-600 hover:underline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTeamClick && onTeamClick(player.team_id);
                                        }}
                                    >
                                        {player.team}
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold
                                            ${player.position === 'GK' ? 'bg-yellow-200 text-yellow-800' : ''}
                                            ${player.position === 'DEF' ? 'bg-green-200 text-green-800' : ''}
                                            ${player.position === 'MID' ? 'bg-blue-200 text-blue-800' : ''}
                                            ${player.position === 'FWD' ? 'bg-red-200 text-red-800' : ''}
                                        `}>
                                            {player.position}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        £{player.cost.toFixed(1)}
                                    </td>
                                    <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                        {player.fixtures > 1 && (
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                                                DGW ({player.fixtures})
                                            </span>
                                        )}
                                        {player.fixtures === 1 && player.fixtures}
                                        {player.fixtures === 0 && <span className="text-red-500">BGW</span>}
                                    </td>
                                    <td 
                                        className="hidden xl:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 cursor-pointer hover:text-blue-600 hover:underline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTeamClick && onTeamClick(player.team_id);
                                        }}
                                    >
                                        {player.nailedness}
                                    </td>
                                    <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatPercentage(player.goal_prob)}
                                    </td>
                                    <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatPercentage(player.assist_prob)}
                                    </td>
                                    <td className="hidden xl:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatPercentage(player.clean_sheet_prob)}
                                    </td>
                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        {player.predicted_points}
                                    </td>
                                    <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {player.roi}
                                    </td>
                                </tr>
                            );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex-shrink-0">
                    <p className="text-sm text-gray-600">
                        Showing {sortedPlayers.length} players with predictions • Click any row for detailed stats
                    </p>
                </div>
            </div>

            {/* Player Modal */}
            {selectedPlayer && (
                <PlayerModal 
                    player={selectedPlayer} 
                    teams={teams}
                    players={fullPlayersData}
                    onClose={handleCloseModal}
                    onTeamClick={onTeamClick}
                />
            )}
        </div>
    );
}
