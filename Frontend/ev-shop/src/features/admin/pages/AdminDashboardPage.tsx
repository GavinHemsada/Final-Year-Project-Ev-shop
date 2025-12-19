import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { StatCard } from "../components/StatsCards";
import {
  RevenueChart,
  UserGrowthChart,
  OrderStatusPieChart,
  ListingsChart,
  BookingsChart,
  ReviewRatingsChart,
} from "../components/SystemCharts";
import {
  UserIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  CarIcon,
  StarIcon,
} from "@/assets/icons/icons";
import { Loader } from "@/components/Loader";
import { ReportGeneratorButton } from "@/features/admin/components/ReportGeneratorButton";

type AdminDashboardPageProps = {
  setAlert: (alert: any) => void;
};

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = () => {


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

  // Fetch Listings
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["adminAllListings"],
    queryFn: () => adminService.getAllListings(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Bookings
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ["adminAllBookings"],
    queryFn: () => adminService.getAllTestDriveBookings(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["adminAllReviews"],
    queryFn: () => adminService.getAllReviews(),
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
      let date;
      if (user.createdAt) {
        date = new Date(user.createdAt);
      } else if (user._id) {
        // Fallback: Extract date from ObjectId
        // First 8 characters of hex string = timestamp
        const timestamp = parseInt(user._id.substring(0, 8), 16) * 1000;
        date = new Date(timestamp);
      } 
      
      if (!date || isNaN(date.getTime())) return;

      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { users: 0, sellers: 0 };
      }

      const userRoles = user.roles || user.role || [];
      let isSeller = false;
      
      if (Array.isArray(userRoles)) {
        isSeller = userRoles.some((r: any) => String(r).toLowerCase() === "seller");
      } else {
        isSeller = String(userRoles).toLowerCase() === "seller";
      }

      if (isSeller) {
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

  // Process Listings by Brand
  const listingsChartData = useMemo(() => {
    if (!listingsData || !Array.isArray(listingsData)) return [];
    const brandCounts: { [key: string]: number } = {};
    listingsData.forEach((listing: any) => {
      const brand = listing.make || listing.brand || "Unknown";
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });
    return Object.entries(brandCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories
  }, [listingsData]);

  // Process Bookings by Month
  const bookingsChartData = useMemo(() => {
    if (!bookingsData || !Array.isArray(bookingsData)) return [];
    const monthlyData: { [key: string]: number } = {};
    bookingsData.forEach((booking: any) => {
        if(!booking.booking_date) return;
        const date = new Date(booking.booking_date);
        const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });
    return Object.entries(monthlyData)
        .map(([month, bookings]) => ({ month, bookings }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
        .slice(-6);
  }, [bookingsData]);

  // Process Reviews by Rating
  const reviewsChartData = useMemo(() => {
    if (!reviewsData || !Array.isArray(reviewsData)) return [];
    const ratingCounts: { [key: string]: number } = {};
    [5, 4, 3, 2, 1].forEach(r => ratingCounts[r.toString()] = 0); // Initialize

    reviewsData.forEach((review: any) => {
      const rating = Math.round(review.rating || 0).toString();
      if (ratingCounts[rating] !== undefined) {
        ratingCounts[rating] += 1;
      }
    });

    return Object.entries(ratingCounts)
        .map(([rating, count]) => ({ rating: `${rating} Stars`, count }));
  }, [reviewsData]);


  // Calculate stats from data
  const calculatedStats = useMemo(() => {
    const totalUsers = Array.isArray(usersData) ? usersData.length : 0;
    const totalOrders = Array.isArray(ordersData) ? ordersData.length : 0;
    const totalRevenue = Array.isArray(ordersData)
      ? ordersData
          .filter(
            (o: any) =>
              o.order_status === "confirmed" || o.order_status === "CONFIRMED" || o.status === "completed" || o.order_status === "completed"
          )
          .reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0)
      : 0;
    const totalSellers = Array.isArray(usersData)
      ? usersData.filter((u: any) => {
          // Data log shows 'role' is an array of strings like ["user", "finance"]
          // We also check 'roles' just in case.
          const userRoles = u.roles || u.role || [];
          
          if (Array.isArray(userRoles)) {
            return userRoles.some((r: any) => String(r).toLowerCase() === "seller");
          }
          return String(userRoles).toLowerCase() === "seller";
        }).length
      : 0;

    const totalFinance = Array.isArray(usersData)
      ? usersData.filter((u: any) => {
          const userRoles = u.roles || u.role || [];
          
          if (Array.isArray(userRoles)) {
            return userRoles.some((r: any) => String(r).toLowerCase() === "finance");
          }
          return String(userRoles).toLowerCase() === "finance";
        }).length
      : 0;

    return {
      totalUsers,
      totalOrders,
      totalRevenue,
      totalSellers,
      totalFinance,
    };
  }, [usersData, ordersData]);

  if (ordersLoading || usersLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size={50} color="#4f46e5" />
      </div>
    );
  }

  const statsData = calculatedStats;

  // Prepare Report Data
  const summaryReportData = [
     { Category: "Total Users", Value: statsData.totalUsers },
     { Category: "Total Sellers", Value: statsData.totalSellers },
     { Category: "Total Finance Staff", Value: statsData.totalFinance },
     { Category: "Total Orders", Value: statsData.totalOrders },
     { Category: "Total Revenue", Value: `LKR ${statsData.totalRevenue.toLocaleString("en-US")}` },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Report Button */}
      <div className="flex justify-end p-2">
         <ReportGeneratorButton 
            data={summaryReportData}
            title="System Executive Summary"
            filename="system_executive_summary"
            columns={[
               { header: "Category", dataKey: "Category" },
               { header: "Value", dataKey: "Value" }
            ]}
         />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Users"
          value={statsData.totalUsers.toString()}
          icon={<UserIcon className="h-6 w-6 text-white" />}
          bgColor="bg-blue-500"
        />
        <StatCard
          title="Total Orders"
          value={statsData.totalOrders.toString()}
          icon={<ShoppingCartIcon className="h-6 w-6 text-white" />}
          bgColor="bg-green-500"
        />
        <StatCard
          title="Total Revenue"
          value={`LKR ${statsData.totalRevenue.toLocaleString("en-US")}`}
          icon={<DollarSignIcon className="h-6 w-6 text-white" />}
          bgColor="bg-yellow-500"
        />
        <StatCard
          title="Total Sellers"
          value={statsData.totalSellers.toString()}
          icon={<CarIcon className="h-6 w-6 text-white" />}
          bgColor="bg-purple-500"
        />
        <StatCard
          title="Total Finance"
          value={statsData.totalFinance.toString()}
          icon={<DollarSignIcon className="h-6 w-6 text-white" />}
          bgColor="bg-teal-500"
        />
      </div>

      {/* Row 1: Finance & Ops Charts */}
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

      {/* Row 2: Components Overview Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <ListingsChart 
            data={listingsChartData} 
            isLoading={listingsLoading} 
         />
         <BookingsChart 
            data={bookingsChartData} 
            isLoading={bookingsLoading} 
         />
         <ReviewRatingsChart 
            data={reviewsChartData} 
            isLoading={reviewsLoading} 
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
