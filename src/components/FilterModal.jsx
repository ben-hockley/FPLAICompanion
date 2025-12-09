import { useState, useEffect } from 'react';

const FilterModal = ({ isOpen, onClose, onApplyFilters, currentFilters, teams }) => {
  const [filters, setFilters] = useState({
    playerName: '',
    team: '',
    position: '',
    minValue: '',
    maxValue: '',
    minPoints: '',
    maxPoints: '',
    minPPG: '',
    maxPPG: '',
    minForm: '',
    maxForm: ''
  });

  useEffect(() => {
    if (currentFilters) {
      setFilters({
        minForm: '',
        maxForm: '',
        ...currentFilters
      });
    }
  }, [currentFilters]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      playerName: '',
      team: '',
      position: '',
      minValue: '',
      maxValue: '',
      minPoints: '',
      maxPoints: '',
      minPPG: '',
      maxPPG: '',
      minForm: '',
      maxForm: ''
    };
    setFilters(emptyFilters);
    onApplyFilters(emptyFilters);
    onClose();
  };

  const teamList = Object.entries(teams).sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Filter Players</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Player Name Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Player Name
            </label>
            <input
              type="text"
              value={filters.playerName}
              onChange={(e) => handleChange('playerName', e.target.value)}
              placeholder="Search by player name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Team Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team
            </label>
            <select
              value={filters.team}
              onChange={(e) => handleChange('team', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Teams</option>
              {teamList.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          {/* Position Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            <select
              value={filters.position}
              onChange={(e) => handleChange('position', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Positions</option>
              <option value="1">Goalkeeper (GK)</option>
              <option value="2">Defender (DEF)</option>
              <option value="3">Midfielder (MID)</option>
              <option value="4">Forward (FWD)</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (£m)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="0.1"
                value={filters.minValue}
                onChange={(e) => handleChange('minValue', e.target.value)}
                placeholder="Min"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                step="0.1"
                value={filters.maxValue}
                onChange={(e) => handleChange('maxValue', e.target.value)}
                placeholder="Max"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Total Points Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Points
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={filters.minPoints}
                onChange={(e) => handleChange('minPoints', e.target.value)}
                placeholder="Min"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                value={filters.maxPoints}
                onChange={(e) => handleChange('maxPoints', e.target.value)}
                placeholder="Max"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Points Per Game Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points/Game
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="0.1"
                value={filters.minPPG}
                onChange={(e) => handleChange('minPPG', e.target.value)}
                placeholder="Min"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                step="0.1"
                value={filters.maxPPG}
                onChange={(e) => handleChange('maxPPG', e.target.value)}
                placeholder="Max"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Player Form Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Form
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="0.1"
                value={filters.minForm}
                onChange={(e) => handleChange('minForm', e.target.value)}
                placeholder="Min"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                step="0.1"
                value={filters.maxForm}
                onChange={(e) => handleChange('maxForm', e.target.value)}
                placeholder="Max"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FilterModal;
