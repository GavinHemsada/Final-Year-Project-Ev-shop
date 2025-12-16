import { Request, Response } from "express";
import { MlModels } from "../../shared/utils/ml_model";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

/**
 * Controller for Machine Learning Model Testing
 */
export const MlController = {
  /**
   * Predict Battery Health
   */
  predictBatteryHealth: async (req: Request, res: Response) => {
    try {
      const models = await MlModels();
      // Ensure input data is valid; in a real app, use DTO validation
      const result = await models.batteryHealth(req.body);
      return handleResult(res, { success: true, prediction: result });
    } catch (err) {
      return handleError(res, err, "predictBatteryHealth");
    }
  },

  /**
   * Predict Repair Cost
   */
  predictRepairCost: async (req: Request, res: Response) => {
    try {
      const models = await MlModels();
      const result = await models.repairCost(req.body);
      return handleResult(res, { success: true, prediction: result });
    } catch (err) {
      return handleError(res, err, "predictRepairCost");
    }
  },
};
