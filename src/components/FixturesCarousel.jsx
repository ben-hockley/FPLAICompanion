import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFPL } from '../utils/fplApi';
import FixtureModal from './FixtureModal';
import { TEAM_BADGES } from '../utils/teamBadges';

const FixturesCarousel = ({ teams, allPlayers, onPlayerClick, onTeamClick, gameweek }) => {
  const [fixtures, setFixtures] = useState([]);
  const [currentGameweek, setCurrentGameweek] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (gameweek) {
      fetchFixtures(gameweek);
    }
  }, [gameweek]);

  useEffect(() => {
    if (fixtures.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % fixtures.length);
    }, 5000); // Auto-scroll every 5 seconds

    return () => clearInterval(interval);
  }, [fixtures.length]);

  const fetchFixtures = async (gw) => {
    try {
      setLoading(true);
      setCurrentGameweek(gw);
      
      const fixturesData = await fetchFPL('fixtures');
      
      const gwFixtures = fixturesData
        .filter(fixture => fixture.event === gw)
        .sort((a, b) => new Date(a.kickoff_time) - new Date(b.kickoff_time));
      
      setFixtures(gwFixtures);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch fixtures:', err);
      setLoading(false);
    }
  };

  const formatKickoffTime = (kickoffTime) => {
    const date = new Date(kickoffTime);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();
    
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
      return `Today ${timeStr}`;
    } else if (isTomorrow) {
      return `Tomorrow ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      return `${dateStr} ${timeStr}`;
    }
  };

  const getTeamBadgeUrl = (teamId) => {
    return TEAM_BADGES[teamId] ? TEAM_BADGES[teamId].replace('/badges/70/', '/badges/50/') : null;
  };

  const goToPrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + fixtures.length) % fixtures.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % fixtures.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const onTouchStart = (e) => {
    if (isTransitioning) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeOffset(0);
  };

  const onTouchMove = (e) => {
    if (!touchStart || isTransitioning) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    setTouchEnd(currentTouch);
    setSwipeOffset(diff);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || isTransitioning) {
      setSwipeOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const containerWidth = e => e.currentTarget ? e.currentTarget.offsetWidth : window.innerWidth;
    const swipeThreshold = (window.innerWidth * 0.5); // 50% of container width
    
    if (Math.abs(distance) > swipeThreshold) {
      if (distance > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
    
    setSwipeOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">Loading fixtures...</div>
      </div>
    );
  }

  if (fixtures.length === 0) {
    return null;
  }

  const getPrevIndex = () => (currentIndex - 1 + fixtures.length) % fixtures.length;
  const getNextIndex = () => (currentIndex + 1) % fixtures.length;

  const currentFixture = fixtures[currentIndex];
  const prevFixture = fixtures[getPrevIndex()];
  const nextFixture = fixtures[getNextIndex()];

  const renderFixtureCard = (fixture, offset) => (
    <div
      key={fixture.id}
      className="absolute inset-0 w-full transition-transform duration-300"
      style={{
        transform: `translateX(${offset + swipeOffset}px)`,
        transition: swipeOffset !== 0 ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      <div
        onClick={() => {
          if (Math.abs(swipeOffset) < 10) {
            setSelectedFixture(fixture);
          }
        }}
        className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-xl h-full ${
          fixture.finished ? 'bg-gray-50 border-gray-300' : 'bg-white border-blue-300'
        }`}
      >
        {/* Teams */}
        <div className="space-y-2 mb-1">
          {/* Home Team */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <img
                src={getTeamBadgeUrl(fixture.team_h)}
                alt={teams[fixture.team_h]}
                className="w-12 h-12 object-contain flex-shrink-0"
                onError={(e) => e.target.style.display = 'none'}
              />
              <span 
                className="text-lg font-bold text-gray-800 hover:text-blue-600 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onTeamClick && onTeamClick(fixture.team_h);
                }}
              >
                {teams[fixture.team_h]}
              </span>
            </div>
            {fixture.finished && (
              <span className="text-3xl font-bold text-gray-900">
                {fixture.team_h_score}
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <img
                src={getTeamBadgeUrl(fixture.team_a)}
                alt={teams[fixture.team_a]}
                className="w-12 h-12 object-contain flex-shrink-0"
                onError={(e) => e.target.style.display = 'none'}
              />
              <span 
                className="text-lg font-bold text-gray-800 hover:text-blue-600 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onTeamClick && onTeamClick(fixture.team_a);
                }}
              >
                {teams[fixture.team_a]}
              </span>
            </div>
            {fixture.finished && (
              <span className="text-3xl font-bold text-gray-900">
                {fixture.team_a_score}
              </span>
            )}
          </div>
        </div>

        {/* Kickoff Time or Status */}
        <div className="text-center pt-4 border-t border-gray-200">
          {fixture.finished ? (
            <span className="text-sm font-medium text-green-600">Full Time</span>
          ) : fixture.started ? (
            <span className="text-sm font-medium text-red-600 animate-pulse">Live</span>
          ) : (
            <span className="text-sm text-gray-600">
              {formatKickoffTime(fixture.kickoff_time)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">This Week's Fixtures</h2>
      
      {/* Carousel Container */}
      <div 
        className="relative overflow-hidden min-h-[280px]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Render previous, current, and next cards */}
        {renderFixtureCard(prevFixture, -window.innerWidth)}
        {renderFixtureCard(currentFixture, 0)}
        {renderFixtureCard(nextFixture, window.innerWidth)}

        {/* Navigation Buttons */}
        <button
          onClick={goToPrevious}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 bg-white rounded-full shadow-lg p-2 hover:bg-gray-50 transition z-20"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={goToNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 bg-white rounded-full shadow-lg p-2 hover:bg-gray-50 transition z-20"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mt-4 relative z-20">{" "}
          {fixtures.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* View All Fixtures Button */}
      <button
        onClick={() => navigate(`/fixtures/${currentGameweek}`)}
        className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
      >
        View Fixtures by Gameweek
      </button>

      {/* Fixture Modal */}
      {selectedFixture && (
        <FixtureModal
          fixture={selectedFixture}
          teams={teams}
          allPlayers={allPlayers}
          onClose={() => setSelectedFixture(null)}
          onPlayerClick={onPlayerClick}
          onTeamClick={onTeamClick}
        />
      )}
    </div>
  );
};

export default FixturesCarousel;
