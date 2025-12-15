import ort from "onnxruntime-node";
import path from "path";

export type InputType = {
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

/**
 * Convert input object → Float32Array (correct order matters!)
 */
const toFloat32Array = (input: InputType): Float32Array =>
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
const repairCostSessionPromise = ort.InferenceSession.create(repairCostModelPath);

export const MlModels = async () => {
  const batterySession = await batterySessionPromise;
  const repairCostSession = await repairCostSessionPromise;

  return {
    batteryHealth: async (input: InputType) => {
      const floatInput = toFloat32Array(input);

      const tensor = new ort.Tensor("float32", floatInput, [
        1,
        floatInput.length,
      ]);

      const results = await batterySession.run({
        float_input: tensor,
      });

      return results.variable.data[0];
    },

    repairCost: async (input: InputType) => {
      const floatInput = toFloat32Array(input);

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
