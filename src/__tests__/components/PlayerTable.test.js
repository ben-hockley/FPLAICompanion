import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlayerTable from '../../components/PlayerTable';

// Mock child components
jest.mock('../../components/PlayerModal', () => {
  return function MockPlayerModal({ player, onClose }) {
    return (
      <div data-testid="player-modal">
        <button onClick={onClose}>Close Modal</button>
        <div>{player.web_name}</div>
      </div>
    );
  };
});

jest.mock('../../components/FilterModal', () => {
  return function MockFilterModal({ isOpen, onClose, onApplyFilters, currentFilters, teams }) {
    if (!isOpen) return null;
    return (
      <div data-testid="filter-modal">
        <button data-testid="close-filter-modal" onClick={onClose}>×</button>
        <h2>Filter Players</h2>
        
        <input
          data-testid="filter-player-name"
          type="text"
          placeholder="Search by player name..."
          onChange={(e) => currentFilters.playerName = e.target.value}
        />
        
        <select
          data-testid="filter-team"
          onChange={(e) => currentFilters.team = e.target.value}
        >
          <option value="">All Teams</option>
          {Object.entries(teams).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        
        <select
          data-testid="filter-position"
          onChange={(e) => currentFilters.position = e.target.value}
        >
          <option value="">All Positions</option>
          <option value="1">Goalkeeper (GK)</option>
          <option value="2">Defender (DEF)</option>
          <option value="3">Midfielder (MID)</option>
          <option value="4">Forward (FWD)</option>
        </select>

        <input
          data-testid="filter-penalty-taker"
          type="checkbox"
          onChange={(e) => currentFilters.penaltyTaker = e.target.checked}
        />
        
        <input
          data-testid="filter-freekick-taker"
          type="checkbox"
          onChange={(e) => currentFilters.freeKickTaker = e.target.checked}
        />
        
        <input
          data-testid="filter-corner-taker"
          type="checkbox"
          onChange={(e) => currentFilters.cornerTaker = e.target.checked}
        />

        <input
          data-testid="filter-min-price"
          type="number"
          placeholder="Min"
          onChange={(e) => currentFilters.minValue = e.target.value}
        />
        
        <input
          data-testid="filter-max-price"
          type="number"
          placeholder="Max"
          onChange={(e) => currentFilters.maxValue = e.target.value}
        />

        <input
          data-testid="filter-min-points"
          type="number"
          placeholder="Min"
          onChange={(e) => currentFilters.minPoints = e.target.value}
        />
        
        <input
          data-testid="filter-max-points"
          type="number"
          placeholder="Max"
          onChange={(e) => currentFilters.maxPoints = e.target.value}
        />

        <input
          data-testid="filter-min-ppg"
          type="number"
          placeholder="Min"
          onChange={(e) => currentFilters.minPPG = e.target.value}
        />
        
        <input
          data-testid="filter-max-ppg"
          type="number"
          placeholder="Max"
          onChange={(e) => currentFilters.maxPPG = e.target.value}
        />

        <input
          data-testid="filter-min-form"
          type="number"
          placeholder="Min"
          onChange={(e) => currentFilters.minForm = e.target.value}
        />
        
        <input
          data-testid="filter-max-form"
          type="number"
          placeholder="Max"
          onChange={(e) => currentFilters.maxForm = e.target.value}
        />
        
        <button
          data-testid="apply-filters"
          onClick={() => {
            onApplyFilters(currentFilters);
            onClose();
          }}
        >
          Apply Filters
        </button>
        
        <button
          data-testid="clear-filters"
          onClick={() => {
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
              maxForm: '',
              inMyTeam: false,
              penaltyTaker: false,
              freeKickTaker: false,
              cornerTaker: false
            };
            onApplyFilters(emptyFilters);
            onClose();
          }}
        >
          Clear All Filters
        </button>
      </div>
    );
  };
});

jest.mock('../../components/StatusIcon', () => {
  return function MockStatusIcon({ status, news }) {
    if (!status || status === 'a') return null;
    const statusMap = {
      'i': 'Injured',
      'd': 'Doubtful',
      'u': 'Unavailable',
      's': 'Suspended'
    };
    return <span data-testid={`status-icon-${status}`}>{statusMap[status]}</span>;
  };
});

