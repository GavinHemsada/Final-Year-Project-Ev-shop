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
  mileage_km: number;
  battery_health_percent: number;
  battery_capacity_kwh: number;
  model_encoded: number;
  repair_type_encoded: number;
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
  "Charging System",
  "Electrical System",
  "Suspension",
  "Body Work",
  "General Maintenance",
  "Other",
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
    mileage_km: undefined,
    battery_health_percent: undefined,
    battery_capacity_kwh: undefined,
    model_encoded: 0,
    repair_type_encoded: 0,
  });

  // Dropdown selections (for display)
  const [selectedModel, setSelectedModel] = useState<string>(EV_MODELS[0]);
  const [selectedRepairType, setSelectedRepairType] = useState<string>(
    REPAIR_TYPES[0]
  );
  
  const [predictionResult, setPredictionResult] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

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
    e.preventDefault();
    if (inputValue.trim()) {
      handleSendMessage(inputValue.trim());
    }
  };

  // Handler for prediction submission
  const handlePredictionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setPredictionResult(null);

    // Validate inputs
    if (predictionType === "battery") {
      const requiredFields: (keyof BatteryHealthInput)[] = [
        "age_years",
        "mileage",
        "battery_cycles",
        "fast_charge_ratio",
        "avg_temperature_c",
        "avg_depth_of_discharge",
        "voltage",
        "internal_resistance_mohm",
        "current_capacity_kwh",
        "charging_efficiency",
      ];
      
      const missingFields = requiredFields.filter(field => batteryInput[field] === undefined);
      if (missingFields.length > 0) {
        setValidationError("Please fill in all required fields.");
        return;
      }
    } else {
       const requiredFields: (keyof RepairCostInput)[] = [
         "age_years",
         "mileage_km",
         "battery_health_percent",
         "battery_capacity_kwh"
       ];
       
       const missingFields = requiredFields.filter(field => repairInput[field] === undefined);
       if (missingFields.length > 0) {
           setValidationError("Please fill in all required fields.");
           return;
       }
    }

    setIsPredicting(true);

    try {
      let numericData: any;
      let result;

      if (predictionType === "battery") {
        // Battery Health Input (11 features)
        numericData = {
          age_years: batteryInput.age_years!,
          mileage: batteryInput.mileage!,
          battery_cycles: batteryInput.battery_cycles!,
          fast_charge_ratio: batteryInput.fast_charge_ratio!,
          avg_temperature_c: batteryInput.avg_temperature_c!,
          avg_depth_of_discharge: batteryInput.avg_depth_of_discharge!,
          voltage: batteryInput.voltage!,
          internal_resistance_mohm: batteryInput.internal_resistance_mohm!,
          current_capacity_kwh: batteryInput.current_capacity_kwh!,
          charging_efficiency: batteryInput.charging_efficiency!,
          model_encoded: batteryInput.model_encoded ?? 1,
        } as BatteryHealthInput;
        result = await buyerService.predictBatteryHealth(numericData);
      } else {
        // Repair Cost Input (6 features)
        numericData = {
          age_years: repairInput.age_years!,
          mileage_km: repairInput.mileage_km!,
          battery_capacity_kwh: repairInput.battery_capacity_kwh ?? 64, // Default or input
          battery_health_percent: repairInput.battery_health_percent!,
          model_encoded: repairInput.model_encoded ?? 0,
          repair_type_encoded: repairInput.repair_type_encoded ?? 0,
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
                    setValidationError(null);
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
                    setValidationError(null);
                    // Reset dropdown selections to defaults
                    setSelectedModel(EV_MODELS[0]);
                    setSelectedRepairType(REPAIR_TYPES[0]);
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

              {/* Validation Error */}
              {validationError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200">
                  {validationError}
                </div>
              )}

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
                  // Repair Cost Form (6 features) - Simplified
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                       Vehicle & Battery Info
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
                          Mileage (km)
                        </label>
                        <input
                          type="number"
                          step="100"
                          value={repairInput.mileage_km ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange("mileage_km", e.target.value)
                          }
                          placeholder="60000"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Battery Health (%)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={repairInput.battery_health_percent ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange("battery_health_percent", e.target.value)
                          }
                          placeholder="85"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                       <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Battery Capacity (kWh)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={repairInput.battery_capacity_kwh ?? ""}
                          onChange={(e) =>
                            handleRepairInputChange("battery_capacity_kwh", e.target.value)
                          }
                          placeholder="64"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>

                     <div className="grid grid-cols-1 gap-3 mt-2">
                       <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Vehicle Model
                        </label>
                        <div className="relative">
                          <select
                            value={selectedModel}
                            onChange={(e) => handleModelChange(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            {EV_MODELS.map((model) => (
                              <option key={model} value={model}>
                                {model}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Repair Type
                        </label>
                        <div className="relative">
                          <select
                            value={selectedRepairType}
                            onChange={(e) => handleRepairTypeChange(e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            {REPAIR_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
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
