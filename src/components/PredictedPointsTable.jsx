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

            return this.formatOutput(player, finalPrediction, upcoming.length);

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

    formatOutput(player, points, fixtures) {
        const cost = player.now_cost / 10;
        const pPoints = parseFloat(points.toFixed(2));
        return {
            id: player.id,
            name: player.web_name,
            team: this.teamStrength[player.team].name,
            position: player.element_type === 1? 'GK' : player.element_type === 2? 'DEF' : player.element_type === 3? 'MID' : 'FWD',
            cost: cost,
            fixtures: fixtures,
            predicted_points: pPoints,
            roi: parseFloat((pPoints / cost).toFixed(2)) // Points per Million
        };
    }
}

// React Component
import { useState, useEffect } from 'react';

export default function PredictedPointsTable() {
    const [topPlayers, setTopPlayers] = useState([]);
    const [valuePicks, setValuePicks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [gameweek, setGameweek] = useState(null);

    useEffect(() => {
        async function fetchPredictions() {
            try {
                setLoading(true);
                const predictor = new FPLPredictor();
                await predictor.init();
                const rankings = await predictor.generatePredictions();

                setGameweek(predictor.nextGwId);
                setTopPlayers(rankings.slice(0, 20));

                // Top 20 Value Picks (ROI) - Filter out bench fodder
                const valuePicks = rankings
                    .filter(p => p.predicted_points > 1.5 && p.cost > 3.9)
                    .sort((a, b) => b.roi - a.roi);

                setValuePicks(valuePicks.slice(0, 20));
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        }

        fetchPredictions();
    }, []);

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

    const TableComponent = ({ title, data }) => (
        <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">Rank</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">Player</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">Team</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">Pos</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">Cost</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-b">Fixtures</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">Pred Pts</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider border-b">ROI</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.map((player, index) => (
                            <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{player.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{player.team}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{player.position}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right">£{player.cost.toFixed(1)}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-center">
                                    {player.fixtures > 1 && (
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                                            DGW ({player.fixtures})
                                        </span>
                                    )}
                                    {player.fixtures === 1 && player.fixtures}
                                    {player.fixtures === 0 && <span className="text-red-500">BGW</span>}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{player.predicted_points}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right">{player.roi}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div>
            <TableComponent 
                title={`Top 20 Predicted Players for GW ${gameweek}`}
                data={topPlayers}
            />
            <TableComponent 
                title="Top 20 Value Picks (ROI)"
                data={valuePicks}
            />
        </div>
    );
}
