import TeamFormation from '../components/TeamFormation';

const MyTeam = ({ players, teams, myTeamPlayerIds, onTeamLoaded, onTeamClick }) => {
  return (
    <div className="p-2 sm:p-4 md:px-6 pb-8">
      <div className="max-w-full mx-auto">
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 flex flex-col w-full max-w-7xl">
            <div className="flex-1 min-h-0">
              <TeamFormation 
                allPlayers={players} 
                teams={teams} 
                onTeamLoaded={onTeamLoaded}
                onTeamClick={onTeamClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTeam;
