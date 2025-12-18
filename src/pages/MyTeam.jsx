import TeamFormation from '../components/TeamFormation';

const MyTeam = ({ players, teams, myTeamPlayerIds, onTeamLoaded, onTeamClick }) => {
  return (
    <div className="p-4 md:px-8 pb-8">
      <div className="max-w-full mx-auto">
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col w-full max-w-6xl">
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
