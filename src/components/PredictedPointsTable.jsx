/**
 * FPL Prediction Engine
 * A robust algorithm for forecasting player performance in the Fantasy Premier League.
 * 
 * Features:
 * - Parallel Data Ingestion
 * - EWMA Form Calculation
 * - Poisson-based Implied Odds
 * - Custom FDR & Nailedness Logic
 */

// Use the dev-server proxy at `/api` to avoid CORS in the browser.
const BASE_URL = '/api';

class FPLPredictor {
    constructor() {
        this.bootstrap = null;
        this.fixtures = null;
        this.activePlayers = [];
        this.teamStrength = {}; 
        this.nextGwId = null;
        
        // Configuration for EWMA (Exponential Weighted Moving Average)
        // Alpha determines the "memory" of the form. Higher = more reactive.
        this.ALPHA_POINTS = 0.25; 
        this.ALPHA_ICT = 0.15;    
    }

    /**
     * PHASE 1: Data Ingestion
     * Fetches static global data and builds the Team Strength lookup table.
     */
    async init() {
        console.log("Initializing FPL Data Pipeline...");
        
        try {
            // Parallel fetch for speed
            const [bootstrapRes, fixturesRes] = await Promise.all([
                fetch(`${BASE_URL}/bootstrap-static/`),
                fetch(`${BASE_URL}/fixtures/`)
            ]);

            if (!bootstrapRes.ok ||!fixturesRes.ok) throw new Error("API Fetch Failed");

            this.bootstrap = await bootstrapRes.json();
            this.fixtures = await fixturesRes.json();

            // Identify the next Gameweek
            const nextEvent = this.bootstrap.events.find(e => e.is_next);
            if (!nextEvent) throw new Error("Season finished or no next gameweek found.");
            this.nextGwId = nextEvent.id;
            console.log(`Target Prediction: Gameweek ${this.nextGwId}`);

            // Build O(1) Lookup Map for Team Strength
            this.buildTeamStrengthMap();

            // Filter for Active Players
            // Heuristic: Must not be 'unavailable' and must have played some minutes OR have a chance of playing.
            this.activePlayers = this.bootstrap.elements.filter(p => 
                p.status!== 'u' && (p.minutes > 0 || p.chance_of_playing_next_round > 0)
            );
            console.log(`Active Players identified: ${this.activePlayers.length}`);

        } catch (error) {
            console.error("Initialization Error:", error);
            throw error;
        }
    }

    /**
     * Maps team strength data for fast access.
     * Normalizes raw strength values (1000-1350) to a baseline (approx 1050).
     */
    buildTeamStrengthMap() {
        const BASELINE = 1050; // League average baseline
        this.bootstrap.teams.forEach(team => {
            this.teamStrength[team.id] = {
                name: team.name,
                // Normalize to a ratio around 1.0
                att_home: team.strength_attack_home / BASELINE,
                att_away: team.strength_attack_away / BASELINE,
                def_home: team.strength_defence_home / BASELINE,
                def_away: team.strength_defence_away / BASELINE
            };
        });
    }

    /**
     * PHASE 2: Prediction Generation
     * Batches player processing to respect API rate limits.
     */
    async generatePredictions() {
        const predictions = [];
        const BATCH_SIZE = 25; 
        
        console.log("Starting prediction cycle...");

        for (let i = 0; i < this.activePlayers.length; i += BATCH_SIZE) {
            const batch = this.activePlayers.slice(i, i + BATCH_SIZE);
            
            // Map batch to promises
            const batchPromises = batch.map(player => this.analyzePlayer(player));
            const batchResults = await Promise.all(batchPromises);
            
            // Filter nulls (players with errors or no fixtures)
            predictions.push(...batchResults.filter(p => p!== null));
            
            // Rate Limiting Delay
            await new Promise(r => setTimeout(r, 150)); 
            
            // Progress Logging
            if ((i + BATCH_SIZE) % 100 === 0) {
                console.log(`Processed ${i + BATCH_SIZE} players...`);
            }
        }

        // Sort by Predicted Points Descending
        return predictions.sort((a, b) => b.predicted_points - a.predicted_points);
    }

