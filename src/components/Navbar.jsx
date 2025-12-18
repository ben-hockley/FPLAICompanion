const Navbar = () => {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg fixed top-0 left-24 right-0 z-40">
      <div className="max-w-full mx-auto px-8">
        <div className="flex items-center justify-center h-16">
          {/* Search Bar */}
          <div className="w-full max-w-2xl">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-blue-400 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent placeholder-gray-500 text-gray-900"
                placeholder="Search players, teams, or stats..."
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
