import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { sellerService } from "../sellerService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectActiveRoleId } from "@/context/authSlice";
import { Loader } from "@/components/Loader";
import { queryKeys } from "@/config/queryKeys";

interface ChartDataPoint {
  month: string;
  revenue: number;
  orders: number;
}

export const AnalyticsChart: React.FC = () => {
  const sellerId = useAppSelector(selectActiveRoleId);

  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: queryKeys.sellerOrders(sellerId!),
    queryFn: () => sellerService.getSellerOrders(sellerId!),
    enabled: !!sellerId,
    staleTime: 5 * 60 * 1000,
  });

  // Process orders data to create chart data
  const chartData: ChartDataPoint[] = useMemo(() => {
    // Backend's handleResult unwraps { success: true, orders: [...] } to just the orders array
    // So ordersData is the orders array directly
    const orders = Array.isArray(ordersData) ? ordersData : [];
    
    if (orders.length === 0) {
      return [];
    }
    
    // Group orders by month
    const monthlyData: { [key: string]: { revenue: number; orders: number } } = {};

    orders.forEach((order: any) => {
      if (!order.order_date || !order.total_amount) return;

      const date = new Date(order.order_date);
      const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, orders: 0 };
      }

      // Count all orders, but only confirmed/completed orders for revenue
      if (order.order_status === "confirmed" || order.order_status === "CONFIRMED") {
        monthlyData[monthKey].revenue += order.total_amount || 0;
      }
      // Count all orders (including pending) for order count
      monthlyData[monthKey].orders += 1;
    });

    // Convert to array and sort by date
    const dataArray: ChartDataPoint[] = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        revenue: Math.round(data.revenue),
        orders: data.orders,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });

    // If no data, return last 6 months with zeros
    if (dataArray.length === 0) {
      const months = [];
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
          month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          revenue: 0,
          orders: 0,
        });
      }
      return months;
    }

    return dataArray;
  }, [ordersData]);

  // Calculate totals
  const totalRevenue = useMemo(() => {
    return chartData.reduce((sum, data) => sum + data.revenue, 0);
  }, [chartData]);

  const totalOrders = useMemo(() => {
    return chartData.reduce((sum, data) => sum + data.orders, 0);
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader size={40} color="#4f46e5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 dark:text-red-400">
          Failed to load sales data. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold dark:text-white">Sales Performance</h2>
        <div className="flex gap-4 text-sm">
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">
              Total Revenue:{" "}
            </span>
            LKR {totalRevenue.toLocaleString("en-US")}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">
              Total Orders:{" "}
            </span>
            {totalOrders}
          </div>
        </div>
      </div>

      {chartData.length === 0 || totalRevenue === 0 ? (
        <div className="bg-gray-100 dark:bg-gray-700 p-8 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-300">
            No sales data available yet. Sales will appear here once you receive orders.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              tick={{ fill: "#6b7280" }}
              style={{ fill: "#6b7280" }}
            />
            <YAxis
              yAxisId="left"
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              tick={{ fill: "#6b7280" }}
              style={{ fill: "#6b7280" }}
              label={{
                value: "Revenue (LKR)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#6b7280" },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              tick={{ fill: "#6b7280" }}
              style={{ fill: "#6b7280" }}
              label={{
                value: "Orders",
                angle: 90,
                position: "insideRight",
                style: { textAnchor: "middle", fill: "#6b7280" },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                color: "#1f2937",
              }}
              formatter={(value: any, name: string) => {
                if (name === "revenue") {
                  return [`LKR ${Number(value).toLocaleString("en-US")}`, "Revenue"];
                }
                return [value, "Orders"];
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
      )}
    </div>
  );
};