    /**
     * PHASE 3: Individual Player Analysis
     * The core algorithmic logic resides here.
     */
    async analyzePlayer(player) {
        try {
            // Fetch detailed history
            const summaryRes = await fetch(`${BASE_URL}/element-summary/${player.id}/`);
            if (!summaryRes.ok) return null;
            
            const summary = await summaryRes.json();
            const history = summary.history;
            
            // Filter fixtures for the NEXT Gameweek only
            const upcoming = summary.fixtures.filter(f => f.event === this.nextGwId);

            if (upcoming.length === 0) return this.formatOutput(player, 0, 0, "Blank GW");

            // --- FEATURE ENGINEERING ---

            // 1. EWMA Form Calculation
            const ewmaStats = this.calculateEWMA(history);
            
            // 2. Nailedness (Expected Minutes)
            const expectedMinutes = this.calculateNailedness(history, player);
            const nailednessCoeff = expectedMinutes / 90;

            // --- PREDICTION LOGIC ---

            let totalImpliedPoints = 0;
            let totalGoalProb = 0;
            let totalAssistProb = 0;
            let totalCleanSheetProb = 0;

            // Loop through fixtures (handles Double Gameweeks automatically)
            for (let i = 0; i < upcoming.length; i++) {
                const fixture = upcoming[i];
                const isHome = fixture.team_h === player.team;
                const opponentId = isHome? fixture.team_a : fixture.team_h;
                
                // Rotation damping for 2nd game of a Double Gameweek
                const dgwDamping = (i > 0)? 0.85 : 1.0; 

                // A. Team Strength Logic (Implied Goals)
                const teamStats = this.teamStrength[player.team];
                const oppStats = this.teamStrength[opponentId];
                
                const attackRating = isHome? teamStats.att_home : teamStats.att_away;
                const oppDefRating = isHome? oppStats.def_away : oppStats.def_home;
                
                const BASE_GOALS = 1.4; // PL Avg
                const HFA = isHome? 1.15 : 0.85; 

                // The Team's expected goals for this match
                const impliedTeamGoals = BASE_GOALS * attackRating * (1 / oppDefRating) * HFA;
                
                // B. Poisson for Clean Sheets
                const oppAttack = isHome? oppStats.att_away : oppStats.att_home;
                const myDef = isHome? teamStats.def_home : teamStats.def_away;
                const impliedOppGoals = BASE_GOALS * oppAttack * (1 / myDef) * (1/HFA); 
                
                // Probability of conceding 0 goals: e^(-lambda)
                const cleanSheetProb = Math.exp(-impliedOppGoals);

                // C. Player Share (Micro Model)
                const positionId = player.element_type; // 1:GK, 2:DEF, 3:MID, 4:FWD
                let matchPoints = 0;
                
                // Appearance Points
                matchPoints += (expectedMinutes >= 60)? 2 : (expectedMinutes > 0? 1 : 0);

                // Attacking Returns (Heuristic based on ICT Threat)
                // We use a scaler to convert Threat score to "Share of Goals"
                const THREAT_SCALAR = 0.007; 
                const goalProb = impliedTeamGoals * (ewmaStats.threat * THREAT_SCALAR);
                const assistProb = impliedTeamGoals * (ewmaStats.creativity * THREAT_SCALAR * 0.6);

                // Accumulate probabilities across fixtures
                totalGoalProb += goalProb;
                totalAssistProb += assistProb;
                totalCleanSheetProb += cleanSheetProb;

                // Apply Position Modifiers
                if (positionId === 4) { // Forward
                    matchPoints += (goalProb * 4) + (assistProb * 3);
                } else if (positionId === 3) { // Mid
                    matchPoints += (goalProb * 5) + (assistProb * 3) + (cleanSheetProb * 1);
                } else if (positionId === 2) { // Def
                    matchPoints += (goalProb * 6) + (assistProb * 3) + (cleanSheetProb * 4);
                } else { // GK
                    matchPoints += (cleanSheetProb * 4) + 0.5; // +0.5 for saves
                }

                totalImpliedPoints += (matchPoints * dgwDamping);
            }

            // Final Calculation
            const finalPrediction = totalImpliedPoints * nailednessCoeff;

            return this.formatOutput(player, finalPrediction, upcoming.length, nailednessCoeff, totalGoalProb, totalAssistProb, totalCleanSheetProb);

        } catch (error) {
            return null; // Fail silently for individual player errors
        }
    }

    /**
     * Helper: Calculate Exponential Weighted Moving Averages
     */
    calculateEWMA(history) {
        if (!history || history.length === 0) return { threat: 0, creativity: 0 };

        let ewmaThreat = 0;
        let ewmaCreativity = 0;

        // history is usually chronological. We iterate to build the moving average.
        history.forEach((match, index) => {
            const threat = parseFloat(match.threat);
            const creativity = parseFloat(match.creativity);

            if (index === 0) {
                ewmaThreat = threat;
                ewmaCreativity = creativity;
            } else {
                ewmaThreat = (this.ALPHA_ICT * threat) + ((1 - this.ALPHA_ICT) * ewmaThreat);
                ewmaCreativity = (this.ALPHA_ICT * creativity) + ((1 - this.ALPHA_ICT) * ewmaCreativity);
            }
        });

        return { threat: ewmaThreat, creativity: ewmaCreativity };
    }

