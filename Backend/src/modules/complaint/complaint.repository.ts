import { IComplaint, Complaint } from "../../entities/Complaint";
import { withErrorHandling } from "../../shared/utils/CustomException";
import { Types } from "mongoose";
import { Seller } from "../../entities/Seller";
import { FinancialInstitution } from "../../entities/FinancialInstitution";

/**
 * Defines the contract for the complaint repository.
 */
export interface IComplaintRepository {
  /**
   * Creates a new complaint.
   * @param data - The complaint data to create.
   * @returns A promise that resolves to the created complaint document or null.
   */
  create(data: Partial<IComplaint>): Promise<IComplaint | null>;
  /**
   * Finds all complaints, optionally filtered by status and user type.
   * @param status - Optional status filter.
   * @param userType - Optional user type filter.
   * @returns A promise that resolves to an array of complaint documents or null.
   */
  findAll(status?: string, userType?: string): Promise<IComplaint[] | null>;
  /**
   * Finds a complaint by its unique ID.
   * @param id - The ID of the complaint to find.
   * @returns A promise that resolves to the complaint document or null if not found.
   */
  findById(id: string): Promise<IComplaint | null>;
  /**
   * Updates a complaint by its unique ID.
   * @param id - The ID of the complaint to update.
   * @param data - The partial data to update.
   * @returns A promise that resolves to the updated complaint document or null.
   */
  update(id: string, data: Partial<IComplaint>): Promise<IComplaint | null>;
  /**
   * Deletes a complaint by its unique ID.
   * @param id - The ID of the complaint to delete.
   * @returns A promise that resolves to an object with deletion status and complaint data.
   */
  delete(id: string): Promise<{ deleted: boolean; complaint: IComplaint | null } | null>;
}

/**
 * The concrete implementation of the IComplaintRepository interface.
 */
export const ComplaintRepository: IComplaintRepository = {
  create: withErrorHandling(async (data) => {
    const complaint = new Complaint(data);
    return await complaint.save();
  }),
  findAll: withErrorHandling(async (status?: string, userType?: string) => {
    const filter: any = {};
    if (status) filter.status = status;
    if (userType) {
      // Handle buyer type - also include complaints without user_type or with null user_type
      if (userType === "buyer") {
        filter.$or = [
          { user_type: "buyer" },
          { user_type: { $exists: false } },
          { user_type: null },
        ];
      } else {
        filter.user_type = userType;
      }
    }
    const complaints = await Complaint.find(filter)
      .populate("user_id", "name email")
      .sort({ createdAt: -1 });
    
    // Populate seller or financial institution based on user_type
    for (const complaint of complaints || []) {
      // Ensure user_type is set (default to "buyer" if missing)
      if (!complaint.user_type) {
        (complaint as any).user_type = "buyer";
      }
      
      if (complaint.user_type === "seller") {
        const seller = await Seller.findOne({ user_id: complaint.user_id }).select("business_name name");
        if (seller) {
          (complaint as any).seller_data = seller;
        }
      } else if (complaint.user_type === "financial") {
        const financial = await FinancialInstitution.findOne({ user_id: complaint.user_id }).select("name business_name");
        if (financial) {
          (complaint as any).financial_data = financial;
        }
      }
    }
    
    return complaints;
  }),
  findById: withErrorHandling(async (id) => {
    const complaint = await Complaint.findById(id).populate("user_id", "name email");
    if (complaint) {
      if (complaint.user_type === "seller") {
        const seller = await Seller.findOne({ user_id: complaint.user_id }).select("business_name name");
        if (seller) {
          (complaint as any).seller_data = seller;
        }
      } else if (complaint.user_type === "financial") {
        const financial = await FinancialInstitution.findOne({ user_id: complaint.user_id }).select("name business_name");
        if (financial) {
          (complaint as any).financial_data = financial;
        }
      }
    }
    return complaint;
  }),
  update: withErrorHandling(async (id, data) => {
    const complaint = await Complaint.findByIdAndUpdate(id, data, { new: true })
      .populate("user_id", "name email");
    if (complaint) {
      if (complaint.user_type === "seller") {
        const seller = await Seller.findOne({ user_id: complaint.user_id }).select("business_name name");
        if (seller) {
          (complaint as any).seller_data = seller;
        }
      } else if (complaint.user_type === "financial") {
        const financial = await FinancialInstitution.findOne({ user_id: complaint.user_id }).select("name business_name");
        if (financial) {
          (complaint as any).financial_data = financial;
        }
      }
    }
    return complaint;
  }),
  delete: withErrorHandling(async (id) => {
    // Get complaint before deleting to send notification
    const complaint = await Complaint.findById(id).populate("user_id", "name email");
    if (complaint) {
      if (complaint.user_type === "seller") {
        const seller = await Seller.findOne({ user_id: complaint.user_id }).select("business_name name");
        if (seller) {
          (complaint as any).seller_data = seller;
        }
      } else if (complaint.user_type === "financial") {
        const financial = await FinancialInstitution.findOne({ user_id: complaint.user_id }).select("name business_name");
        if (financial) {
          (complaint as any).financial_data = financial;
        }
      }
    }
    const result = await Complaint.findByIdAndDelete(id);
    return { deleted: result !== null, complaint };
  }),
};
