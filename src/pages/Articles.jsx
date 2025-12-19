import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const ARTICLES_PER_PAGE = 25;

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles(currentPage);
  }, [currentPage]);

  const fetchArticles = async (page) => {
    setLoading(true);
    try {
      // Get total count
      const { count } = await supabase
        .from('News')
        .select('*', { count: 'exact', head: true });
      
      setTotalCount(count || 0);

      // Get paginated articles
      const from = (page - 1) * ARTICLES_PER_PAGE;
      const to = from + ARTICLES_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('News')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) {
        console.error('Error fetching articles:', error);
        setLoading(false);
        return;
      }
      
      if (data) {
        const mappedArticles = data.map(item => ({
          id: item.id,
          title: item.Title,
          date: item.created_at,
          image: item.PictureUrl,
          pictureCredit: item.PictureCredit,
          author: item.Author
        }));
        setArticles(mappedArticles);
      }
      setLoading(false);
    } catch (err) {
      console.error('Exception fetching articles:', err);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="p-4 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">All News</h1>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600">Loading articles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:px-8 pb-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">All News</h1>
        
        {/* Articles List */}
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              onClick={() => navigate(`/news/${article.id}`)}
              className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="md:w-1/3 h-48 md:h-auto">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/600x400/4F46E5/FFFFFF?text=FPL+Genie+News';
                    }}
                  />
                </div>
                
                {/* Content */}
                <div className="md:w-2/3 p-6 flex flex-col justify-center">
                  <p className="text-blue-600 text-sm font-medium mb-2">
                    {formatDate(article.date)}
                  </p>
                  <h2 className="text-2xl font-bold text-gray-900 hover:text-purple-600 transition-colors">
                    {article.title}
                  </h2>
                  {article.author && (
                    <p className="text-gray-600 text-sm mt-2">By {article.author}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-purple-600 hover:bg-purple-50 shadow'
              }`}
            >
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2);

                if (!showPage) {
                  // Show ellipsis
                  if (page === currentPage - 3 || page === currentPage + 3) {
                    return (
                      <span key={page} className="px-3 py-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      currentPage === page
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-purple-50 shadow'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-purple-600 hover:bg-purple-50 shadow'
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* No Articles Message */}
        {articles.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">No news articles available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Articles;
