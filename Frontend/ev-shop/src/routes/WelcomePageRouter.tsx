import { Route, Routes } from "react-router-dom";
import HomePage from "../pages/HoamePage"; // Note: File is named HoamePage.tsx
import ModelsPage from "../pages/ModelPage";
import ServicesPage from "../pages/ServicePage";
import AboutPage from "../pages/AboutPage";
import ContactPage from "../pages/ContactPage";
import Header from "@/pages/Header";
import TermsPage from "@/pages/TermsPage";
import {TestAlert} from "../test"


const WelcomePageRouter = () => {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/test" element={<TestAlert />} />
      </Routes>
    </>
  );
};

export default WelcomePageRouter;
