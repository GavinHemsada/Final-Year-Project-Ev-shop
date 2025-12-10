import React, { useState, useEffect } from "react";
import {useAppSelector } from "@/hooks/useAppSelector";
import { selectActiveRoleId } from "@/context/authSlice"; 
import { financialService } from "../financialService";
import type { AlertProps } from "@/types";
import { Loader } from "@/components/Loader";

export const ApplicationsPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
}> = ({ setAlert }) => {
  const institutionId = useAppSelector(selectActiveRoleId);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (institutionId) {
      fetchApplications();
    }
  }, [institutionId]);

  const fetchApplications = async () => {
    if (!institutionId) return;
    try {
      setIsLoading(true);
      const response = await financialService.getApplicationsByInstitution(
        institutionId
      );
      const apps = response?.applications || [];
      setApplications(Array.isArray(apps) ? apps : []);
    } catch (error: any) {
      console.error("Failed to fetch applications:", error);
      setAlert?.({
        id: Date.now(),
        title: "Error",
        message: "Failed to load applications",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size={60} color="#4f46e5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold dark:text-white">Financing Applications</h1>
      {applications.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            No applications found. Applications will appear here once users submit
            financing requests.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app._id}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-none dark:border dark:border-gray-700"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold dark:text-white">
                    Application #{app._id.slice(-6)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Status: {app.status}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    app.status === "APPROVED"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : app.status === "REJECTED"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {app.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

