import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import VehicleDetailsPage from "./pages/VehicleDetailsPage";

const BuyerRouter = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="vehicle/:id" element={<VehicleDetailsPage />} />
    </Routes>
  );
};

export default BuyerRouter;
