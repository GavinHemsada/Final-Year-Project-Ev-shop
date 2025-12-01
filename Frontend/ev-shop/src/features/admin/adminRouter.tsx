import { Route, Routes } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";

const AdminRouter = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<AdminDashboard />} />
    </Routes>
  );
};

export default AdminRouter;
