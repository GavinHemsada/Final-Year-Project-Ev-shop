import { Route, Routes } from "react-router-dom";
import AuthRoutes from "../features/auth/authRouter";
import ProtectedRoute from "../routes/ProtectedRouter";
import BuyerRouter from "@/features/buyer/buyerRouter";
import SellerRouter from "@/features/seller/sellerRouter";
import FinancialRouter from "@/features/financial/financialRouter";

import NotFound from "../pages/NotFoundPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import PageRouter from "./WelcomePageRouter";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/*" element={<PageRouter />} />
      <Route path="/auth/*" element={<AuthRoutes />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route
        path="/user/*"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <BuyerRouter />
          </ProtectedRoute>
        }
      />
       <Route
        path="/seller/*"
        element={
          <ProtectedRoute allowedRoles={["seller"]}>
            <SellerRouter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/financial/*"
        element={
          <ProtectedRoute allowedRoles={["finance"]}>
            <FinancialRouter />
          </ProtectedRoute>
        }
      />
    </Routes>
    
  );
};

export default AppRoutes;