    /**
     * Helper: Calculate Nailedness Coefficient
     */
    calculateNailedness(history, player) {
        const recent = history.slice(-5); // Last 5 matches
        if (recent.length === 0) return 0;

        const avgMin = recent.reduce((sum, m) => sum + m.minutes, 0) / recent.length;
        
        let chance = player.chance_of_playing_next_round;
        if (chance === null) chance = 100; // API uses null for 100%

        return avgMin * (chance / 100);
    }

    formatOutput(player, points, fixtures, nailednessCoeff, goalProb, assistProb, cleanSheetProb) {
        const cost = player.now_cost / 10;
        const pPoints = parseFloat(points.toFixed(2));
        const positionId = player.element_type;
        return {
            id: player.id,
            name: player.web_name,
            team: this.teamStrength[player.team].name,
            position: positionId === 1? 'GK' : positionId === 2? 'DEF' : positionId === 3? 'MID' : 'FWD',
            cost: cost,
            fixtures: fixtures,
            nailedness: parseFloat((nailednessCoeff || 0).toFixed(2)),
            goal_prob: parseFloat((goalProb || 0).toFixed(2)),
            assist_prob: parseFloat((assistProb || 0).toFixed(2)),
            clean_sheet_prob: positionId === 4 ? null : parseFloat((cleanSheetProb || 0).toFixed(2)), // null for forwards
            predicted_points: pPoints,
            roi: parseFloat((pPoints / cost).toFixed(2)) // Points per Million
        };
    }
}

// React Component
import { useState, useEffect } from 'react';
import PlayerModal from './PlayerModal';

export default function PredictedPointsTable({ myTeamPlayerIds = [] }) {
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
                
                // Fetch full player data for modal
                const response = await fetch('/api/bootstrap-static/');
                const data = await response.json();
                
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
        <div className="flex flex-col h-[600px]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                    AI Predicted Points for GW {gameweek}
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

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-600 text-white sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                    Rank
                                </th>
                                <th 
                                    onClick={() => handleSort('name')}
                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Player {getSortIndicator('name')}
                                </th>
                                <th 
                                    onClick={() => handleSort('team')}
                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Team {getSortIndicator('team')}
                                </th>
                                <th 
                                    onClick={() => handleSort('position')}
                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Position {getSortIndicator('position')}
                                </th>
                                <th 
                                    onClick={() => handleSort('cost')}
                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Cost {getSortIndicator('cost')}
                                </th>
                                <th 
                                    onClick={() => handleSort('fixtures')}
                                    className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Fixtures {getSortIndicator('fixtures')}
                                </th>
                                <th 
                                    onClick={() => handleSort('nailedness')}
                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Nailedness {getSortIndicator('nailedness')}
                                </th>
                                <th 
                                    onClick={() => handleSort('goal_prob')}
                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Goal % {getSortIndicator('goal_prob')}
                                </th>
                                <th 
                                    onClick={() => handleSort('assist_prob')}
                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Assist % {getSortIndicator('assist_prob')}
                                </th>
                                <th 
                                    onClick={() => handleSort('clean_sheet_prob')}
                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    CS % {getSortIndicator('clean_sheet_prob')}
                                </th>
                                <th 
                                    onClick={() => handleSort('predicted_points')}
                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
                                >
                                    Predicted Pts {getSortIndicator('predicted_points')}
                                </th>
                                <th 
                                    onClick={() => handleSort('roi')}
                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition"
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {player.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {player.team}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold
                                            ${player.position === 'GK' ? 'bg-yellow-200 text-yellow-800' : ''}
                                            ${player.position === 'DEF' ? 'bg-green-200 text-green-800' : ''}
                                            ${player.position === 'MID' ? 'bg-blue-200 text-blue-800' : ''}
                                            ${player.position === 'FWD' ? 'bg-red-200 text-red-800' : ''}
                                        `}>
                                            {player.position}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        £{player.cost.toFixed(1)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                        {player.fixtures > 1 && (
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                                                DGW ({player.fixtures})
                                            </span>
                                        )}
                                        {player.fixtures === 1 && player.fixtures}
                                        {player.fixtures === 0 && <span className="text-red-500">BGW</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {player.nailedness}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatPercentage(player.goal_prob)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatPercentage(player.assist_prob)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatPercentage(player.clean_sheet_prob)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        {player.predicted_points}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
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
                />
            )}
        </div>
    );
}
