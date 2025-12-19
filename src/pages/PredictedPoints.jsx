import PredictedPointsTable from '../components/PredictedPointsTable';

const PredictedPoints = ({ myTeamPlayerIds, onTeamClick }) => {
  return (
    <div className="p-4 md:px-8 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <PredictedPointsTable myTeamPlayerIds={myTeamPlayerIds} onTeamClick={onTeamClick} />
        </div>
      </div>
    </div>
  );
};

export default PredictedPoints;
