import { Route, Routes } from "react-router-dom";
import FinancialDashboard from "./pages/FinancialDashboard";

const FinancialRouter = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<FinancialDashboard />} />
    </Routes>
  );
};

export default FinancialRouter;

