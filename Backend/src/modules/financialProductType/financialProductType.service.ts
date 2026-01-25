import { FinancialProductType, IFinancialProductType } from "../../entities/FinancialProductType";

export interface IFinancialProductTypeService {
  createType(data: Partial<IFinancialProductType>): Promise<{ success: boolean; type?: IFinancialProductType; error?: string }>;
  getAllTypes(): Promise<{ success: boolean; types?: IFinancialProductType[]; error?: string }>;
  updateType(id: string, data: Partial<IFinancialProductType>): Promise<{ success: boolean; type?: IFinancialProductType | null; error?: string }>;
  deleteType(id: string): Promise<{ success: boolean; error?: string }>;
}

export const financialProductTypeService: IFinancialProductTypeService = {
  createType: async (data) => {
    try {
      const type = new FinancialProductType(data);
      await type.save();
      return { success: true, type };
    } catch (error) {
      return { success: false, error: "Failed to create type" };
    }
  },
  
  getAllTypes: async () => {
    try {
      const types = await FinancialProductType.find().sort({ name: 1 });
      return { success: true, types };
    } catch (error) {
      return { success: false, error: "Failed to fetch types" };
    }
  },
  
  updateType: async (id, data) => {
    try {
      const type = await FinancialProductType.findByIdAndUpdate(id, data, { new: true });
      if (!type) return { success: false, error: "Type not found" };
      return { success: true, type };
    } catch (error) {
      return { success: false, error: "Failed to update type" };
    }
  },
  
  deleteType: async (id) => {
    try {
      const result = await FinancialProductType.findByIdAndDelete(id);
      if (!result) return { success: false, error: "Type not found" };
      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to delete type" };
    }
  },
};

