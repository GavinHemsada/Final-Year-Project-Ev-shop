export const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}> = ({ title, value, icon, bgColor, trend }) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-gray-700 flex items-center gap-5 hover:-translate-y-1 transition-transform">
    <div className={`p-3 rounded-full ${bgColor} dark:opacity-80`}>{icon}</div>
    <div className="flex-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {trend && (
        <p
          className={`text-xs mt-1 ${
            trend.isPositive
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {trend.isPositive ? "↑" : "↓"} {trend.value}
        </p>
      )}
    </div>
  </div>
);

