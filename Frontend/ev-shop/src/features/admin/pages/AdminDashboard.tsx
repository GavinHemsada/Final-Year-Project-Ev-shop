import React, { useState } from "react";
import type { AdminActiveTab, AlertProps, ConfirmAlertProps } from "@/types";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId, logout } from "@/context/authSlice";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { AdminDashboardPage } from "./AdminDashboardPage";
import { UsersPage } from "./UsersPage";
import { OrdersPage } from "./OrdersPage";
import { EVListingsPage } from "./EVListingsPage";
import { SellersPage } from "./SellersPage";
import { FinancialPage } from "./FinancialPage";
import { ReviewsPage } from "./ReviewsPage";
import { PaymentsPage } from "./PaymentsPage";
import { CommunityManagementPage } from "./CommunityManagementPage";
import { ComplaintManagementPage } from "./ComplaintManagementPage";
import { TestDrivesManagementPage } from "./TestDrivesManagementPage";
import { MLPipelinePage } from "./MLPipelinePage";
import { Alert, ConfirmAlert } from "@/components/MessageAlert";

const notifications: any[] = [];

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminActiveTab>("dashboard");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [confirmAlert, setConfirmAlert] = useState<ConfirmAlertProps | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const userID = useAppSelector(selectUserId);

  const handleSetAlert = (alert: AlertProps | null) => {
    setAlert(alert);
    if (alert) {
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handleSetConfirmAlert = (alert: ConfirmAlertProps | null) => {
    setConfirmAlert(alert);
  };

  const handleCloseAlert = () => {
    setAlert(null);
  };

  const handleCloseConfirmAlert = () => {
    setConfirmAlert(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboardPage setAlert={handleSetAlert} />;
      case "users":
        return <UsersPage setAlert={handleSetAlert} />;
      case "orders":
        return <OrdersPage setAlert={handleSetAlert} />;
      case "evListings":
        return <EVListingsPage setAlert={handleSetAlert} />;
      case "sellers":
        return <SellersPage setAlert={handleSetAlert} />;
      case "financial":
        return <FinancialPage setAlert={handleSetAlert} />;
      case "reviews":
        return <ReviewsPage setAlert={handleSetAlert} />;
      case "payments":
        return <PaymentsPage setAlert={handleSetAlert} />;
      case "community":
        return <CommunityManagementPage setAlert={handleSetAlert} />;
      case "complaints":
        return <ComplaintManagementPage />;
      case "testDrives":
        return <TestDrivesManagementPage setAlert={handleSetAlert} />;
      case "mlPipeline":
        return <MLPipelinePage setAlert={handleSetAlert} />;
      default:
        return <AdminDashboardPage setAlert={handleSetAlert} />;
    }
  }; 

  const handleLogout = () => {
    if (logout) dispatch(logout());
    navigate("/auth/login");
  };

  return (
    <>
      <Alert alert={alert} onClose={handleCloseAlert} />
      <ConfirmAlert
        alert={confirmAlert}
        onClose={handleCloseConfirmAlert}
        onConfirm={() => {
          if (confirmAlert?.onConfirmAction) {
            confirmAlert.onConfirmAction();
          }
          handleCloseConfirmAlert();
        }}
      />
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isExpanded={isSidebarExpanded}
          onExpand={() => setIsSidebarExpanded(true)}
          onCollapse={() => setIsSidebarExpanded(false)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            admin={{ name: "Admin", id: userID }}
            notifications={notifications}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
          />
          <main className="flex-1 overflow-y-auto p-6 dark:bg-gray-900">
            {renderContent()}
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;

