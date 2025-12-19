import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { adminService } from "../adminService";
import { Loader } from "@/components/Loader";
import type { AlertProps } from "@/types";

type MLPipelinePageProps = {
  setAlert: (alert: AlertProps | null) => void;
};

type BatteryHealthInput = {
  age_years: number;
  mileage: number;
  battery_cycles: number;
  fast_charge_ratio: number;
  avg_temperature_c: number;
  avg_depth_of_discharge: number;
  voltage: number;
  internal_resistance_mohm: number;
  current_capacity_kwh: number;
  charging_efficiency: number;
  model_encoded: number;
};

type RepairCostInput = {
  age_years: number;
  mileage: number;
  battery_cycles: number;
  fast_charge_ratio: number;
  avg_temperature_c: number;
  avg_depth_of_discharge: number;
  voltage: number;
  internal_resistance_mohm: number;
  current_capacity_kwh: number;
  charging_efficiency: number;
  model_encoded: number;
};

export const MLPipelinePage: React.FC<MLPipelinePageProps> = ({ setAlert }) => {
  const [activeTab, setActiveTab] = useState<"battery" | "repair">("battery");
  const [batteryResult, setBatteryResult] = useState<number | null>(null);
  const [repairResult, setRepairResult] = useState<number | null>(null);

  // --- Battery Health Form ---
  const {
    register: registerBattery,
    handleSubmit: handleSubmitBattery,
    formState: { errors: errorsBattery },
  } = useForm<BatteryHealthInput>();

  const batteryMutation = useMutation({
    mutationFn: (data: BatteryHealthInput) => adminService.testBatteryHealth(data),
    onSuccess: (data) => {
      setBatteryResult(data.prediction);
      setAlert({
        type: "success",
        message: "Battery health predicted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        type: "error",
        message:
          error.response?.data?.error ||
          "Failed to predict battery health. Ensure model files exist.",
      });
    },
  });

  const onBatterySubmit = (data: BatteryHealthInput) => {
    // Convert string inputs to numbers
    const numericData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, Number(value)])
    ) as BatteryHealthInput;
    
    batteryMutation.mutate(numericData);
  };

  // --- Repair Cost Form ---
  const {
    register: registerRepair,
    handleSubmit: handleSubmitRepair,
    formState: { errors: errorsRepair },
  } = useForm<RepairCostInput>();

  const repairMutation = useMutation({
    mutationFn: (data: RepairCostInput) => adminService.testRepairCost(data),
    onSuccess: (data) => {
      setRepairResult(data.prediction);
      setAlert({
        type: "success",
        message: "Repair cost predicted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        type: "error",
        message:
          error.response?.data?.error ||
          "Failed to predict repair cost. Ensure model files exist.",
      });
    },
  });

  const onRepairSubmit = (data: RepairCostInput) => {
    const numericData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, Number(value)])
      ) as RepairCostInput;
    repairMutation.mutate(numericData);
  };

  const renderInput = (
    label: string,
    name: keyof BatteryHealthInput, // Same keys for both currently
    register: any,
    errors: any,
    defaultValue?: number
  ) => (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        type="number"
        step="any"
        defaultValue={defaultValue}
        className={`px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
            errors[name] ? "border-red-500" : "border-gray-300"
        }`}
        {...register(name, { required: "Required" })}
      />
      {errors[name] && <span className="text-xs text-red-500 mt-1">{errors[name].message}</span>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">ML Pipeline Management</h2>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("battery")}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "battery"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Battery Health Model
        </button>
        <button
          onClick={() => setActiveTab("repair")}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === "repair"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Repair Cost Model
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:border dark:border-gray-700">
        {activeTab === "battery" ? (
          <div>
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Predict Battery Health</h3>
            <form onSubmit={handleSubmitBattery(onBatterySubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderInput("Age (Years)", "age_years", registerBattery, errorsBattery, 2)}
                {renderInput("Mileage (km)", "mileage", registerBattery, errorsBattery, 15000)}
                {renderInput("Battery Cycles", "battery_cycles", registerBattery, errorsBattery, 100)}
                {renderInput("Fast Charge Ratio (0-1)", "fast_charge_ratio", registerBattery, errorsBattery, 0.2)}
                {renderInput("Avg Temp (°C)", "avg_temperature_c", registerBattery, errorsBattery, 25)}
                {renderInput("Avg DOD (0-1)", "avg_depth_of_discharge", registerBattery, errorsBattery, 0.5)}
                {renderInput("Voltage (V)", "voltage", registerBattery, errorsBattery, 400)}
                {renderInput("Internal Resistance (mOhm)", "internal_resistance_mohm", registerBattery, errorsBattery, 20)}
                {renderInput("Current Capacity (kWh)", "current_capacity_kwh", registerBattery, errorsBattery, 50)}
                {renderInput("Charging Efficiency (0-1)", "charging_efficiency", registerBattery, errorsBattery, 0.95)}
                {renderInput("Model Encoded (ID)", "model_encoded", registerBattery, errorsBattery, 1)}
              </div>

              <div className="flex items-center gap-4 mt-6">
                <button
                  type="submit"
                  disabled={batteryMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {batteryMutation.isPending ? "Predicting..." : "Run Prediction"}
                </button>
                {batteryResult !== null && (
                    <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
                        <strong>Result:</strong> {batteryResult.toFixed(4)} %
                    </div>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div>
             <h3 className="text-lg font-semibold mb-4 dark:text-white">Predict Repair Cost</h3>
             <form onSubmit={handleSubmitRepair(onRepairSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderInput("Age (Years)", "age_years", registerRepair, errorsRepair, 3)}
                {renderInput("Mileage (km)", "mileage", registerRepair, errorsRepair, 30000)}
                {renderInput("Battery Cycles", "battery_cycles", registerRepair, errorsRepair, 300)}
                {renderInput("Fast Charge Ratio (0-1)", "fast_charge_ratio", registerRepair, errorsRepair, 0.3)}
                {renderInput("Avg Temp (°C)", "avg_temperature_c", registerRepair, errorsRepair, 28)}
                {renderInput("Avg DOD (0-1)", "avg_depth_of_discharge", registerRepair, errorsRepair, 0.6)}
                {renderInput("Voltage (V)", "voltage", registerRepair, errorsRepair, 395)}
                {renderInput("Internal Resistance (mOhm)", "internal_resistance_mohm", registerRepair, errorsRepair, 25)}
                {renderInput("Current Capacity (kWh)", "current_capacity_kwh", registerRepair, errorsRepair, 45)}
                {renderInput("Charging Efficiency (0-1)", "charging_efficiency", registerRepair, errorsRepair, 0.92)}
                {renderInput("Model Encoded (ID)", "model_encoded", registerRepair, errorsRepair, 2)}
              </div>

              <div className="flex items-center gap-4 mt-6">
                <button
                  type="submit"
                  disabled={repairMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {repairMutation.isPending ? "Predicting..." : "Run Prediction"}
                </button>
                {repairResult !== null && (
                    <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
                        <strong>Result:</strong> ${repairResult.toFixed(2)}
                    </div>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