describe('PlayerTable Component', () => {
  // Mock data that matches the actual FPL API structure
  const mockTeams = {
    1: 'Arsenal',
    2: 'Chelsea',
    3: 'Liverpool',
    4: 'Man City'
  };

  const mockPlayers = [
    {
      id: 1,
      web_name: 'Salah',
      team: 3,
      element_type: 3, // MID
      now_cost: 130, // £13.0m
      total_points: 150,
      points_per_game: '7.5',
      form: '8.2',
      selected_by_percent: '45.2',
      status: 'a', // Available
      news: '',
      penalties_order: 1,
      direct_freekicks_order: null,
      corners_and_indirect_freekicks_order: 1
    },
    {
      id: 2,
      web_name: 'Haaland',
      team: 4,
      element_type: 4, // FWD
      now_cost: 145, // £14.5m
      total_points: 180,
      points_per_game: '9.0',
      form: '9.5',
      selected_by_percent: '60.1',
      status: 'a',
      news: '',
      penalties_order: 1,
      direct_freekicks_order: null,
      corners_and_indirect_freekicks_order: null
    },
    {
      id: 3,
      web_name: 'Van Dijk',
      team: 3,
      element_type: 2, // DEF
      now_cost: 65, // £6.5m
      total_points: 80,
      points_per_game: '4.0',
      form: '5.0',
      selected_by_percent: '25.3',
      status: 'i', // Injured
      news: 'Knee injury',
      penalties_order: null,
      direct_freekicks_order: null,
      corners_and_indirect_freekicks_order: null
    },
    {
      id: 4,
      web_name: 'Ramsdale',
      team: 1,
      element_type: 1, // GK
      now_cost: 50, // £5.0m
      total_points: 60,
      points_per_game: '3.0',
      form: '3.5',
      selected_by_percent: '15.7',
      status: 'd', // Doubtful
      news: 'Fitness test',
      penalties_order: null,
      direct_freekicks_order: null,
      corners_and_indirect_freekicks_order: null
    },
    {
      id: 5,
      web_name: 'Saka',
      team: 1,
      element_type: 3, // MID
      now_cost: 95, // £9.5m
      total_points: 120,
      points_per_game: '6.0',
      form: '7.0',
      selected_by_percent: '35.8',
      status: 'u', // Unavailable
      news: 'Suspended',
      penalties_order: null,
      direct_freekicks_order: 1,
      corners_and_indirect_freekicks_order: null
    }
  ];

  const mockOnTeamClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Table Visibility and Data Display', () => {
    test('should render the table with all column headers visible', () => {
      // Arrange
      const { container } = render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Component renders

      // Assert
      expect(screen.getByText('Fantasy Premier League Player Stats')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Player/ })).toBeInTheDocument(); // Check for Column header because text Player is also displayed in the Title.
      expect(screen.getByText(/Team/)).toBeInTheDocument();
      expect(screen.getByText(/Position/)).toBeInTheDocument();
      expect(screen.getByText(/Price/)).toBeInTheDocument();
      expect(screen.getByText(/Total Points/)).toBeInTheDocument();
      expect(screen.getByText(/Points\/Game/)).toBeInTheDocument();
      expect(screen.getByText(/Form/)).toBeInTheDocument();
      expect(screen.getByText(/Selected %/)).toBeInTheDocument();
      expect(screen.getByText(/Set-Pieces/)).toBeInTheDocument();
    });

    test('should display all player data correctly including status icons and set piece markers', () => {
      // Arrange & Act
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Assert - Check all players are displayed
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.getByText('Haaland')).toBeInTheDocument();
      expect(screen.getByText('Van Dijk')).toBeInTheDocument();
      expect(screen.getByText('Ramsdale')).toBeInTheDocument();
      expect(screen.getByText('Saka')).toBeInTheDocument();

      // Assert - Check team names are displayed
      expect(screen.getAllByText('Liverpool').length).toBeGreaterThan(0);
      expect(screen.getByText('Man City')).toBeInTheDocument();
      expect(screen.getAllByText('Arsenal').length).toBeGreaterThan(0);

      // Assert - Check prices are displayed correctly
      expect(screen.getByText('£13.0')).toBeInTheDocument();
      expect(screen.getByText('£14.5')).toBeInTheDocument();
      expect(screen.getByText('£6.5')).toBeInTheDocument();

      // Assert - Check total points
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('180')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();

      // Assert - Check status icons for injured/doubtful/unavailable players
      expect(screen.getByTestId('status-icon-i')).toBeInTheDocument(); // Van Dijk - Injured
      expect(screen.getByTestId('status-icon-d')).toBeInTheDocument(); // Ramsdale - Doubtful
      expect(screen.getByTestId('status-icon-u')).toBeInTheDocument(); // Saka - Unavailable

      // Assert - Check set piece markers (P, F, C badges)
      const penaltyMarkers = screen.getAllByTitle('Penalty Taker');
      expect(penaltyMarkers.length).toBe(2); // Salah and Haaland
      
      const freeKickMarkers = screen.getAllByTitle('Direct Free Kick Taker');
      expect(freeKickMarkers.length).toBe(1); // Saka
      
      const cornerMarkers = screen.getAllByTitle('Corner & Indirect Free Kick Taker');
      expect(cornerMarkers.length).toBe(1); // Salah
    });
  });

  describe('Column Sorting', () => {
    test('should sort by player name in ascending order on first click and descending on second click', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Click Player column header (first click - ascending)
      const playerHeader = screen.getByRole('columnheader', { name: /Player/ });
      fireEvent.click(playerHeader);

      // Assert - Check ascending sort (Haaland, Ramsdale, Saka, Salah, Van Dijk)
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1); // Skip header row
      expect(within(dataRows[0]).getByText('Haaland')).toBeInTheDocument();

      // Act - Click again for descending sort
      fireEvent.click(playerHeader);

      // Assert - Check descending sort (Van Dijk, Salah, Saka, Ramsdale, Haaland)
      const rowsAfterSecondClick = screen.getAllByRole('row');
      const dataRowsDesc = rowsAfterSecondClick.slice(1);
      expect(within(dataRowsDesc[0]).getByText('Van Dijk')).toBeInTheDocument();
    });

    test('should sort by total points in ascending and descending order', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Note: Default sort is by total_points descending
      // Act - Click Total Points column header (first click - ascending)
      const pointsHeader = screen.getByText(/Total Points/).closest('th');
      fireEvent.click(pointsHeader);

      // Assert - Check ascending sort (60, 80, 120, 150, 180)
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1);
      expect(within(dataRows[0]).getByText('Ramsdale')).toBeInTheDocument(); // 60 points

      // Act - Click again for descending sort
      fireEvent.click(pointsHeader);

      // Assert - Check descending sort (180, 150, 120, 80, 60)
      const rowsAfterSecondClick = screen.getAllByRole('row');
      const dataRowsDesc = rowsAfterSecondClick.slice(1);
      expect(within(dataRowsDesc[0]).getByText('Haaland')).toBeInTheDocument(); // 180 points
    });

    test('should sort by price in ascending and descending order', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Click Price column header
      const priceHeader = screen.getByText(/Price/).closest('th');
      fireEvent.click(priceHeader);

      // Assert - Check ascending sort (5.0, 6.5, 9.5, 13.0, 14.5)
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1);
      expect(within(dataRows[0]).getByText('Ramsdale')).toBeInTheDocument(); // £5.0

      // Act - Click again for descending
      fireEvent.click(priceHeader);

      // Assert - Check descending sort
      const rowsDesc = screen.getAllByRole('row');
      const dataRowsDesc = rowsDesc.slice(1);
      expect(within(dataRowsDesc[0]).getByText('Haaland')).toBeInTheDocument(); // £14.5
    });

    test('should sort by form in ascending and descending order', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Click Form column header
      const formHeader = screen.getByText(/Form/).closest('th');
      fireEvent.click(formHeader);

      // Assert - Check ascending sort (3.5, 5.0, 7.0, 8.2, 9.5)
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1);
      expect(within(dataRows[0]).getByText('Ramsdale')).toBeInTheDocument(); // 3.5 form

      // Act - Click again for descending
      fireEvent.click(formHeader);

      // Assert - Check descending sort
      const rowsDesc = screen.getAllByRole('row');
      const dataRowsDesc = rowsDesc.slice(1);
      expect(within(dataRowsDesc[0]).getByText('Haaland')).toBeInTheDocument(); // 9.5 form
    });
  });

  describe('Table Scrollability', () => {
    test('should have scrollable container for table content', () => {
      // Arrange & Act
      const { container } = render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Assert - Check for overflow-y-auto class which enables scrolling
      const scrollableDiv = container.querySelector('.overflow-y-auto');
      expect(scrollableDiv).toBeInTheDocument();
      expect(scrollableDiv).toHaveClass('overflow-y-auto');
    });
  });

  describe('Player Filter Button', () => {
    test('should render filter button and be visible to user', () => {
      // Arrange & Act
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Assert
      const filterButton = screen.getByRole('button', { name: /Filter/i });
      expect(filterButton).toBeInTheDocument();
      expect(filterButton).toBeVisible();
    });

    test('should display filter modal when filter button is clicked', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Click the filter button
      const filterButton = screen.getByRole('button', { name: /Filter/i });
      fireEvent.click(filterButton);

      // Assert - Modal should be visible
      expect(screen.getByTestId('filter-modal')).toBeInTheDocument();
      expect(screen.getByText('Filter Players')).toBeInTheDocument();
    });

    test('should display all filter fields and buttons in the modal', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Open filter modal
      const filterButton = screen.getByRole('button', { name: /Filter/i });
      fireEvent.click(filterButton);

      // Assert - Check all filter inputs are present
      expect(screen.getByTestId('filter-player-name')).toBeInTheDocument();
      expect(screen.getByTestId('filter-team')).toBeInTheDocument();
      expect(screen.getByTestId('filter-position')).toBeInTheDocument();
      expect(screen.getByTestId('filter-penalty-taker')).toBeInTheDocument();
      expect(screen.getByTestId('filter-freekick-taker')).toBeInTheDocument();
      expect(screen.getByTestId('filter-corner-taker')).toBeInTheDocument();
      expect(screen.getByTestId('filter-min-price')).toBeInTheDocument();
      expect(screen.getByTestId('filter-max-price')).toBeInTheDocument();
      expect(screen.getByTestId('filter-min-points')).toBeInTheDocument();
      expect(screen.getByTestId('filter-max-points')).toBeInTheDocument();
      expect(screen.getByTestId('filter-min-ppg')).toBeInTheDocument();
      expect(screen.getByTestId('filter-max-ppg')).toBeInTheDocument();
      expect(screen.getByTestId('filter-min-form')).toBeInTheDocument();
      expect(screen.getByTestId('filter-max-form')).toBeInTheDocument();
      
      // Assert - Check action buttons
      expect(screen.getByTestId('apply-filters')).toBeInTheDocument();
      expect(screen.getByTestId('clear-filters')).toBeInTheDocument();
      expect(screen.getByTestId('close-filter-modal')).toBeInTheDocument();
    });
  });

  describe('Player Name Filter', () => {
    test('should filter players by name when search is applied', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Open modal and apply name filter
      fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
      
      const nameInput = screen.getByTestId('filter-player-name');
      fireEvent.change(nameInput, { target: { value: 'Salah' } });
      
      fireEvent.click(screen.getByTestId('apply-filters'));

      // Assert - Only Salah should be visible
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.queryByText('Haaland')).not.toBeInTheDocument();
      expect(screen.queryByText('Van Dijk')).not.toBeInTheDocument();
      expect(screen.queryByText('Ramsdale')).not.toBeInTheDocument();
      expect(screen.queryByText('Saka')).not.toBeInTheDocument();
    });
  });

  describe('Team Filter', () => {
    test('should filter players by team when team filter is applied', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Open modal and select Liverpool (team id: 3)
      fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
      
      const teamSelect = screen.getByTestId('filter-team');
      fireEvent.change(teamSelect, { target: { value: '3' } });
      
      fireEvent.click(screen.getByTestId('apply-filters'));

      // Assert - Only Liverpool players (Salah, Van Dijk) should be visible
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.getByText('Van Dijk')).toBeInTheDocument();
      expect(screen.queryByText('Haaland')).not.toBeInTheDocument();
      expect(screen.queryByText('Ramsdale')).not.toBeInTheDocument();
      expect(screen.queryByText('Saka')).not.toBeInTheDocument();
    });
  });

  describe('Position Filter', () => {
    test('should filter players by position when position filter is applied', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Open modal and select Midfielders (position: 3)
      fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
      
      const positionSelect = screen.getByTestId('filter-position');
      fireEvent.change(positionSelect, { target: { value: '3' } });
      
      fireEvent.click(screen.getByTestId('apply-filters'));

      // Assert - Only midfielders (Salah, Saka) should be visible
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.getByText('Saka')).toBeInTheDocument();
      expect(screen.queryByText('Haaland')).not.toBeInTheDocument();
      expect(screen.queryByText('Van Dijk')).not.toBeInTheDocument();
      expect(screen.queryByText('Ramsdale')).not.toBeInTheDocument();
    });
  });

  describe('Set Piece Takers Filter', () => {
    test('should filter penalty takers when penalty taker filter is applied', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Open modal and check penalty taker filter
      fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
      
      const penaltyCheckbox = screen.getByTestId('filter-penalty-taker');
      fireEvent.click(penaltyCheckbox);
      
      fireEvent.click(screen.getByTestId('apply-filters'));

      // Assert - Only penalty takers (Salah, Haaland) should be visible
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.getByText('Haaland')).toBeInTheDocument();
      expect(screen.queryByText('Van Dijk')).not.toBeInTheDocument();
      expect(screen.queryByText('Ramsdale')).not.toBeInTheDocument();
      expect(screen.queryByText('Saka')).not.toBeInTheDocument();
    });

    test('should filter free kick takers when free kick filter is applied', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Open modal and check free kick taker filter
      fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
      
      const freeKickCheckbox = screen.getByTestId('filter-freekick-taker');
      fireEvent.click(freeKickCheckbox);
      
      fireEvent.click(screen.getByTestId('apply-filters'));

      // Assert - Only free kick taker (Saka) should be visible
      expect(screen.getByText('Saka')).toBeInTheDocument();
      expect(screen.queryByText('Salah')).not.toBeInTheDocument();
      expect(screen.queryByText('Haaland')).not.toBeInTheDocument();
      expect(screen.queryByText('Van Dijk')).not.toBeInTheDocument();
      expect(screen.queryByText('Ramsdale')).not.toBeInTheDocument();
    });

    test('should filter corner takers when corner taker filter is applied', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Open modal and check corner taker filter
      fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
      
      const cornerCheckbox = screen.getByTestId('filter-corner-taker');
      fireEvent.click(cornerCheckbox);
      
      fireEvent.click(screen.getByTestId('apply-filters'));

      // Assert - Only corner taker (Salah) should be visible
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.queryByText('Haaland')).not.toBeInTheDocument();
      expect(screen.queryByText('Van Dijk')).not.toBeInTheDocument();
      expect(screen.queryByText('Ramsdale')).not.toBeInTheDocument();
      expect(screen.queryByText('Saka')).not.toBeInTheDocument();
    });
  });

  describe('Min/Max Range Filters', () => {
    test('should filter players by price range', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Filter for players between £6.0 and £10.0
      fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
      
      fireEvent.change(screen.getByTestId('filter-min-price'), { target: { value: '6.0' } });
      fireEvent.change(screen.getByTestId('filter-max-price'), { target: { value: '10.0' } });
      
      fireEvent.click(screen.getByTestId('apply-filters'));

      // Assert - Only Van Dijk (£6.5) and Saka (£9.5) should be visible
      expect(screen.getByText('Van Dijk')).toBeInTheDocument();
      expect(screen.getByText('Saka')).toBeInTheDocument();
      expect(screen.queryByText('Salah')).not.toBeInTheDocument(); // £13.0
      expect(screen.queryByText('Haaland')).not.toBeInTheDocument(); // £14.5
      expect(screen.queryByText('Ramsdale')).not.toBeInTheDocument(); // £5.0
    });

    test('should filter players by total points range', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Filter for players with 100-160 total points
      fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
      
      fireEvent.change(screen.getByTestId('filter-min-points'), { target: { value: '100' } });
      fireEvent.change(screen.getByTestId('filter-max-points'), { target: { value: '160' } });
      
      fireEvent.click(screen.getByTestId('apply-filters'));

      // Assert - Only Salah (150) and Saka (120) should be visible
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.getByText('Saka')).toBeInTheDocument();
      expect(screen.queryByText('Haaland')).not.toBeInTheDocument(); // 180
      expect(screen.queryByText('Van Dijk')).not.toBeInTheDocument(); // 80
      expect(screen.queryByText('Ramsdale')).not.toBeInTheDocument(); // 60
    });

    test('should filter players by points per game range', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Filter for players with 5.0-8.0 PPG
      fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
      
      fireEvent.change(screen.getByTestId('filter-min-ppg'), { target: { value: '5.0' } });
      fireEvent.change(screen.getByTestId('filter-max-ppg'), { target: { value: '8.0' } });
      
      fireEvent.click(screen.getByTestId('apply-filters'));

      // Assert - Only Salah (7.5) and Saka (6.0) should be visible
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.getByText('Saka')).toBeInTheDocument();
      expect(screen.queryByText('Haaland')).not.toBeInTheDocument(); // 9.0
      expect(screen.queryByText('Van Dijk')).not.toBeInTheDocument(); // 4.0
      expect(screen.queryByText('Ramsdale')).not.toBeInTheDocument(); // 3.0
    });

    test('should filter players by form range', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Filter for players with 6.0-8.5 form
      fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
      
      fireEvent.change(screen.getByTestId('filter-min-form'), { target: { value: '6.0' } });
      fireEvent.change(screen.getByTestId('filter-max-form'), { target: { value: '8.5' } });
      
      fireEvent.click(screen.getByTestId('apply-filters'));

      // Assert - Only Salah (8.2) and Saka (7.0) should be visible
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.getByText('Saka')).toBeInTheDocument();
      expect(screen.queryByText('Haaland')).not.toBeInTheDocument(); // 9.5
      expect(screen.queryByText('Van Dijk')).not.toBeInTheDocument(); // 5.0
      expect(screen.queryByText('Ramsdale')).not.toBeInTheDocument(); // 3.5
    });
  });

  describe('Clear Filters', () => {
    test('should clear all filters and close modal when Clear All Filters is clicked', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Apply a filter
      fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
      fireEvent.change(screen.getByTestId('filter-player-name'), { target: { value: 'Salah' } });
      fireEvent.click(screen.getByTestId('apply-filters'));

      // Assert - Only Salah visible
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.queryByText('Haaland')).not.toBeInTheDocument();

      // Act - Open modal again and clear filters
      fireEvent.click(screen.getByRole('button', { name: /Filters Active/i }));
      fireEvent.click(screen.getByTestId('clear-filters'));

      // Assert - All players should be visible again
      expect(screen.getByText('Salah')).toBeInTheDocument();
      expect(screen.getByText('Haaland')).toBeInTheDocument();
      expect(screen.getByText('Van Dijk')).toBeInTheDocument();
      expect(screen.getByText('Ramsdale')).toBeInTheDocument();
      expect(screen.getByText('Saka')).toBeInTheDocument();

      // Assert - Modal should be closed
      expect(screen.queryByTestId('filter-modal')).not.toBeInTheDocument();
    });
  });

  describe('Close Filter Modal', () => {
    test('should close filter modal when X button is clicked', () => {
      // Arrange
      render(
        <PlayerTable 
          players={mockPlayers} 
          teams={mockTeams}
          onTeamClick={mockOnTeamClick}
        />
      );

      // Act - Open modal
      fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
      
      // Assert - Modal is open
      expect(screen.getByTestId('filter-modal')).toBeInTheDocument();

      // Act - Close modal with X button
      fireEvent.click(screen.getByTestId('close-filter-modal'));

      // Assert - Modal is closed
      expect(screen.queryByTestId('filter-modal')).not.toBeInTheDocument();
    });
  });
});
