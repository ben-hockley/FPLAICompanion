import PlayerTable from '../components/PlayerTable';

const PlayerStats = ({ players, teams, myTeamPlayerIds, onTeamClick }) => {
  return (
    <div className="p-2 sm:p-4 md:px-6 pb-8">
      <div className="max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <PlayerTable 
            players={players} 
            teams={teams} 
            myTeamPlayerIds={myTeamPlayerIds}
            onTeamClick={onTeamClick}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;
