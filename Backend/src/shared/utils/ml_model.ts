const ort = require("onnxruntime-node");
import path from "path";

// Battery Health Model Input (11 features)
export type BatteryHealthInputType = {
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

// Repair Cost Model Input (6 features)
export type RepairCostInputType = {
  age_years: number;
  mileage_km: number;
  battery_health_percent: number;
  battery_capacity_kwh: number;
  model_encoded: number;
  repair_type_encoded: number;
};

/**
 * Convert battery health input object → Float32Array (correct order matters!)
 */
const batteryHealthToFloat32Array = (
  input: BatteryHealthInputType
): Float32Array =>
  new Float32Array([
    input.age_years,
    input.mileage,
    input.battery_cycles,
    input.fast_charge_ratio,
    input.avg_temperature_c,
    input.avg_depth_of_discharge,
    input.voltage,
    input.internal_resistance_mohm,
    input.current_capacity_kwh,
    input.charging_efficiency,
    input.model_encoded,
  ]);

/**
 * Convert repair cost input object → Float32Array (correct order matters!)
 * Order must match the training data feature_cols order
 */
const repairCostToFloat32Array = (input: RepairCostInputType): Float32Array =>
  new Float32Array([
    input.age_years,
    input.mileage_km,
    input.battery_health_percent,
    input.battery_capacity_kwh,
    input.model_encoded,
    input.repair_type_encoded,
  ]);

/**
 * Load models ONCE
 */
const batteryModelPath = path.join(
  process.cwd(),
  "ml_models",
  "battery_health_model.onnx"
);

const repairCostModelPath = path.join(
  process.cwd(),
  "ml_models",
  "repair_cost_model.onnx"
);

const batterySessionPromise = ort.InferenceSession.create(batteryModelPath);
const repairCostSessionPromise =
  ort.InferenceSession.create(repairCostModelPath);

export const MlModels = async () => {
  const batterySession = await batterySessionPromise;
  const repairCostSession = await repairCostSessionPromise;

  return {
    batteryHealth: async (input: BatteryHealthInputType) => {
      const floatInput = batteryHealthToFloat32Array(input);

      const tensor = new ort.Tensor("float32", floatInput, [
        1,
        floatInput.length,
      ]);

      const results = await batterySession.run({
        float_input: tensor,
      });

      return results.variable.data[0];
    },

    repairCost: async (input: RepairCostInputType) => {
      const floatInput = repairCostToFloat32Array(input);

      const tensor = new ort.Tensor("float32", floatInput, [
        1,
        floatInput.length,
      ]);

      const results = await repairCostSession.run({
        float_input: tensor,
      });

      return results.variable.data[0];
    },
  };
};
