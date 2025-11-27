import React, { useState } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  XCircleIcon,
} from "@/assets/icons/icons";
import type { AlertProps } from "@/types";

// --- Mock Data (replace with API calls) ---

const mockProducts = [
  {
    _id: "prod1",
    institution_name: "LankaLease",
    institution_logo: "https://placehold.co/40x40/3498db/ffffff?text=LL",
    product_name: "EV Green Loan",
    interest_rate: "8.5%",
    loan_term: "Up to 7 years",
    description: "Special low-interest loans for electric vehicles.",
  },
  {
    _id: "prod2",
    institution_name: "Capital Bank",
    institution_logo: "https://placehold.co/40x40/e74c3c/ffffff?text=CB",
    product_name: "AutoLease Prime",
    interest_rate: "9.2%",
    loan_term: "Up to 5 years",
    description: "Flexible leasing options with quick approval.",
  },
  {
    _id: "prod3",
    institution_name: "Island Finance",
    institution_logo: "https://placehold.co/40x40/2ecc71/ffffff?text=IF",
    product_name: "Eco-Drive Finance",
    interest_rate: "8.9%",
    loan_term: "Up to 6 years",
    description: "Competitive rates for eco-friendly vehicle purchases.",
  },
];

const mockApplications = [
  {
    _id: "app1",
    product_name: "EV Green Loan",
    institution_name: "LankaLease",
    submitted_date: "2024-05-10",
    status: "Approved",
  },
  {
    _id: "app2",
    product_name: "AutoLease Prime",
    institution_name: "Capital Bank",
    submitted_date: "2024-05-15",
    status: "Under Review",
  },
  {
    _id: "app3",
    product_name: "Eco-Drive Finance",
    institution_name: "Island Finance",
    submitted_date: "2024-04-20",
    status: "Rejected",
  },
];

const getStatusInfo = (status: string) => {
  switch (status) {
    case "Approved":
      return {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
        color: "text-green-500 dark:text-green-400",
      };
    case "Under Review":
      return {
        icon: <ClockIcon className="h-5 w-5 text-yellow-500" />,
        color: "text-yellow-500 dark:text-yellow-400",
      };
    case "Rejected":
      return {
        icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
        color: "text-red-500 dark:text-red-400",
      };
    default:
      return {
        icon: <FileTextIcon className="h-5 w-5 text-gray-500" />,
        color: "text-gray-500 dark:text-gray-400",
      };
  }
};

export const FinancingPage: React.FC<{ setAlert?: (alert: AlertProps | null) => void }> = () => {
  // In a real app, you would fetch this data
  const [products] = useState(mockProducts);
  const [applications] = useState(mockApplications);

  return (
    <div className="space-y-12">
      {/* Section for User's Finance Applications */}
      <div>
        <h1 className="text-3xl font-bold mb-6 dark:text-white">
          My Finance Applications
        </h1>
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          {applications.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {applications.map((app) => {
                const statusInfo = getStatusInfo(app.status);
                return (
                  <li
                    key={app._id}
                    className="py-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-lg dark:text-white">
                        {app.product_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {app.institution_name} &middot; Submitted on{" "}
                        {new Date(app.submitted_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 ${statusInfo.color}`}>
                      {statusInfo.icon}
                      <span className="font-semibold">{app.status}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-8 dark:text-gray-400">
              You have not submitted any finance applications.
            </p>
          )}
        </div>
      </div>

      {/* Section for Available Financing Options */}
      <div>
        <h1 className="text-3xl font-bold mb-6 dark:text-white">
          Available Financing Options
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product._id}
              className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700"
            >
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={product.institution_logo}
                    alt={`${product.institution_name} logo`}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold dark:text-white">
                      {product.product_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      by {product.institution_name}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 my-3 dark:text-gray-300">
                  {product.description}
                </p>
                <div className="text-sm space-y-2 mt-4 pt-4 border-t dark:border-gray-700">
                  <p className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Interest Rate:</span>
                    <span className="font-semibold dark:text-white">{product.interest_rate}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Loan Term:</span>
                    <span className="font-semibold dark:text-white">{product.loan_term}</span>
                  </p>
                </div>
              </div>
              <button className="w-full mt-6 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600">
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancingPage;
