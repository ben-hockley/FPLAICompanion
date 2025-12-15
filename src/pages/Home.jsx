import FixturesBar from '../components/FixturesBar';
import TeamFormation from '../components/TeamFormation';
import PlayerTable from '../components/PlayerTable';

const Home = ({ players, teams, myTeamPlayerIds, onTeamLoaded, onPlayerClick, onTeamClick }) => {
  return (
    <div className="p-4 md:px-8 pb-8">
      <div className="max-w-full mx-auto">
        {/* Fixtures Bar */}
        <FixturesBar 
          teams={teams} 
          allPlayers={players}
          onPlayerClick={onPlayerClick}
          onTeamClick={onTeamClick}
        />
        
        {/* Two-column layout with adjusted height to fit screen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-stretch">
          {/* Left Box: My Team Formation */}
          <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col w-full h-[calc(100vh-280px)]">
            <div className="flex-1 min-h-0 overflow-auto">
              <TeamFormation 
                allPlayers={players} 
                teams={teams} 
                onTeamLoaded={onTeamLoaded}
                onTeamClick={onTeamClick}
              />
            </div>
          </div>

          {/* Right Box: Player Stats Table */}
          <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col w-full h-[calc(100vh-280px)]">
            <div className="flex-1 min-h-0 overflow-auto">
              <PlayerTable 
                players={players} 
                teams={teams} 
                myTeamPlayerIds={myTeamPlayerIds}
                onTeamClick={onTeamClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
