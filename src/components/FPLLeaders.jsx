import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FPLLeaders = ({ allPlayers, teams, onPlayerClick }) => {
    const [leaders, setLeaders] = useState({ GKP: null, DEF: null, MID: null, FWD: null });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!allPlayers || !Array.isArray(allPlayers) || allPlayers.length === 0) {
            setLoading(false);
            return;
        }

        try {
            // Filter active players and get top scorer for each position
            const activePlayers = allPlayers.filter(p => 
                p.status !== 'u' && p.status !== 'n' && p.total_points > 0
            );

            // Position mapping: 1=GKP, 2=DEF, 3=MID, 4=FWD
            const positionMap = {
                1: 'GKP',
                2: 'DEF',
                3: 'MID',
                4: 'FWD'
            };

            const topLeaders = {};

            // Get top player for each position based on total_points
            Object.keys(positionMap).forEach(positionId => {
                const positionPlayers = activePlayers.filter(p => p.element_type === parseInt(positionId));
                if (positionPlayers.length > 0) {
                    const topPlayer = positionPlayers.reduce((max, player) => 
                        player.total_points > max.total_points ? player : max
                    );
                    topLeaders[positionMap[positionId]] = topPlayer;
                }
            });

            setLeaders(topLeaders);
            setLoading(false);
        } catch (error) {
            console.error('Error processing FPL leaders:', error);
            setLoading(false);
        }
    }, [allPlayers]);

    const getPlayerImageUrl = (playerCode) => {
        return `https://resources.premierleague.com/premierleague25/photos/players/110x140/${playerCode}.png`;
    };

    const getTeamName = (teamId) => {
        // Teams is an object/map where keys are team IDs and values are team names
        if (!teams || typeof teams !== 'object') return '';
        return teams[teamId] || '';
    };

    const handlePlayerClick = (player) => {
        if (onPlayerClick && player) {
            onPlayerClick(player);
        }
    };

    const positionLabels = {
        GKP: 'Goalkeeper',
        DEF: 'Defender',
        MID: 'Midfielder',
        FWD: 'Forward'
    };

    const positionColors = {
        GKP: 'from-yellow-500 to-yellow-600',
        DEF: 'from-green-500 to-green-600',
        MID: 'from-blue-500 to-blue-600',
        FWD: 'from-red-500 to-red-600'
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center text-gray-500">Loading FPL leaders...</div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">FPL Leaders by Position</h2>
            
            <div className="grid grid-cols-4 gap-4">
                {Object.keys(positionLabels).map(position => {
                    const player = leaders[position];
                    
                    if (!player) {
                        return (
                            <div key={position} className="bg-gray-100 rounded-lg p-4 text-center">
                                <p className="text-gray-500">No data</p>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={position}
                            onClick={() => handlePlayerClick(player)}
                            className="bg-gradient-to-b from-gray-50 to-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden border border-gray-200 hover:border-gray-300 flex flex-col"
                        >
                            {/* Position Header */}
                            <div className={`bg-gradient-to-r ${positionColors[position]} text-white py-2 px-3 text-center`}>
                                <p className="text-sm font-bold uppercase tracking-wide">{positionLabels[position]}</p>
                            </div>

                            {/* Player Image */}
                            <div className="flex-1 flex items-center justify-center bg-gray-50 py-6 px-2">
                                <div className="w-full max-w-[180px] aspect-square flex items-center justify-center">
                                    <img
                                        src={getPlayerImageUrl(player.code)}
                                        alt={player.web_name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.target.src = 'https://resources.premierleague.com/premierleague25/photos/players/110x140/placeholder.png';
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Player Info */}
                            <div className="p-4 space-y-2">
                                <h3 className="text-lg font-bold text-gray-900 text-center truncate">
                                    {player.web_name}
                                </h3>
                                
                                <div className="text-center text-sm text-gray-600">
                                    <p className="font-semibold">{getTeamName(player.team)}</p>
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                    <div className="text-center flex-1">
                                        <p className="text-xs text-gray-500 uppercase">Value</p>
                                        <p className="text-sm font-bold text-gray-900">£{(player.now_cost / 10).toFixed(1)}m</p>
                                    </div>
                                    <div className="text-center flex-1 border-l border-gray-200">
                                        <p className="text-xs text-gray-500 uppercase">Points</p>
                                        <p className="text-xl font-bold text-blue-600">{player.total_points}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* View All Link */}
            <div 
                className="mt-6 pt-4 border-t border-gray-200 text-center cursor-pointer"
                onClick={() => navigate('/player-stats')}
            >
                <span className="text-blue-600 font-medium hover:text-blue-700 text-lg">
                    View all Player stats &gt;
                </span>
            </div>
        </div>
    );
};

export default FPLLeaders;
