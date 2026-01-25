import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { ReportGeneratorButton } from "./ReportGeneratorButton";
import { Loader } from "@/components/Loader";

type Prediction = {
  _id: string;
  type: "battery_health" | "repair_cost";
  user_inputs: any;
  prediction_result: {
    prediction: number;
    timestamp: string;
  };
  createdAt: string;
};

export const PredictionHistory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"battery" | "repair">("battery");

  const { data: predictions, isLoading } = useQuery({
    queryKey: ["predictions"],
    queryFn: () => adminService.getAllPredictions(),
  });

  if (isLoading) return <Loader size={8} />;

  const filteredPredictions = (predictions || []).filter(
    (p: Prediction) =>
      (activeTab === "battery" && p.type === "battery_health") ||
      (activeTab === "repair" && p.type === "repair_cost")
  );

  // Define columns for Battery Health
  const batteryColumns = [
    { header: "Date", dataKey: "createdAt" },
    { header: "Age (Years)", dataKey: "user_inputs.age_years" },
    { header: "Mileage", dataKey: "user_inputs.mileage" },
    { header: "Cycles", dataKey: "user_inputs.battery_cycles" },
    { header: "Fast Charge Ratio", dataKey: "user_inputs.fast_charge_ratio" },
    { header: "Avg Temp (C)", dataKey: "user_inputs.avg_temperature_c" },
    { header: "Avg DOD", dataKey: "user_inputs.avg_depth_of_discharge" },
    { header: "Voltage", dataKey: "user_inputs.voltage" },
    { header: "Internal Resistance", dataKey: "user_inputs.internal_resistance_mohm" },
    { header: "Current Capacity", dataKey: "user_inputs.current_capacity_kwh" },
    { header: "Charging Efficiency", dataKey: "user_inputs.charging_efficiency" },
    { header: "Model Encoded", dataKey: "user_inputs.model_encoded" },
    { header: "Prediction Result (%)", dataKey: "prediction_result.prediction" },
  ];

  // Define columns for Repair Cost
  const repairColumns = [
    { header: "Date", dataKey: "createdAt" },
    // Vehicle Info
    { header: "Age (Years)", dataKey: "user_inputs.age_years" },
    { header: "Mileage (km)", dataKey: "user_inputs.mileage_km" },
    { header: "Battery Capacity", dataKey: "user_inputs.battery_capacity_kwh" },
    { header: "Battery Health %", dataKey: "user_inputs.battery_health_percent" },
    // Input Codes (useful context)
    { header: "Model Code", dataKey: "user_inputs.model_encoded" },
    { header: "Repair Type Code", dataKey: "user_inputs.repair_type_encoded" },
    // Result
    { header: "Prediction Result (LKR)", dataKey: "prediction_result.prediction" },
  ];

  const columns = activeTab === "battery" ? batteryColumns : repairColumns;

  // Format data for display (e.g., dates)
  const displayData = filteredPredictions.map((p: Prediction) => ({
    ...p,
    createdAt: new Date(p.createdAt).toLocaleDateString(),
    "prediction_result.prediction": typeof p.prediction_result.prediction === 'number' 
        ? p.prediction_result.prediction.toFixed(2) 
        : p.prediction_result.prediction,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:border dark:border-gray-700 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold dark:text-white">Prediction History</h3>
        <ReportGeneratorButton
          data={displayData}
          columns={columns}
          title={`${activeTab === "battery" ? "Battery Health" : "Repair Cost"} Prediction History`}
          filename={`${activeTab}_predictions_report`}
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab("battery")}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "battery"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Battery Health
        </button>
        <button
          onClick={() => setActiveTab("repair")}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "repair"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Repair Cost
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              {columns.map((col) => (
                <th key={col.dataKey} scope="col" className="px-6 py-3">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length > 0 ? (
              displayData.map((row: any) => (
                <tr
                  key={row._id}
                  className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {columns.map((col) => {
                     const keys = col.dataKey.split(".");
                     let value = row;
                     for (const key of keys) {
                       value = value ? value[key] : "";
                     }
                    return (
                      <td key={`${row._id}-${col.dataKey}`} className="px-6 py-4">
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
                <tr>
                    <td colSpan={columns.length} className="px-6 py-4 text-center">
                        No history available.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
