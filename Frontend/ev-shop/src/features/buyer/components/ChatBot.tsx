import React, { useState, useRef, useEffect } from "react";
import { CloseIcon, SendIcon } from "@/assets/icons/icons";
import type { ChatMessage } from "@/types";
import { buyerService } from "../buyerService";

// Define the props interface for the Chatbot component
type ChatbotProps = {
  onClose: () => void; // Function to call when the chatbot needs to be closed
  userName?: string; // Optional user name for personalization
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
  "Other",
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
  "Other",
];

const SERVICE_PROVIDERS = [
  "Authorized Dealer",
  "Independent Workshop",
  "Specialized EV Service",
  "Manufacturer Service Center",
  "Local Mechanic",
  "Other",
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
  "Other",
];

const CHARGING_FREQUENCIES = ["Daily", "Weekly", "Monthly", "Rarely", "Never"];

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

// Chatbot functional component definition
export const Chatbot: React.FC<ChatbotProps> = ({ onClose, userName }) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<"chat" | "prediction">("chat");
  const [predictionType, setPredictionType] = useState<"battery" | "repair">(
    "battery"
  );

  // Chat state
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  // Ref to automatically scroll to the latest message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Prediction state
  const [batteryInput, setBatteryInput] = useState<Partial<BatteryHealthInput>>(
    {
      age_years: undefined,
      mileage: undefined,
      battery_cycles: undefined,
      fast_charge_ratio: undefined,
      avg_temperature_c: undefined,
      avg_depth_of_discharge: undefined,
      voltage: undefined,
      internal_resistance_mohm: undefined,
      current_capacity_kwh: undefined,
      charging_efficiency: undefined,
      model_encoded: 1,
    }
  );

  const [repairInput, setRepairInput] = useState<Partial<RepairCostInput>>({
    age_years: undefined,
    age_months: undefined,
    mileage_km: undefined,
    mileage_miles: undefined,
    battery_capacity_kwh: undefined,
    current_capacity_kwh: undefined,
    battery_health_percent: undefined,
    battery_cycles: undefined,
    base_price_lkr: undefined,
    fast_charge_ratio: undefined,
    avg_temperature_c: undefined,
    previous_repairs: undefined,
    labor_hours: undefined,
    labor_rate_lkr_per_hour: undefined,
    labor_cost_lkr: undefined,
    parts_cost_lkr: undefined,
    diagnostic_fee_lkr: undefined,
    model_encoded: 0,
    repair_type_encoded: 0,
    service_provider_encoded: 0,
    region_encoded: 0,
    charging_freq_encoded: 0,
    home_charging_encoded: 1,
    under_warranty_encoded: 0,
    region_cost_multiplier: 1.0,
  });

  // Dropdown selections (for display)
  const [selectedModel, setSelectedModel] = useState<string>(EV_MODELS[0]);
  const [selectedRepairType, setSelectedRepairType] = useState<string>(
    REPAIR_TYPES[0]
  );
  const [selectedServiceProvider, setSelectedServiceProvider] =
    useState<string>(SERVICE_PROVIDERS[0]);
  const [selectedRegion, setSelectedRegion] = useState<string>(REGIONS[0]);
  const [selectedChargingFreq, setSelectedChargingFreq] = useState<string>(
    CHARGING_FREQUENCIES[1]
  );
  const [selectedRegionMultiplier, setSelectedRegionMultiplier] =
    useState<number>(1.15);

  const [predictionResult, setPredictionResult] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Initialize with greeting
  useEffect(() => {
    if (messages.length === 0 && activeTab === "chat") {
      const greetingName = userName ? ` ${userName}` : "";
      const initialMessage: ChatMessage = {
        id: Date.now(),
        text: `Hi${greetingName}, how can I help you?`,
        sender: "bot",
      };
      setMessages([initialMessage]);
    }
  }, [userName, activeTab]); // Only run when userName changes (or on mount/first render)

  // Reset messages when switching tabs
  useEffect(() => {
    if (activeTab === "chat" && messages.length === 0) {
      const greetingName = userName ? ` ${userName}` : "";
      const initialMessage: ChatMessage = {
        id: Date.now(),
        text: `Hi${greetingName}, how can I help you?`,
        sender: "bot",
      };
      setMessages([initialMessage]);
    }
  }, [activeTab]);

  // Function to scroll the chat messages to the bottom
  const scrollToBottom = () => {
    // Scrolls the element referenced by messagesEndRef into view with a smooth animation
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Effect hook to scroll to the bottom whenever the messages array updates
  useEffect(scrollToBottom, [messages, isThinking]);

  const handleSendMessage = async (text: string) => {
    const newUserMessage: ChatMessage = {
      id: Date.now(),
      text,
      sender: "user",
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    setIsThinking(true);

    try {
      const respons = await buyerService.sendMessageToChatbot(text);
      console.log(respons);
      const botResponse: ChatMessage = {
        id: Date.now() + 1,
        text: respons,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      const errorResponse: ChatMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting right now. Please try again.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsThinking(false);
    }
  };

  // Handler for form submission (sending a message)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)
    // Check if the input value is not empty after trimming whitespace
    if (inputValue.trim()) {
      handleSendMessage(inputValue.trim()); // Call the onSendMessage prop with the trimmed input
    }
  };

  // Handler for prediction submission
  const handlePredictionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    setPredictionResult(null);

    try {
      let numericData: any;
      let result;

      if (predictionType === "battery") {
        // Battery Health Input (11 features)
        numericData = {
          age_years: batteryInput.age_years ?? 3,
          mileage: batteryInput.mileage ?? 50000,
          battery_cycles: batteryInput.battery_cycles ?? 500,
          fast_charge_ratio: batteryInput.fast_charge_ratio ?? 0.3,
          avg_temperature_c: batteryInput.avg_temperature_c ?? 25,
          avg_depth_of_discharge: batteryInput.avg_depth_of_discharge ?? 0.7,
          voltage: batteryInput.voltage ?? 400,
          internal_resistance_mohm: batteryInput.internal_resistance_mohm ?? 50,
          current_capacity_kwh: batteryInput.current_capacity_kwh ?? 70,
          charging_efficiency: batteryInput.charging_efficiency ?? 0.9,
          model_encoded: batteryInput.model_encoded ?? 1,
        } as BatteryHealthInput;
        result = await buyerService.predictBatteryHealth(numericData);
      } else {
        // Repair Cost Input (25 features)
        numericData = {
          age_years: repairInput.age_years ?? 6,
          age_months: repairInput.age_months ?? 72,
          mileage_km: repairInput.mileage_km ?? 60000,
          mileage_miles: repairInput.mileage_miles ?? 37282,
          battery_capacity_kwh: repairInput.battery_capacity_kwh ?? 64,
          current_capacity_kwh: repairInput.current_capacity_kwh ?? 54.4,
          battery_health_percent: repairInput.battery_health_percent ?? 85,
          battery_cycles: repairInput.battery_cycles ?? 300,
          base_price_lkr: repairInput.base_price_lkr ?? 15000000,
          fast_charge_ratio: repairInput.fast_charge_ratio ?? 0.4,
          avg_temperature_c: repairInput.avg_temperature_c ?? 29,
          previous_repairs: repairInput.previous_repairs ?? 2,
          labor_hours: repairInput.labor_hours ?? 8,
          labor_rate_lkr_per_hour: repairInput.labor_rate_lkr_per_hour ?? 3000,
          labor_cost_lkr: repairInput.labor_cost_lkr ?? 24000,
          parts_cost_lkr: repairInput.parts_cost_lkr ?? 500000,
          diagnostic_fee_lkr: repairInput.diagnostic_fee_lkr ?? 7500,
          model_encoded: repairInput.model_encoded ?? 0,
          repair_type_encoded: repairInput.repair_type_encoded ?? 0,
          service_provider_encoded: repairInput.service_provider_encoded ?? 0,
          region_encoded: repairInput.region_encoded ?? 0,
          charging_freq_encoded: repairInput.charging_freq_encoded ?? 0,
          home_charging_encoded: repairInput.home_charging_encoded ?? 1,
          under_warranty_encoded: repairInput.under_warranty_encoded ?? 0,
          region_cost_multiplier: selectedRegionMultiplier,
        } as RepairCostInput;
        result = await buyerService.predictRepairCost(numericData);
      }

      console.log(numericData);
      console.log(result);

      // Handle response structure - API returns { prediction: number } or just the number
      const prediction = result?.prediction ?? result;
      if (typeof prediction === "number" && !isNaN(prediction)) {
        setPredictionResult(prediction);

        // Save prediction to database with all user inputs
        try {
          await buyerService.savePrediction({
            type:
              predictionType === "battery" ? "battery_health" : "repair_cost",
            user_inputs: numericData,
            prediction_result: {
              prediction: prediction,
              prediction_type:
                predictionType === "battery" ? "battery_health" : "repair_cost",
              timestamp: new Date().toISOString(),
            },
          });
        } catch (saveError) {
          console.error("Error saving prediction:", saveError);
          // Don't show error to user, prediction was successful
        }
      } else {
        setPredictionResult(-1);
      }
    } catch (error) {
      console.error("Prediction Error:", error);
      setPredictionResult(-1); // Use -1 to indicate error
    } finally {
      setIsPredicting(false);
    }
  };

  const handleBatteryInputChange = (
    field: keyof BatteryHealthInput,
    value: string
  ) => {
    setBatteryInput((prev) => ({
      ...prev,
      [field]: value === "" ? undefined : Number(value),
    }));
  };

  const handleRepairInputChange = (
    field: keyof RepairCostInput,
    value: string
  ) => {
    setRepairInput((prev) => ({
      ...prev,
      [field]: value === "" ? undefined : Number(value),
    }));
  };

  // Handle dropdown changes and update encoded values
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    const encoded = EV_MODELS.indexOf(value);
    setRepairInput((prev) => ({
      ...prev,
      model_encoded: encoded >= 0 ? encoded : 0,
    }));
  };

  const handleRepairTypeChange = (value: string) => {
    setSelectedRepairType(value);
    const encoded = REPAIR_TYPES.indexOf(value);
    setRepairInput((prev) => ({
      ...prev,
      repair_type_encoded: encoded >= 0 ? encoded : 0,
    }));
  };

  const handleServiceProviderChange = (value: string) => {
    setSelectedServiceProvider(value);
    const encoded = SERVICE_PROVIDERS.indexOf(value);
    setRepairInput((prev) => ({
      ...prev,
      service_provider_encoded: encoded >= 0 ? encoded : 0,
    }));
  };

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    const encoded = REGIONS.indexOf(value);
    setRepairInput((prev) => ({
      ...prev,
      region_encoded: encoded >= 0 ? encoded : 0,
    }));
  };

  const handleChargingFreqChange = (value: string) => {
    setSelectedChargingFreq(value);
    const encoded = CHARGING_FREQUENCIES.indexOf(value);
    setRepairInput((prev) => ({
      ...prev,
      charging_freq_encoded: encoded >= 0 ? encoded : 0,
    }));
  };

  const handleRegionMultiplierChange = (value: string) => {
    const multiplier = parseFloat(value);
    setSelectedRegionMultiplier(multiplier);
    setRepairInput((prev) => ({
      ...prev,
      region_cost_multiplier: multiplier,
    }));
  };

  return (
    // Main container for the chatbot, positioned fixed at the bottom right
    <div className="fixed bottom-24 right-6 w-110 h-[33rem] bg-white rounded-xl shadow-2xl flex flex-col z-40 animate-slideInUp dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
      {/* Chatbot header */}
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-xl dark:bg-blue-700">
        <h3 className="font-bold text-lg">EV-Shop Assistant</h3>
        {/* Close button for the chatbot */}
        <button
          onClick={onClose}
          className="hover:bg-blue-700 p-1 rounded-full dark:hover:bg-blue-600"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "chat"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab("prediction")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "prediction"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Prediction
        </button>
      </div>

      {/* Content area - Chat or Prediction */}
      {activeTab === "chat" ? (
        <>
          {/* Chat messages display area */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Map through messages and render each one */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Bot avatar, displayed only for bot messages */}
                  {msg.sender === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      E
                    </div>
                  )}
                  {/* Message bubble */}
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl animate-popIn ${
                      msg.sender === "user"
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-200 text-gray-800 rounded-bl-none dark:bg-gray-700 dark:text-gray-200"
                    }`}
                  >
                    <div
                      className="text-sm whitespace-pre-wrap break-words"
                      style={{ lineHeight: "1.7", wordSpacing: "0.05em" }}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {/* Thinking indicator */}
              {isThinking && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 animate-bounce">
                    E
                  </div>
                  <div className="bg-gray-200 text-gray-800 rounded-2xl rounded-bl-none p-3 animate-pulse dark:bg-gray-700 dark:text-gray-200">
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
              )}
              {/* Empty div used as a reference point for scrolling to the bottom */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat input footer */}
          <footer className="p-2 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 w-full px-4 py-2 bg-gray-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              {/* Send message button */}
              <button
                type="submit"
                className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                <SendIcon className="h-5 w-5" />
              </button>
            </form>
          </footer>
        </>
      ) : (
        <>
          {/* Prediction interface */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Prediction type selector */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setPredictionType("battery");
                    setPredictionResult(null);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    predictionType === "battery"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  Battery Health
                </button>
                <button
                  onClick={() => {
                    setPredictionType("repair");
                    setPredictionResult(null);
                    // Reset dropdown selections to defaults
                    setSelectedModel(EV_MODELS[0]);
                    setSelectedRepairType(REPAIR_TYPES[0]);
                    setSelectedServiceProvider(SERVICE_PROVIDERS[0]);
                    setSelectedRegion(REGIONS[0]);
                    setSelectedChargingFreq(CHARGING_FREQUENCIES[1]);
                    setSelectedRegionMultiplier(1.15);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    predictionType === "repair"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  Repair Cost
                </button>
              </div>

              {/* Prediction form */}
              <form onSubmit={handlePredictionSubmit} className="space-y-3">
                {predictionType === "battery" ? (
                  // Battery Health Form (11 features)
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Age (years)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={batteryInput.age_years ?? ""}
                        onChange={(e) =>
                          handleBatteryInputChange("age_years", e.target.value)
                        }
                        placeholder="e.g., 3"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mileage (km)
                      </label>
                      <input
                        type="number"
                        value={batteryInput.mileage ?? ""}
                        onChange={(e) =>
                          handleBatteryInputChange("mileage", e.target.value)
                        }
                        placeholder="e.g., 50000"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Battery Cycles
                      </label>
                      <input
                        type="number"
                        value={batteryInput.battery_cycles ?? ""}
                        onChange={(e) =>
                          handleBatteryInputChange(
                            "battery_cycles",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 500"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fast Charge Ratio (0-1)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={batteryInput.fast_charge_ratio ?? ""}
                        onChange={(e) =>
                          handleBatteryInputChange(
                            "fast_charge_ratio",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 0.3"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Avg Temperature (°C)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={batteryInput.avg_temperature_c ?? ""}
                        onChange={(e) =>
                          handleBatteryInputChange(
                            "avg_temperature_c",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 25"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Depth of Discharge (0-1)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={batteryInput.avg_depth_of_discharge ?? ""}
                        onChange={(e) =>
                          handleBatteryInputChange(
                            "avg_depth_of_discharge",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 0.7"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Voltage (V)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={batteryInput.voltage ?? ""}
                        onChange={(e) =>
                          handleBatteryInputChange("voltage", e.target.value)
                        }
                        placeholder="e.g., 400"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Internal Resistance (mΩ)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={batteryInput.internal_resistance_mohm ?? ""}
                        onChange={(e) =>
                          handleBatteryInputChange(
                            "internal_resistance_mohm",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 50"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Capacity (kWh)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={batteryInput.current_capacity_kwh ?? ""}
                        onChange={(e) =>
                          handleBatteryInputChange(
                            "current_capacity_kwh",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 70"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Charging Efficiency (0-1)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={batteryInput.charging_efficiency ?? ""}
                        onChange={(e) =>
                          handleBatteryInputChange(
                            "charging_efficiency",
                            e.target.value
                          )
                        }
                        placeholder="e.g., 0.9"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                  </div>
                ) : (
                  // Repair Cost Form (25 features) - Compact layout
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Vehicle Info
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Age (years)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={repairInput.age_years ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange("age_years", e.target.value)
                          }
                          placeholder="6"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Age (months)
                        </label>
                        <input
                          type="number"
                          value={repairInput.age_months ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "age_months",
                              e.target.value
                            )
                          }
                          placeholder="72"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Mileage (km)
                        </label>
                        <input
                          type="number"
                          value={repairInput.mileage_km ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "mileage_km",
                              e.target.value
                            )
                          }
                          placeholder="60000"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Mileage (miles)
                        </label>
                        <input
                          type="number"
                          value={repairInput.mileage_miles ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "mileage_miles",
                              e.target.value
                            )
                          }
                          placeholder="37282"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Battery Cap (kWh)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={repairInput.battery_capacity_kwh ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "battery_capacity_kwh",
                              e.target.value
                            )
                          }
                          placeholder="64"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Current Cap (kWh)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={repairInput.current_capacity_kwh ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "current_capacity_kwh",
                              e.target.value
                            )
                          }
                          placeholder="54.4"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Battery Health (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={repairInput.battery_health_percent ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "battery_health_percent",
                              e.target.value
                            )
                          }
                          placeholder="85"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Battery Cycles
                        </label>
                        <input
                          type="number"
                          value={repairInput.battery_cycles ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "battery_cycles",
                              e.target.value
                            )
                          }
                          placeholder="300"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Base Price (LKR)
                        </label>
                        <input
                          type="number"
                          value={repairInput.base_price_lkr ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "base_price_lkr",
                              e.target.value
                            )
                          }
                          placeholder="15000000"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Fast Charge Ratio
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={repairInput.fast_charge_ratio ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "fast_charge_ratio",
                              e.target.value
                            )
                          }
                          placeholder="0.4"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Avg Temp (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={repairInput.avg_temperature_c ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "avg_temperature_c",
                              e.target.value
                            )
                          }
                          placeholder="29"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Prev Repairs
                        </label>
                        <input
                          type="number"
                          value={repairInput.previous_repairs ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "previous_repairs",
                              e.target.value
                            )
                          }
                          placeholder="2"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 mt-3">
                      Repair Costs
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Labor Hours
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={repairInput.labor_hours ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "labor_hours",
                              e.target.value
                            )
                          }
                          placeholder="8"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Labor Rate (LKR/hr)
                        </label>
                        <input
                          type="number"
                          value={repairInput.labor_rate_lkr_per_hour ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "labor_rate_lkr_per_hour",
                              e.target.value
                            )
                          }
                          placeholder="3000"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Labor Cost (LKR)
                        </label>
                        <input
                          type="number"
                          value={repairInput.labor_cost_lkr ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "labor_cost_lkr",
                              e.target.value
                            )
                          }
                          placeholder="24000"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Parts Cost (LKR)
                        </label>
                        <input
                          type="number"
                          value={repairInput.parts_cost_lkr ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "parts_cost_lkr",
                              e.target.value
                            )
                          }
                          placeholder="500000"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Diagnostic Fee (LKR)
                        </label>
                        <input
                          type="number"
                          value={repairInput.diagnostic_fee_lkr ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "diagnostic_fee_lkr",
                              e.target.value
                            )
                          }
                          placeholder="7500"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Region Cost Multiplier
                        </label>
                        <select
                          value={selectedRegionMultiplier}
                          onChange={(e) =>
                            handleRegionMultiplierChange(e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {REGION_MULTIPLIERS.map((mult) => (
                            <option key={mult.value} value={mult.value}>
                              {mult.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 mt-3">
                      Additional Information
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Vehicle Model
                        </label>
                        <select
                          value={selectedModel}
                          onChange={(e) => handleModelChange(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {EV_MODELS.map((model) => (
                            <option key={model} value={model}>
                              {model}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Repair Type
                        </label>
                        <select
                          value={selectedRepairType}
                          onChange={(e) =>
                            handleRepairTypeChange(e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {REPAIR_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Service Provider
                        </label>
                        <select
                          value={selectedServiceProvider}
                          onChange={(e) =>
                            handleServiceProviderChange(e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {SERVICE_PROVIDERS.map((provider) => (
                            <option key={provider} value={provider}>
                              {provider}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Region
                        </label>
                        <select
                          value={selectedRegion}
                          onChange={(e) => handleRegionChange(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {REGIONS.map((region) => (
                            <option key={region} value={region}>
                              {region}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Public Charging Frequency
                        </label>
                        <select
                          value={selectedChargingFreq}
                          onChange={(e) =>
                            handleChargingFreqChange(e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {CHARGING_FREQUENCIES.map((freq) => (
                            <option key={freq} value={freq}>
                              {freq}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Home Charging Available
                        </label>
                        <select
                          value={repairInput.home_charging_encoded ?? 1}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "home_charging_encoded",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value={1}>Yes</option>
                          <option value={0}>No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Under Warranty
                        </label>
                        <select
                          value={repairInput.under_warranty_encoded ?? 0}
                          onChange={(e) =>
                            handleRepairInputChange(
                              "under_warranty_encoded",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value={0}>No</option>
                          <option value={1}>Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Result display */}
                {predictionResult !== null && (
                  <div
                    className={`mt-4 p-4 rounded-lg ${
                      predictionResult === -1
                        ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                        : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    {predictionResult === -1 ? (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Error making prediction. Please check your inputs and
                        try again.
                      </p>
                    ) : predictionType === "battery" ? (
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                          Predicted Battery Health
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {(() => {
                            // Model returns percentage directly (e.g., 52.04), not decimal (0.52)
                            // If value is > 1, it's already a percentage; if < 1, multiply by 100
                            const percentage =
                              predictionResult > 1
                                ? Math.round(predictionResult)
                                : Math.round(predictionResult * 100);
                            return `${percentage}%`;
                          })()}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          {(() => {
                            // Normalize to 0-100 scale for comparison
                            const normalizedValue =
                              predictionResult > 1
                                ? predictionResult
                                : predictionResult * 100;
                            if (normalizedValue >= 80) {
                              return "Excellent condition";
                            } else if (normalizedValue >= 60) {
                              return "Good condition";
                            } else if (normalizedValue >= 40) {
                              return "Moderate condition - consider inspection";
                            } else {
                              return "Low health - replacement recommended";
                            }
                          })()}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                          Estimated Repair Cost
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          LKR{" "}
                          {predictionResult.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          This is an estimate based on the provided parameters.
                          Actual costs may vary.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isPredicting}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  {isPredicting
                    ? "Predicting..."
                    : `Predict ${
                        predictionType === "battery"
                          ? "Battery Health"
                          : "Repair Cost"
                      }`}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
