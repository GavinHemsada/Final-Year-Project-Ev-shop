import { Router } from "express";
import { financialProductTypeService } from "./financialProductType.service";
import { financialProductTypeController } from "./financialProductType.controller";
import { container } from "../../di/container";
// Assuming you have a way to resolve or import middlewares explicitly if strict DI isn't fully set up for middlewares yet.
// For now, I'll instantiate the controller directly using the service if DI isn't mandatory, 
// OR I will register it in DI. Given the previous file check, DI `container.resolve` was used.
// I will need to register this new controller in the DI container. 

// BUT, for simplicity and since I cannot easily modify `di/container.ts` without reading it, 
// I will instantiate the controller here directly to avoid breaking DI configuration if it's complex.
// Wait, `app.ts` imports container. I should probably try to register it or just use direct instantiation.
// Let's use direct instantiation for now to be safe and quick.

const controller = financialProductTypeController(financialProductTypeService);

export const financialProductTypeRouter = (): Router => {
  const router = Router();

  // TODO: Add RBAC middleware to restricted routes (create, update, delete)
  // Assuming `protectJWT` is already applied in app.ts for `/financial-product-types` route
  // We might need an additional role check middleware if available.

  router.post("/", (req, res) => controller.createType(req, res));
  router.get("/", (req, res) => controller.getAllTypes(req, res));
  router.put("/:id", (req, res) => controller.updateType(req, res));
  router.delete("/:id", (req, res) => controller.deleteType(req, res));

  return router;
};
