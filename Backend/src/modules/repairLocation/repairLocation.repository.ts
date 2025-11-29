import { Types } from "mongoose";
import { RepairLocation, IRepairLocation } from "../../entities/RepairLocation";
import {
  RepairLocationDTO,
  UpdateRepairLocationDTO,
} from "../../dtos/repairLocation.DTO";
import { withErrorHandling } from "../../shared/utils/CustomException";

/**
 * Defines the contract for the repair location repository.
 */
export interface IRepairLocationRepository {
  /**
   * Creates a new repair location.
   */
  create(data: RepairLocationDTO): Promise<IRepairLocation | null>;
  /**
   * Finds a repair location by its unique ID.
   */
  findById(id: string): Promise<IRepairLocation | null>;
  /**
   * Finds all repair locations for a specific seller.
   */
  findBySellerId(sellerId: string): Promise<IRepairLocation[] | null>;
  /**
   * Finds all active repair locations.
   */
  findActiveLocations(): Promise<IRepairLocation[] | null>;
  /**
   * Updates an existing repair location.
   */
  update(
    id: string,
    data: Partial<UpdateRepairLocationDTO>
  ): Promise<IRepairLocation | null>;
  /**
   * Deletes a repair location by its unique ID.
   */
  delete(id: string): Promise<boolean | null>;
}

/**
 * The concrete implementation of the IRepairLocationRepository interface.
 */
export const RepairLocationRepository: IRepairLocationRepository = {
  create: withErrorHandling(async (data) => {
    const location = new RepairLocation(data);
    return await location.save();
  }),

  findById: withErrorHandling(async (id: string) => {
    return await RepairLocation.findById(id).populate("seller_id");
  }),

  findBySellerId: withErrorHandling(async (sellerId: string) => {
    return await RepairLocation.find({
      seller_id: new Types.ObjectId(sellerId),
    })
      .populate("seller_id")
      .sort({ createdAt: -1 });
  }),

  findActiveLocations: withErrorHandling(async () => {
    return await RepairLocation.find({ is_active: true })
      .populate({
        path: "seller_id",
        select: "business_name shop_logo",
      })
      .sort({ createdAt: -1 });
  }),

  update: withErrorHandling(async (id: string, data) => {
    return await RepairLocation.findByIdAndUpdate(id, data, { new: true });
  }),

  delete: withErrorHandling(async (id: string) => {
    const result = await RepairLocation.findByIdAndDelete(id);
    return result !== null;
  }),
};

