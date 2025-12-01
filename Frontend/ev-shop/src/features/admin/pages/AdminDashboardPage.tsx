import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { StatCard } from "../components/StatsCards";
import {
  RevenueChart,
  UserGrowthChart,
  OrderStatusPieChart,
} from "../components/SystemCharts";
import {
  UserIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  CarIcon,
} from "@/assets/icons/icons";
import { Loader } from "@/components/Loader";

type AdminDashboardPageProps = {
  setAlert: (alert: any) => void;
};

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  setAlert,
}) => {
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: () => adminService.getDashboardStats(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all orders for analytics
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["adminAllOrders"],
    queryFn: () => adminService.getAllOrders(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all users for analytics
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["adminAllUsers"],
    queryFn: () => adminService.getAllUsers(),
    staleTime: 5 * 60 * 1000,
  });

  // Process revenue chart data
  const revenueChartData = useMemo(() => {
    if (!ordersData || !Array.isArray(ordersData)) return [];
    
    const monthlyData: { [key: string]: { revenue: number; orders: number } } = {};
    
    ordersData.forEach((order: any) => {
      if (!order.order_date) return;
      const date = new Date(order.order_date);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, orders: 0 };
      }

      if (order.order_status === "confirmed" || order.order_status === "CONFIRMED") {
        monthlyData[monthKey].revenue += order.total_amount || 0;
      }
      monthlyData[monthKey].orders += 1;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        revenue: Math.round(data.revenue),
        orders: data.orders,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6); // Last 6 months
  }, [ordersData]);

  // Process user growth chart data
  const userGrowthData = useMemo(() => {
    if (!usersData || !Array.isArray(usersData)) return [];
    
    const monthlyData: { [key: string]: { users: number; sellers: number } } = {};
    
    usersData.forEach((user: any) => {
      if (!user.createdAt) return;
      const date = new Date(user.createdAt);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { users: 0, sellers: 0 };
      }

      if (user.roles?.includes("seller")) {
        monthlyData[monthKey].sellers += 1;
      } else {
        monthlyData[monthKey].users += 1;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        users: data.users,
        sellers: data.sellers,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6); // Last 6 months
  }, [usersData]);

  // Process order status pie chart data
  const orderStatusData = useMemo(() => {
    if (!ordersData || !Array.isArray(ordersData)) return [];
    
    const statusCounts: { [key: string]: number } = {};
    
    ordersData.forEach((order: any) => {
      const status = order.order_status || "pending";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [ordersData]);

  // Calculate stats from data
  const calculatedStats = useMemo(() => {
    const totalUsers = Array.isArray(usersData) ? usersData.length : 0;
    const totalOrders = Array.isArray(ordersData) ? ordersData.length : 0;
    const totalRevenue = Array.isArray(ordersData)
      ? ordersData
          .filter(
            (o: any) =>
              o.order_status === "confirmed" || o.order_status === "CONFIRMED"
          )
          .reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
      : 0;
    const totalSellers = Array.isArray(usersData)
      ? usersData.filter((u: any) => u.roles?.includes("seller")).length
      : 0;

    return {
      totalUsers,
      totalOrders,
      totalRevenue,
      totalSellers,
    };
  }, [usersData, ordersData]);

  if (statsLoading || ordersLoading || usersLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size={50} color="#4f46e5" />
      </div>
    );
  }

  const statsData = stats || calculatedStats;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={statsData.totalUsers?.toString() || calculatedStats.totalUsers.toString()}
          icon={<UserIcon className="h-6 w-6 text-white" />}
          bgColor="bg-blue-500"
        />
        <StatCard
          title="Total Orders"
          value={statsData.totalOrders?.toString() || calculatedStats.totalOrders.toString()}
          icon={<ShoppingCartIcon className="h-6 w-6 text-white" />}
          bgColor="bg-green-500"
        />
        <StatCard
          title="Total Revenue"
          value={`LKR ${(statsData.totalRevenue || calculatedStats.totalRevenue).toLocaleString("en-US")}`}
          icon={<DollarSignIcon className="h-6 w-6 text-white" />}
          bgColor="bg-yellow-500"
        />
        <StatCard
          title="Total Sellers"
          value={statsData.totalSellers?.toString() || calculatedStats.totalSellers.toString()}
          icon={<CarIcon className="h-6 w-6 text-white" />}
          bgColor="bg-purple-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart
          data={revenueChartData}
          isLoading={ordersLoading}
        />
        <OrderStatusPieChart
          data={orderStatusData}
          isLoading={ordersLoading}
        />
      </div>

      <div className="grid grid-cols-1">
        <UserGrowthChart
          data={userGrowthData}
          isLoading={usersLoading}
        />
      </div>
    </div>
  );
};

