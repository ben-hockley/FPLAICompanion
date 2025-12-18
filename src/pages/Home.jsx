import FixturesCarousel from '../components/FixturesCarousel';

const Home = ({ players, teams, onPlayerClick, onTeamClick }) => {
  return (
    <div className="p-4 md:px-8 pb-8">
      <div className="max-w-full mx-auto flex justify-start">
        {/* Fixtures Carousel - 1/3 of viewport width minus sidebar */}
        <div style={{ width: 'calc((100vw - 6rem) / 3)' }} className="min-w-[300px]">
          <FixturesCarousel 
            teams={teams} 
            allPlayers={players}
            onPlayerClick={onPlayerClick}
            onTeamClick={onTeamClick}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
