import { useState, useEffect } from 'react';
import { fetchFPL } from '../utils/fplApi';
import FixturesCarousel from '../components/FixturesCarousel';
import TopPicks from '../components/TopPicks';
import NewsCarousel from '../components/NewsCarousel';
import FPLLeaders from '../components/FPLLeaders';

const Home = ({ players, teams, onPlayerClick, onTeamClick }) => {
  const [currentGameweek, setCurrentGameweek] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchBootstrap = async () => {
      try {
        const data = await fetchFPL('bootstrap-static');
        
        // Find earliest incomplete gameweek
        // A gameweek is incomplete if it hasn't finished OR if it's current and has started
        const incompleteGW = data.events.find(e => {
          // If the gameweek hasn't finished, it's incomplete
          if (!e.finished) return true;
          return false;
        });
        
        const gw = incompleteGW?.id || data.events.find(e => e.is_current)?.id || null;
        if (mounted) setCurrentGameweek(gw);
      } catch (err) {
        // ignore
      }
    };

    fetchBootstrap();
    return () => { mounted = false };
  }, []);

  return (
    <div className="p-4 md:px-8 pb-8">
      <div className="max-w-full mx-auto">
        {/* Title banner */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md">
            <img src="/src/assets/FPL_Genie_Logo.png" alt="FPL Genie" className="w-12 h-12 rounded-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FPL Genie: Gameweek {currentGameweek ?? '—'}</h1>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left Column: Fixtures and Top Picks - 1/3 width */}
          <div className="flex flex-col gap-6" style={{ width: 'calc((100vw - 6rem) / 3)' }}>
            {/* Fixtures Carousel */}
            <div className="min-w-[300px]">
              <FixturesCarousel 
                teams={teams} 
                allPlayers={players}
                onPlayerClick={onPlayerClick}
                onTeamClick={onTeamClick}
                gameweek={currentGameweek}
              />
            </div>
            
            {/* Top Picks */}
            <div className="min-w-[300px]">
              <TopPicks 
                allPlayers={players}
                teams={teams}
                onPlayerClick={onPlayerClick}
              />
            </div>
          </div>

          {/* Right Column: News Carousel and FPL Leaders - 2/3 width */}
          <div style={{ width: 'calc((100vw - 6rem) * 2 / 3)' }} className="min-w-[500px] flex flex-col gap-6">
            <NewsCarousel />
            
            {/* FPL Leaders Section */}
            <FPLLeaders 
              allPlayers={players}
              teams={teams}
              onPlayerClick={onPlayerClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
