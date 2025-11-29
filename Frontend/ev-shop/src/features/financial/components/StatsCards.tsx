export const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
}> = ({ title, value, icon, bgColor }) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm dark:shadow-none dark:border dark:border-gray-700 flex items-center gap-5 hover:-translate-y-1 transition-transform">
    <div className={`p-3 rounded-full ${bgColor} dark:opacity-80`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

