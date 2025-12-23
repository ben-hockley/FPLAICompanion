import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFPL } from '../utils/fplApi';

class FPLPredictor {
    constructor() {
        this.bootstrap = null;
        this.activePlayers = [];
        this.teamNames = {};
        this.nextGwId = null;
    }

    async init() {
        try {
            this.bootstrap = await fetchFPL('bootstrap-static');

            // Build team name lookup
            this.bootstrap.teams.forEach(team => {
                this.teamNames[team.id] = team.name;
            });

            // Find upcoming gameweek (first with finished = false)
            const upcomingGW = this.bootstrap.events.find(event => event.finished === false);
            this.nextGwId = upcomingGW ? upcomingGW.id : null;

            // Filter for Active Players (not unavailable, not away)
            this.activePlayers = this.bootstrap.elements.filter(p => p.status !== 'u' && p.status !== 'n');

        } catch (error) {
            console.error("Initialization Error:", error);
            throw error;
        }
    }

    async generateTopPicks(limit = 5) {
        const predictions = [];
        
        // Process all active players
        for (const player of this.activePlayers) {
            const prediction = this.analyzePlayer(player);
            predictions.push(prediction);
        }

        // Sort by Predicted Points Descending and return top picks
        return predictions
            .sort((a, b) => b.predicted_points - a.predicted_points)
            .slice(0, limit);
    }

    analyzePlayer(player) {
        // Get ICT scores from bootstrap data
        const threat = parseFloat(player.threat) || 0;
        const creativity = parseFloat(player.creativity) || 0;
        
        // Simplified predictions
        const goalProb = threat * 0.0015;
        const assistProb = creativity * 0.001;

        const cleanSheetProb = (player.starts > 6) ? parseFloat(player.clean_sheets_per_90) || 0 : 0;
        
        const positionId = player.element_type; // 1:GK, 2:DEF, 3:MID, 4:FWD
        
        let predictedPoints = 2;
        
        if (positionId === 1) { // GK
            predictedPoints += (goalProb * 6) + (assistProb * 3) + (cleanSheetProb * 4) + 0.5;
        } else if (positionId === 2) { // DEF
            predictedPoints += (goalProb * 6) + (assistProb * 3) + (cleanSheetProb * 4);
        } else if (positionId === 3) { // MID
            predictedPoints += (goalProb * 5) + (assistProb * 3) + (cleanSheetProb * 1);
        } else if (positionId === 4) { // FWD
            predictedPoints += (goalProb * 4) + (assistProb * 3);
        }
        
        const defCon = parseFloat(player.defensive_contribution_per_90) || 0;
        if ((positionId === 3 || positionId === 4) && defCon > 12) {
            predictedPoints += 2;
        } else if (positionId === 2 && defCon > 10) {
            predictedPoints += 2;
        }
        
        return this.formatOutput(player, predictedPoints);
    }

    formatOutput(player, points) {
        const cost = player.now_cost / 10;
        let pPoints = parseFloat(points.toFixed(2));
        const positionId = player.element_type;
        return {
            id: player.id,
            name: player.web_name,
            code: player.code,
            team: this.teamNames[player.team],
            position: positionId === 1 ? 'GK' : positionId === 2 ? 'DEF' : positionId === 3 ? 'MID' : 'FWD',
            cost: cost,
            predicted_points: (player.status === "i" || player.status === "s" || player.status === "n") ? 0.0 : pPoints,
        };
    }
}

const TopPicks = ({ allPlayers, teams, onPlayerClick }) => {
    const [topPlayers, setTopPlayers] = useState([]);
    const [gameweek, setGameweek] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchTopPicks() {
            try {
                setLoading(true);
                const predictor = new FPLPredictor();
                await predictor.init();
                const picks = await predictor.generateTopPicks(5);
                
                setGameweek(predictor.nextGwId);
                setTopPlayers(picks);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch top picks:', err);
                setLoading(false);
            }
        }

        fetchTopPicks();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center text-gray-500">Loading top picks...</div>
            </div>
        );
    }

    const handlePlayerRowClick = (e, player) => {
        e.stopPropagation();
        // Find full player data
        const fullPlayer = allPlayers?.find(p => p.id === player.id);
        if (fullPlayer && onPlayerClick) {
            onPlayerClick(fullPlayer);
        }
    };

    const getPlayerImageUrl = (playerCode) => {
        return `https://resources.premierleague.com/premierleague25/photos/players/110x140/${playerCode}.png`;
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div 
                className="cursor-pointer mb-4"
                onClick={() => navigate('/predicted-points')}
            >
                <h2 className="text-xl font-bold text-gray-800">
                    Top Picks for Gameweek {gameweek ?? '—'}
                </h2>
            </div>
            
            <div className="space-y-3">
                {topPlayers.map((player, index) => (
                    <div 
                        key={player.id}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                        onClick={(e) => handlePlayerRowClick(e, player)}
                    >
                        <div className="flex-shrink-0">
                            <div className="w-14 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                <img 
                                    src={getPlayerImageUrl(player.code)}
                                    alt={player.name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        e.target.src = 'https://resources.premierleague.com/premierleague25/photos/players/110x140/placeholder.png';
                                    }}
                                />
                            </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <p className="text-lg font-bold text-blue-600 truncate">{player.name}</p>
                        </div>
                        
                        <div className="flex-shrink-0 text-center">
                            <p className="text-2xl font-bold text-gray-900">{player.predicted_points.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">Predicted points</p>
                        </div>
                    </div>
                ))}
            </div>
            
            <div 
                className="mt-4 pt-4 border-t border-gray-200 text-center cursor-pointer"
                onClick={() => navigate('/predicted-points')}
            >
                <span className="text-blue-600 font-medium hover:text-blue-700">
                    View all predicted points &gt;
                </span>
            </div>
        </div>
    );
};

export default TopPicks;
