import { useState, useEffect } from 'react';
import { fetchFPL } from '../utils/fplApi';
import FixturesCarousel from '../components/FixturesCarousel';
import TopPicks from '../components/TopPicks';
import NewsCarousel from '../components/NewsCarousel';
import FPLLeaders from '../components/FPLLeaders';
import FPLGenieLogo from '../assets/FPL_Genie_Logo.png';

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
    <div className="p-2 sm:p-4 md:px-6 pb-8">
      <div className="max-w-full mx-auto">
        {/* Title banner */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center shadow-md flex-shrink-0">
            <img src={FPLGenieLogo} alt="FPL Genie" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">FPL Genie: Gameweek {currentGameweek ?? '—'}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* News Carousel - First on mobile, right on desktop */}
          <div className="xl:hidden w-full">
            <NewsCarousel />
          </div>
          
          {/* Left Column: Fixtures and Top Picks */}
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Fixtures Carousel */}
            <div className="w-full">
              <FixturesCarousel 
                teams={teams} 
                allPlayers={players}
                onPlayerClick={onPlayerClick}
                onTeamClick={onTeamClick}
                gameweek={currentGameweek}
              />
            </div>
            
            {/* Top Picks */}
            <div className="w-full">
              <TopPicks 
                allPlayers={players}
                teams={teams}
                onPlayerClick={onPlayerClick}
              />
            </div>
          </div>

          {/* Right Column: News Carousel and FPL Leaders - Desktop only for news */}
          <div className="xl:col-span-2 flex flex-col gap-4 sm:gap-6">
            {/* News Carousel - Hidden on mobile */}
            <div className="hidden xl:block">
              <NewsCarousel />
            </div>
            
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
