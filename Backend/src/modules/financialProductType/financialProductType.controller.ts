import { Request, Response } from "express";
import { IFinancialProductTypeService } from "./financialProductType.service";
import { handleResult, handleError } from "../../shared/utils/Respons.util";

export interface IFinancialProductTypeController {
  createType(req: Request, res: Response): Promise<Response>;
  getAllTypes(req: Request, res: Response): Promise<Response>;
  updateType(req: Request, res: Response): Promise<Response>;
  deleteType(req: Request, res: Response): Promise<Response>;
}

export function financialProductTypeController(
  service: IFinancialProductTypeService
): IFinancialProductTypeController {
  return {
    createType: async (req, res) => {
      try {
        const result = await service.createType(req.body);
        return handleResult(res, result, 201);
      } catch (err) {
        return handleError(res, err, "createType");
      }
    },
    
    getAllTypes: async (_req, res) => {
      try {
        const result = await service.getAllTypes();
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "getAllTypes");
      }
    },
    
    updateType: async (req, res) => {
      try {
        const result = await service.updateType(req.params.id, req.body);
        return handleResult(res, result);
      } catch (err) {
        return handleError(res, err, "updateType");
      }
    },
    
    deleteType: async (req, res) => {
      try {
        const result = await service.deleteType(req.params.id);
        return handleResult(res, result, 200);
      } catch (err) {
        return handleError(res, err, "deleteType");
      }
    },
  };
}
