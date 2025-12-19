import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

// Placeholder news data (same as carousel) - fallback only
const PLACEHOLDER_NEWS = [
  {
    id: 1,
    title: 'Fantasy Premier League Tips: Best Players to Transfer In for Gameweek 15',
    date: '2025-12-17',
    image: 'https://resources.premierleague.com/premierleague/photo/2024/08/12/d3f3f3f3-3f3f-3f3f-3f3f-3f3f3f3f3f3f.jpg',
    content: `
      <p>As we head into Gameweek 15, managers are looking for the best options to maximize their points. Here's our comprehensive guide to the top transfer targets.</p>
      
      <h3>Top Midfielders to Consider</h3>
      <p>The midfield options are looking particularly strong this week with several players in excellent form and facing favorable fixtures.</p>
      
      <h3>Defenders with Great Fixtures</h3>
      <p>Clean sheets are crucial for FPL success, and these defenders have the best chance of keeping them in the upcoming gameweek.</p>
      
      <h3>Forward Options</h3>
      <p>If you're looking to strengthen your attack, these forwards are showing excellent form and underlying statistics.</p>
      
      <p><em>Stay tuned for more FPL tips and analysis throughout the season!</em></p>
    `,
  },
  {
    id: 2,
    title: 'FPL Captain Picks: Who Should You Choose This Week?',
    date: '2025-12-16',
    image: 'https://resources.premierleague.com/premierleague/photo/2024/08/12/d3f3f3f3-3f3f-3f3f-3f3f-3f3f3f3f3f3f.jpg',
    content: `
      <p>Choosing the right captain can make or break your gameweek. Here are our top picks for the captain's armband.</p>
      
      <h3>Premium Options</h3>
      <p>The premium players are always reliable choices, but this week some stand out more than others based on fixtures and form.</p>
      
      <h3>Differential Captains</h3>
      <p>Looking to gain ground in your mini-leagues? These differential captains could give you the edge.</p>
      
      <h3>Safe vs Risky Picks</h3>
      <p>We analyze the risk-reward ratio of various captain options to help you make the best decision.</p>
    `,
  },
  {
    id: 3,
    title: 'Top Performers Analysis: Midfielders Dominating the Season',
    date: '2025-12-15',
    image: 'https://resources.premierleague.com/premierleague/photo/2024/08/12/d3f3f3f3-3f3f-3f3f-3f3f-3f3f3f3f3f3f.jpg',
    content: `
      <p>Let's take a deep dive into the midfielders who are dominating the FPL landscape this season.</p>
      
      <h3>Statistical Leaders</h3>
      <p>These midfielders are leading the way in goals, assists, and underlying statistics.</p>
      
      <h3>Value for Money</h3>
      <p>Not all top performers break the bank. Here are some budget-friendly options delivering excellent returns.</p>
      
      <h3>Form vs Fixtures</h3>
      <p>We analyze which players combine great form with favorable upcoming fixtures.</p>
    `,
  },
  {
    id: 4,
    title: 'Budget Gems: Best Value Players Under £6M',
    date: '2025-12-14',
    image: 'https://resources.premierleague.com/premierleague/photo/2024/08/12/d3f3f3f3-3f3f-3f3f-3f3f-3f3f3f3f3f3f.jpg',
    content: `
      <p>Finding budget gems is crucial for building a balanced FPL squad. Here are the best value options currently available.</p>
      
      <h3>Bargain Defenders</h3>
      <p>These defenders offer clean sheet potential without breaking your budget.</p>
      
      <h3>Affordable Midfield Options</h3>
      <p>Get attacking returns without spending big on these midfield bargains.</p>
      
      <h3>Budget Forwards</h3>
      <p>Sometimes you need a cheap striker to balance your team. These are your best options.</p>
    `,
  },
  {
    id: 5,
    title: 'Fixture Difficulty Analysis: Plan Your Transfers Ahead',
    date: '2025-12-13',
    image: 'https://resources.premierleague.com/premierleague/photo/2024/08/12/d3f3f3f3-3f3f-3f3f-3f3f-3f3f3f3f3f3f.jpg',
    content: `
      <p>Planning ahead is key to FPL success. Let's look at which teams have the best fixtures over the next few gameweeks.</p>
      
      <h3>Teams with Green Fixtures</h3>
      <p>These teams face easier opponents and are worth loading up on.</p>
      
      <h3>Teams to Avoid</h3>
      <p>Facing tough fixtures? Here's who you might want to transfer out.</p>
      
      <h3>Long-term Planning</h3>
      <p>Look beyond the next gameweek with our long-term fixture analysis.</p>
    `,
  },
];

const News = () => {
  const { news_id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewsArticle = async () => {
      try {
        const { data, error } = await supabase
          .from('News')
          .select('*')
          .eq('id', parseInt(news_id))
          .single();
        
        if (error) {
          console.error('Error fetching news article:', error);
          // Fallback to placeholder data
          const foundNews = PLACEHOLDER_NEWS.find(n => n.id === parseInt(news_id));
          setNews(foundNews);
          setLoading(false);
          return;
        }
        
        if (data) {
          // Map Supabase data format to component format
          const mappedArticle = {
            id: data.id,
            title: data.Title,
            date: data.created_at,
            image: data.PictureUrl,
            content: data.Content,
            pictureCredit: data.PictureCredit
          };
          setNews(mappedArticle);
        }
        setLoading(false);
      } catch (err) {
        console.error('Exception fetching news article:', err);
        // Fallback to placeholder data
        const foundNews = PLACEHOLDER_NEWS.find(n => n.id === parseInt(news_id));
        setNews(foundNews);
        setLoading(false);
      }
    };

    fetchNewsArticle();
  }, [news_id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-4 md:px-8 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600">Loading news article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="p-4 md:px-8 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600">News article not found.</p>
            <button
              onClick={() => navigate('/home')}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:px-8 pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header Image */}
          <div className="relative h-96">
            <img
              src={news.image}
              alt={news.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/1200x600/4F46E5/FFFFFF?text=FPL+Genie+News';
              }}
            />
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Back Button */}
            <button
              onClick={() => navigate('/home')}
              className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>

            {/* Date */}
            <p className="text-blue-600 text-sm font-medium mb-3">{formatDate(news.date)}</p>

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-6">{news.title}</h1>

            {/* Content */}
            <div 
              className="max-w-none text-gray-700 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-800 [&_h3]:mt-4 [&_h3]:mb-3 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_li]:mb-2"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />

            {/* Footer */}
            {news.pictureCredit && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-gray-500 text-sm">
                  Photo credit: {news.pictureCredit}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default News;
