import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader } from "@/components/Loader";

interface RevenueChartData {
  month: string;
  revenue: number;
  orders: number;
}

interface UserChartData {
  month: string;
  users: number;
  sellers: number;
}

interface OrderStatusData {
  name: string;
  value: number;
  [key: string]: any;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export const RevenueChart: React.FC<{
  data: RevenueChartData[];
  isLoading?: boolean;
}> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader size={40} color="#4f46e5" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:border dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">
        Revenue & Orders Overview
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            tick={{ fill: "#6b7280" }}
          />
          <YAxis
            yAxisId="left"
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            tick={{ fill: "#6b7280" }}
            label={{ value: "Revenue (LKR)", angle: -90, position: "insideLeft" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            tick={{ fill: "#6b7280" }}
            label={{ value: "Orders", angle: 90, position: "insideRight" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="revenue"
            fill="#10b981"
            name="Revenue (LKR)"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="orders"
            fill="#3b82f6"
            name="Orders"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const UserGrowthChart: React.FC<{
  data: UserChartData[];
  isLoading?: boolean;
}> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader size={40} color="#4f46e5" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:border dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">
        User Growth
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            tick={{ fill: "#6b7280" }}
          />
          <YAxis
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            tick={{ fill: "#6b7280" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="users"
            stroke="#3b82f6"
            name="Users"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="sellers"
            stroke="#10b981"
            name="Sellers"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const OrderStatusPieChart: React.FC<{
  data: OrderStatusData[];
  isLoading?: boolean;
}> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader size={40} color="#4f46e5" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:border dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">
        Order Status Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ListingsChart: React.FC<{
  data: { name: string; value: number }[];
  isLoading?: boolean;
}> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader size={40} color="#4f46e5" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:border dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">
        EV Listings by Brand
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const BookingsChart: React.FC<{
  data: { month: string; bookings: number }[];
  isLoading?: boolean;
}> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader size={40} color="#4f46e5" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:border dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">
        Test Drive Bookings Trend
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            tick={{ fill: "#6b7280" }}
          />
          <YAxis
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            tick={{ fill: "#6b7280" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar
            dataKey="bookings"
            fill="#8b5cf6"
            name="Bookings"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ReviewRatingsChart: React.FC<{
  data: { rating: string; count: number }[];
  isLoading?: boolean;
}> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader size={40} color="#4f46e5" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:border dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">
        Review Ratings Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="rating"
            type="category"
            stroke="#6b7280"
            className="dark:stroke-gray-400"
            tick={{ fill: "#6b7280" }}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Bar
            dataKey="count"
            fill="#f59e0b"
            name="Reviews"
            radius={[0, 8, 8, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

