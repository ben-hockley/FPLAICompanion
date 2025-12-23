import { Link, useLocation } from 'react-router-dom';
import fplGenieLogo from '../assets/FPL_Genie_Logo.png';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    {
      path: '/home',
      label: 'Home',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/my-team',
      label: 'My Team',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      path: '/player-stats',
      label: 'Player Stats',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      path: '/fixtures',
      label: 'Fixtures',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      path: '/predicted-points',
      label: 'Predicted Points',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      path: '/league-table',
      label: 'League Table',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      path: '/articles',
      label: 'News',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    }
  ];

  return (
    <>
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-24 bg-gradient-to-b from-blue-600 to-indigo-700 shadow-2xl z-50 flex-col">
      {/* Logo Section */}
      <div className="py-4 px-2 border-b border-blue-500/30">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-2 shadow-lg">
            <img src={fplGenieLogo} alt="FPL Genie" className="w-12 h-12 rounded-full object-cover" />
          </div>
          <span className="text-[10px] font-semibold text-white text-center leading-tight">FPL Genie</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center py-3 px-2 transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-white/20 border-l-4 border-white'
                : 'hover:bg-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
              isActive(item.path)
                ? 'bg-white text-blue-600 shadow-lg'
                : 'bg-white/20 text-white'
            }`}>
              {item.icon}
            </div>
            <span className={`text-[9px] font-medium text-center leading-tight px-1 ${
              isActive(item.path) ? 'text-white font-semibold' : 'text-blue-100'
            }`}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="py-3 px-2 border-t border-blue-500/30">
        <p className="text-[9px] text-center text-blue-200 leading-tight">
          © 2025
        </p>
      </div>
    </aside>
    
    {/* Mobile Bottom Navigation */}
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-2xl z-50 border-t border-blue-400">
      <div className="flex justify-around items-center py-1">
        {/* Home */}
        <Link
          to="/home"
          className={`flex flex-col items-center justify-center py-1.5 px-1 transition-all duration-200 min-w-0 flex-1 ${
            isActive('/home') ? 'bg-white/20' : 'hover:bg-white/10'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            isActive('/home') ? 'text-white' : 'text-blue-100'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className={`text-[8px] font-medium text-center leading-tight mt-0.5 ${
            isActive('/home') ? 'text-white font-semibold' : 'text-blue-100'
          }`}>
            Home
          </span>
        </Link>
        
        {/* My Team */}
        <Link
          to="/my-team"
          className={`flex flex-col items-center justify-center py-1.5 px-1 transition-all duration-200 min-w-0 flex-1 ${
            isActive('/my-team') ? 'bg-white/20' : 'hover:bg-white/10'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            isActive('/my-team') ? 'text-white' : 'text-blue-100'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span className={`text-[8px] font-medium text-center leading-tight mt-0.5 ${
            isActive('/my-team') ? 'text-white font-semibold' : 'text-blue-100'
          }`}>
            My Team
          </span>
        </Link>
        
        {/* Player Stats */}
        <Link
          to="/player-stats"
          className={`flex flex-col items-center justify-center py-1.5 px-1 transition-all duration-200 min-w-0 flex-1 ${
            isActive('/player-stats') ? 'bg-white/20' : 'hover:bg-white/10'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            isActive('/player-stats') ? 'text-white' : 'text-blue-100'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className={`text-[8px] font-medium text-center leading-tight mt-0.5 ${
            isActive('/player-stats') ? 'text-white font-semibold' : 'text-blue-100'
          }`}>
            Stats
          </span>
        </Link>
        
        {/* Predicted Points */}
        <Link
          to="/predicted-points"
          className={`flex flex-col items-center justify-center py-1.5 px-1 transition-all duration-200 min-w-0 flex-1 ${
            isActive('/predicted-points') ? 'bg-white/20' : 'hover:bg-white/10'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            isActive('/predicted-points') ? 'text-white' : 'text-blue-100'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className={`text-[8px] font-medium text-center leading-tight mt-0.5 ${
            isActive('/predicted-points') ? 'text-white font-semibold' : 'text-blue-100'
          }`}>
            Predicted
          </span>
        </Link>
        
        {/* News */}
        <Link
          to="/articles"
          className={`flex flex-col items-center justify-center py-1.5 px-1 transition-all duration-200 min-w-0 flex-1 ${
            isActive('/articles') ? 'bg-white/20' : 'hover:bg-white/10'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            isActive('/articles') ? 'text-white' : 'text-blue-100'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <span className={`text-[8px] font-medium text-center leading-tight mt-0.5 ${
            isActive('/articles') ? 'text-white font-semibold' : 'text-blue-100'
          }`}>
            News
          </span>
        </Link>
      </div>
    </nav>
  </>
  );
};

export default Sidebar;
