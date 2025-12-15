import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg sticky top-0 z-40">
      <div className="max-w-full mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">FPL AI Companion</h1>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <Link
              to="/home"
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isActive('/home')
                  ? 'bg-white text-blue-600'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              Home
            </Link>
            <Link
              to="/predicted-points"
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isActive('/predicted-points')
                  ? 'bg-white text-blue-600'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              Predicted Points
            </Link>
            <Link
              to="/league-table"
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                isActive('/league-table')
                  ? 'bg-white text-blue-600'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              League Table
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
