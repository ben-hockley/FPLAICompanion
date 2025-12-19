// Status icon component for player availability status
const StatusIcon = ({ status, news = "", className = "" }) => {
  if (!status || status === 'a') return null;

  const statusConfig = {
    i: { color: 'bg-red-500', text: 'Injured', icon: 'I' },
    d: { color: 'bg-yellow-500', text: 'Doubtful', icon: 'D' },
    u: { color: 'bg-gray-500', text: 'Unavailable', icon: 'U' },
    s: { color: 'bg-orange-500', text: 'Suspended', icon: 'S' },
    n: { color: 'bg-blue-500', text: 'Away', icon: 'A' }
  };

  const config = statusConfig[status.toLowerCase()];
  if (!config) return null;

  // Use news if available, otherwise default to status text
  const tooltipText = news && news.trim() !== "" ? news : config.text;

  return (
    <span 
      className={`inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white ${config.color} rounded-full ${className}`}
      title={tooltipText}
      aria-label={tooltipText}
    >
      {config.icon}
    </span>
  );
};

export default StatusIcon;
