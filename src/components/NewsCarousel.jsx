import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Placeholder news data
const PLACEHOLDER_NEWS = [
  {
    id: 1,
    title: 'Fantasy Premier League Tips: Best Players to Transfer In for Gameweek 15',
    date: '2025-12-17',
    image: 'https://resources.premierleague.com/premierleague/photo/2024/08/12/d3f3f3f3-3f3f-3f3f-3f3f-3f3f3f3f3f3f.jpg',
  },
  {
    id: 2,
    title: 'FPL Captain Picks: Who Should You Choose This Week?',
    date: '2025-12-16',
    image: 'https://resources.premierleague.com/premierleague/photo/2024/08/12/d3f3f3f3-3f3f-3f3f-3f3f-3f3f3f3f3f3f.jpg',
  },
  {
    id: 3,
    title: 'Top Performers Analysis: Midfielders Dominating the Season',
    date: '2025-12-15',
    image: 'https://resources.premierleague.com/premierleague/photo/2024/08/12/d3f3f3f3-3f3f-3f3f-3f3f-3f3f3f3f3f3f.jpg',
  },
  {
    id: 4,
    title: 'Budget Gems: Best Value Players Under £6M',
    date: '2025-12-14',
    image: 'https://resources.premierleague.com/premierleague/photo/2024/08/12/d3f3f3f3-3f3f-3f3f-3f3f-3f3f3f3f3f3f.jpg',
  },
  {
    id: 5,
    title: 'Fixture Difficulty Analysis: Plan Your Transfers Ahead',
    date: '2025-12-13',
    image: 'https://resources.premierleague.com/premierleague/photo/2024/08/12/d3f3f3f3-3f3f-3f3f-3f3f-3f3f3f3f3f3f.jpg',
  },
];

const NewsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % PLACEHOLDER_NEWS.length);
    }, 6000); // Auto-scroll every 6 seconds

    return () => clearInterval(interval);
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + PLACEHOLDER_NEWS.length) % PLACEHOLDER_NEWS.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % PLACEHOLDER_NEWS.length);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const currentNews = PLACEHOLDER_NEWS[currentIndex];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="relative h-96 cursor-pointer group" onClick={() => navigate(`/news/${currentNews.id}`)}>
        {/* Navigation Buttons */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full shadow-lg p-3 hover:bg-white transition z-10 opacity-0 group-hover:opacity-100"
        >
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full shadow-lg p-3 hover:bg-white transition z-10 opacity-0 group-hover:opacity-100"
        >
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Background Image with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70">
          <img
            src={currentNews.image}
            alt={currentNews.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/1200x600/4F46E5/FFFFFF?text=FPL+Genie+News';
            }}
          />
        </div>

        {/* News Content - Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6">
          <p className="text-blue-300 text-sm font-medium mb-2">{formatDate(currentNews.date)}</p>
          <h2 className="text-white text-2xl font-bold leading-tight">
            {currentNews.title}
          </h2>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-6 right-6 flex gap-2">
          {PLACEHOLDER_NEWS.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsCarousel;
