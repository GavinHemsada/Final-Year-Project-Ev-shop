import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { adminService } from "../adminService";
import { Loader } from "@/components/Loader";
import type { AlertProps } from "@/types";
import { PredictionHistory } from "../components/PredictionHistory";

// Dropdown options for repair cost prediction
const EV_MODELS = [
  "Hyundai Kona Electric",
  "Nissan Leaf",
  "MG ZS EV",
  "BYD Atto 3",
  "Tesla Model 3",
  "Tesla Model Y",
  "BMW iX3",
  "Audi e-tron",
  "Mercedes EQC",
  "Volkswagen ID.4",
  "Other"
];

const REPAIR_TYPES = [
  "Battery Replacement",
  "Battery Repair",
  "Motor Repair",
  "Charging System",
  "Electrical System",
  "Brake System",
  "Suspension",
  "Body Work",
  "General Maintenance",
  "Other"
];



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
  mileage_km: number;
  battery_health_percent: number;
  battery_capacity_kwh: number;
  model_encoded: number;
  repair_type_encoded: number;
};

export const MLPipelinePage: React.FC<MLPipelinePageProps> = ({ setAlert }) => {
  const [activeTab, setActiveTab] = useState<"battery" | "repair">("battery");
  const [batteryResult, setBatteryResult] = useState<number | null>(null);
  const [repairResult, setRepairResult] = useState<number | null>(null);
  
  // Dropdown selections for repair cost
  // Dropdown selections for repair cost
  const [selectedModel, setSelectedModel] = useState<string>(EV_MODELS[0]);
  const [selectedRepairType, setSelectedRepairType] = useState<string>(REPAIR_TYPES[0]);

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
        id: Date.now(),
        type: "success",
        message: "Battery health predicted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
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
    setValue: setValueRepair,
    formState: { errors: errorsRepair },
  } = useForm<RepairCostInput>();

  const repairMutation = useMutation({
    mutationFn: (data: RepairCostInput) => adminService.testRepairCost(data),
    onSuccess: (data) => {
      setRepairResult(data.prediction);
      setAlert({
        id: Date.now(),
        type: "success",
        message: "Repair cost predicted successfully",
      });
    },
    onError: (error: any) => {
      setAlert({
        id: Date.now(),
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
    
    // Update encoded values from dropdown selections
    numericData.model_encoded = EV_MODELS.indexOf(selectedModel);
    numericData.repair_type_encoded = REPAIR_TYPES.indexOf(selectedRepairType);
    
    repairMutation.mutate(numericData);
  };

  const renderInput = (
    label: string,
    name: keyof BatteryHealthInput | keyof RepairCostInput,
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
        <h2 className="text-2xl font-bold dark:text-white">
          ML Pipeline Management
        </h2>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:border dark:border-gray-700">
            {activeTab === "battery" ? (
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-white">
                  Battery Health Inputs
                </h3>
                <form
                  onSubmit={handleSubmitBattery(onBatterySubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput(
                      "Age (Years)",
                      "age_years",
                      registerBattery,
                      errorsBattery,
                      2
                    )}
                    {renderInput(
                      "Mileage (km)",
                      "mileage",
                      registerBattery,
                      errorsBattery,
                      15000
                    )}
                    {renderInput(
                      "Battery Cycles",
                      "battery_cycles",
                      registerBattery,
                      errorsBattery,
                      100
                    )}
                    {renderInput(
                      "Fast Charge Ratio (0-1)",
                      "fast_charge_ratio",
                      registerBattery,
                      errorsBattery,
                      0.2
                    )}
                    {renderInput(
                      "Avg Temp (°C)",
                      "avg_temperature_c",
                      registerBattery,
                      errorsBattery,
                      25
                    )}
                    {renderInput(
                      "Avg DOD (0-1)",
                      "avg_depth_of_discharge",
                      registerBattery,
                      errorsBattery,
                      0.5
                    )}
                    {renderInput(
                      "Voltage (V)",
                      "voltage",
                      registerBattery,
                      errorsBattery,
                      400
                    )}
                    {renderInput(
                      "Internal Resistance (mOhm)",
                      "internal_resistance_mohm",
                      registerBattery,
                      errorsBattery,
                      20
                    )}
                    {renderInput(
                      "Current Capacity (kWh)",
                      "current_capacity_kwh",
                      registerBattery,
                      errorsBattery,
                      50
                    )}
                    {renderInput(
                      "Charging Efficiency (0-1)",
                      "charging_efficiency",
                      registerBattery,
                      errorsBattery,
                      0.95
                    )}
                    {renderInput(
                      "Model Encoded (ID)",
                      "model_encoded",
                      registerBattery,
                      errorsBattery,
                      1
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-6">
                    <button
                      type="submit"
                      disabled={batteryMutation.isPending}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full justify-center md:w-auto"
                    >
                      {batteryMutation.isPending ? (
                        <>
                          <Loader size={8} color="#ffffff" />
                          Predicting...
                        </>
                      ) : (
                        "Run Prediction"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-white">
                  Repair Cost Inputs
                </h3>
                <form
                  onSubmit={handleSubmitRepair(onRepairSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput(
                      "Age (Years)",
                      "age_years",
                      registerRepair,
                      errorsRepair,
                      6
                    )}
                     {renderInput(
                      "Mileage (km)",
                      "mileage_km",
                      registerRepair,
                      errorsRepair,
                      60000
                    )}
                    {renderInput(
                      "Battery Health (%)",
                      "battery_health_percent",
                      registerRepair,
                      errorsRepair,
                      85
                    )}
                    {renderInput(
                      "Battery Capacity (kWh)",
                      "battery_capacity_kwh",
                      registerRepair,
                      errorsRepair,
                      64
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Vehicle Model
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => {
                          setSelectedModel(e.target.value);
                          setValueRepair("model_encoded", EV_MODELS.indexOf(e.target.value));
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {EV_MODELS.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Repair Type
                      </label>
                      <select
                        value={selectedRepairType}
                        onChange={(e) => {
                          setSelectedRepairType(e.target.value);
                          setValueRepair("repair_type_encoded", REPAIR_TYPES.indexOf(e.target.value));
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        {REPAIR_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-4 mt-6 col-span-1 md:col-span-2">
                       <button
                      type="submit"
                      disabled={repairMutation.isPending}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full justify-center"
                    >
                      {repairMutation.isPending ? (
                        <>
                          <Loader size={8} color="#ffffff" />
                          Predicting...
                        </>
                      ) : (
                        "Run Prediction"
                      )}
                    </button>
                    </div>
                    </div>
                  </form>
              </div>
            )}
          </div>
        </div>

        {/* Result Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm dark:border dark:border-gray-700 sticky top-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white border-b pb-2 dark:border-gray-700">
              Prediction Result
            </h3>
            
            {activeTab === "battery" ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
                {batteryResult !== null ? (
                  <div className="animate-in fade-in zoom-in duration-300">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Estimated Battery Health</div>
                    <div className="text-5xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                      {batteryResult.toFixed(2)}%
                    </div>
                    <div className="mt-4 text-xs text-gray-400">
                      Based on current metrics
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 italic">
                    Run the prediction model to see results here.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
                {repairResult !== null ? (
                   <div className="animate-in fade-in zoom-in duration-300 w-full">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Estimated Repair Cost</div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent break-all">
                      LKR {repairResult.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="mt-4 text-xs text-gray-400">
                      Estimated cost including labor & parts
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 italic">
                    Run the prediction model to see results here.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <PredictionHistory />
    </div>
  );
};
