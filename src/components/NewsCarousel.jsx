import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

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
  const [news, setNews] = useState(PLACEHOLDER_NEWS);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from('News')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) {
          console.error('Error fetching news:', error);
          return;
        }
        
        console.log('News data from Supabase:', data);
        
        if (data && data.length > 0) {
          // Map Supabase data format to component format
          const mappedNews = data.map(item => ({
            id: item.id,
            title: item.Title,
            date: item.created_at,
            image: item.PictureUrl,
            content: item.Content,
            pictureCredit: item.PictureCredit,
            author: item.Author
          }));
          setNews(mappedNews);
        }
      } catch (err) {
        console.error('Exception fetching news:', err);
      }
    };

    fetchNews();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % news.length);
    }, 6000); // Auto-scroll every 6 seconds

    return () => clearInterval(interval);
  }, [news.length]);

  const goToPrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + news.length) % news.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % news.length);
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
    const containerWidth = window.innerWidth;
    const swipeThreshold = containerWidth * 0.5; // 50% of container width
    
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getPrevIndex = () => (currentIndex - 1 + news.length) % news.length;
  const getNextIndex = () => (currentIndex + 1) % news.length;

  const currentNews = news[currentIndex];
  const prevNews = news[getPrevIndex()];
  const nextNews = news[getNextIndex()];

  const renderNewsCard = (newsItem, offset) => (
    <div
      key={newsItem.id}
      className="absolute inset-0 transition-transform duration-300"
      style={{
        transform: `translateX(${offset + swipeOffset}px)`,
        transition: swipeOffset !== 0 ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Blurred background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${newsItem.image})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          filter: 'blur(24px)',
          transform: 'scale(1.08)',
        }}
      />

      {/* Main Image with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70">
        <img
          src={newsItem.image}
          alt={newsItem.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/1200x600/4F46E5/FFFFFF?text=FPL+Genie+News';
          }}
        />
      </div>

      {/* News Content - Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6">
        <p className="text-blue-300 text-sm font-medium mb-2">{formatDate(newsItem.date)}</p>
        <h2 className="text-white text-2xl font-bold leading-tight">
          {newsItem.title}
        </h2>
        {newsItem.author && (
          <p className="text-blue-200 text-sm mt-2">By {newsItem.author}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div 
        className="relative h-96 cursor-pointer group overflow-hidden" 
        onClick={(e) => {
          if (Math.abs(swipeOffset) < 10) {
            navigate(`/news/${currentNews.id}`);
          }
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Ensure carousel is taller and images always fit inside */}
        <style>{`
          .group { height: 28rem !important; } /* taller than h-96 */
          .group img { object-fit: contain !important; max-height: 100%; width: 100%; object-position: top; }
        `}</style>

        {/* Render previous, current, and next cards */}
        {renderNewsCard(prevNews, -window.innerWidth)}
        {renderNewsCard(currentNews, 0)}
        {renderNewsCard(nextNews, window.innerWidth)}

        {/* Navigation Buttons */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full shadow-lg p-3 hover:bg-white transition z-20 opacity-0 group-hover:opacity-100"
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
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full shadow-lg p-3 hover:bg-white transition z-20 opacity-0 group-hover:opacity-100"
        >
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Indicators */}
        <div className="absolute bottom-6 right-6 flex gap-2 z-20">{" "}
          {news.map((_, index) => (
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
