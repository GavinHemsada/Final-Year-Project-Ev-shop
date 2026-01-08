import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import VehicleDetailsPage from "./pages/VehicleDetailsPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailedPage from "./pages/PaymentFailedPage";
import PaymentCancelledPage from "./pages/PaymentCancelledPage";
import PaymentErrorPage from "./pages/PaymentErrorPage";
import FinancingApplicationPage from "./pages/FinancingApplicationPage";

const BuyerRouter = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="vehicle/:id" element={<VehicleDetailsPage />} />
      <Route
        path="financing/apply/:listingId"
        element={<FinancingApplicationPage />}
      />
      <Route path="checkout" element={<CheckoutPage />} />
      <Route path="payment/return" element={<PaymentSuccessPage />} />
      <Route path="payment/pending" element={<PaymentSuccessPage />} />
      <Route path="payment/failed" element={<PaymentFailedPage />} />
      <Route path="payment/cancel" element={<PaymentCancelledPage />} />
      <Route path="payment/error" element={<PaymentErrorPage />} />
    </Routes>
  );
};

export default BuyerRouter;
