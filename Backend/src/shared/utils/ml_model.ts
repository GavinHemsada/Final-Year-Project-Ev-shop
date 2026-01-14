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

// Repair Cost Model Input (25 features)
export type RepairCostInputType = {
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
    input.age_months,
    input.mileage_km,
    input.mileage_miles,
    input.battery_capacity_kwh,
    input.current_capacity_kwh,
    input.battery_health_percent,
    input.battery_cycles,
    input.base_price_lkr,
    input.fast_charge_ratio,
    input.avg_temperature_c,
    input.previous_repairs,
    input.labor_hours,
    input.labor_rate_lkr_per_hour,
    input.labor_cost_lkr,
    input.parts_cost_lkr,
    input.diagnostic_fee_lkr,
    input.model_encoded,
    input.repair_type_encoded,
    input.service_provider_encoded,
    input.region_encoded,
    input.charging_freq_encoded,
    input.home_charging_encoded,
    input.under_warranty_encoded,
    input.region_cost_multiplier,
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
