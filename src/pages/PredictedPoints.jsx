import PredictedPointsTable from '../components/PredictedPointsTable';

const PredictedPoints = ({ myTeamPlayerIds, onTeamClick }) => {
  return (
    <div className="p-2 sm:p-4 md:px-6 pb-8">
      <div className="max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 overflow-x-auto">
          <PredictedPointsTable myTeamPlayerIds={myTeamPlayerIds} onTeamClick={onTeamClick} />
        </div>
      </div>
    </div>
  );
};

export default PredictedPoints;
