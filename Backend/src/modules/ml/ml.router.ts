import { Router } from "express";
import { MlController } from "./ml.controller";

/**
 * Router for ML Model Testing
 * Prefix: /api/v1/ml-test
 */
export const mlRouter = () => {
  const router = Router();

  router.post("/battery-health", MlController.predictBatteryHealth);
  router.post("/repair-cost", MlController.predictRepairCost);

  return router;
};
