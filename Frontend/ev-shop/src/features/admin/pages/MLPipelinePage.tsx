import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { adminService } from "../adminService";
import { Loader } from "@/components/Loader";
import type { AlertProps } from "@/types";

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

const SERVICE_PROVIDERS = [
  "Authorized Dealer",
  "Independent Workshop",
  "Specialized EV Service",
  "Manufacturer Service Center",
  "Local Mechanic",
  "Other"
];

const REGIONS = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Galle",
  "Matara",
  "Kurunegala",
  "Anuradhapura",
  "Jaffna",
  "Other"
];

const CHARGING_FREQUENCIES = [
  "Daily",
  "Weekly",
  "Monthly",
  "Rarely",
  "Never"
];

const REGION_MULTIPLIERS = [
  { label: "Standard (1.0x)", value: 1.0 },
  { label: "Low Cost (0.9x)", value: 0.9 },
  { label: "Slightly Higher (1.05x)", value: 1.05 },
  { label: "Moderate (1.1x)", value: 1.1 },
  { label: "Higher (1.15x)", value: 1.15 },
  { label: "High (1.2x)", value: 1.2 },
  { label: "Very High (1.25x)", value: 1.25 },
  { label: "Premium (1.3x)", value: 1.3 },
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
  age_months: number;
  mileage_km: number;
  mileage_miles: number;
  battery_capacity_kwh: number;
  current_capacity_kwh: number;
  battery_health_percent: number;
  battery_cycles: number;
  base_price_lkr: number;
  fast_charge_ratio: number;
  avg_temperature_c: number;
  previous_repairs: number;
  labor_hours: number;
  labor_rate_lkr_per_hour: number;
  labor_cost_lkr: number;
  parts_cost_lkr: number;
  diagnostic_fee_lkr: number;
  model_encoded: number;
  repair_type_encoded: number;
  service_provider_encoded: number;
  region_encoded: number;
  charging_freq_encoded: number;
  home_charging_encoded: number;
  under_warranty_encoded: number;
  region_cost_multiplier: number;
};

export const MLPipelinePage: React.FC<MLPipelinePageProps> = ({ setAlert }) => {
  const [activeTab, setActiveTab] = useState<"battery" | "repair">("battery");
  const [batteryResult, setBatteryResult] = useState<number | null>(null);
  const [repairResult, setRepairResult] = useState<number | null>(null);
  
  // Dropdown selections for repair cost
  const [selectedModel, setSelectedModel] = useState<string>(EV_MODELS[0]);
  const [selectedRepairType, setSelectedRepairType] = useState<string>(REPAIR_TYPES[0]);
  const [selectedServiceProvider, setSelectedServiceProvider] = useState<string>(SERVICE_PROVIDERS[0]);
  const [selectedRegion, setSelectedRegion] = useState<string>(REGIONS[0]);
  const [selectedChargingFreq, setSelectedChargingFreq] = useState<string>(CHARGING_FREQUENCIES[1]);
  const [selectedRegionMultiplier, setSelectedRegionMultiplier] = useState<number>(1.15);

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
    
    // Update encoded values from dropdown selections
    numericData.model_encoded = EV_MODELS.indexOf(selectedModel);
    numericData.repair_type_encoded = REPAIR_TYPES.indexOf(selectedRepairType);
    numericData.service_provider_encoded = SERVICE_PROVIDERS.indexOf(selectedServiceProvider);
    numericData.region_encoded = REGIONS.indexOf(selectedRegion);
    numericData.charging_freq_encoded = CHARGING_FREQUENCIES.indexOf(selectedChargingFreq);
    numericData.region_cost_multiplier = selectedRegionMultiplier;
    
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                {/* Basic Vehicle Info */}
                {renderInput("Age (Years)", "age_years", registerRepair, errorsRepair, 6)}
                {renderInput("Age (Months)", "age_months", registerRepair, errorsRepair, 72)}
                {renderInput("Mileage (km)", "mileage_km", registerRepair, errorsRepair, 60000)}
                {renderInput("Mileage (Miles)", "mileage_miles", registerRepair, errorsRepair, 37282)}
                {renderInput("Battery Capacity (kWh)", "battery_capacity_kwh", registerRepair, errorsRepair, 64)}
                {renderInput("Current Capacity (kWh)", "current_capacity_kwh", registerRepair, errorsRepair, 54.4)}
                {renderInput("Battery Health (%)", "battery_health_percent", registerRepair, errorsRepair, 85)}
                {renderInput("Battery Cycles", "battery_cycles", registerRepair, errorsRepair, 300)}
                {renderInput("Base Price (LKR)", "base_price_lkr", registerRepair, errorsRepair, 15000000)}
                {renderInput("Fast Charge Ratio (0-1)", "fast_charge_ratio", registerRepair, errorsRepair, 0.4)}
                {renderInput("Avg Temp (°C)", "avg_temperature_c", registerRepair, errorsRepair, 29)}
                {renderInput("Previous Repairs", "previous_repairs", registerRepair, errorsRepair, 2)}
                
                {/* Repair Cost Components */}
                {renderInput("Labor Hours", "labor_hours", registerRepair, errorsRepair, 8)}
                {renderInput("Labor Rate (LKR/hour)", "labor_rate_lkr_per_hour", registerRepair, errorsRepair, 3000)}
                {renderInput("Labor Cost (LKR)", "labor_cost_lkr", registerRepair, errorsRepair, 24000)}
                {renderInput("Parts Cost (LKR)", "parts_cost_lkr", registerRepair, errorsRepair, 500000)}
                {renderInput("Diagnostic Fee (LKR)", "diagnostic_fee_lkr", registerRepair, errorsRepair, 7500)}
                
                {/* Additional Information */}
                <div className="col-span-full">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Additional Information</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vehicle Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
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
                    onChange={(e) => setSelectedRepairType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {REPAIR_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Service Provider
                  </label>
                  <select
                    value={selectedServiceProvider}
                    onChange={(e) => setSelectedServiceProvider(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {SERVICE_PROVIDERS.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Region
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Public Charging Frequency
                  </label>
                  <select
                    value={selectedChargingFreq}
                    onChange={(e) => setSelectedChargingFreq(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {CHARGING_FREQUENCIES.map((freq) => (
                      <option key={freq} value={freq}>
                        {freq}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Home Charging Available
                  </label>
                  <select
                    {...registerRepair("home_charging_encoded", { required: "Required" })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value={1}>Yes</option>
                    <option value={0}>No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Under Warranty
                  </label>
                  <select
                    {...registerRepair("under_warranty_encoded", { required: "Required" })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Region Cost Multiplier
                  </label>
                  <select
                    value={selectedRegionMultiplier}
                    onChange={(e) => setSelectedRegionMultiplier(parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {REGION_MULTIPLIERS.map((mult) => (
                      <option key={mult.value} value={mult.value}>
                        {mult.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6">
                <button
                  type="submit"
                  disabled={repairMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                {repairResult !== null && (
                    <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
                        <strong>Result:</strong> LKR {repairResult.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
