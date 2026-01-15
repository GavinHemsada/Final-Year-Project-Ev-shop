import { EvCategory } from "../src/entities/EvCategory";
import { evCategoryData } from "../data/evCategory.data";
export const seedEvCategory = async () => {
    try{
        await EvCategory.deleteMany();
        await EvCategory.create(evCategoryData);
        console.log("EvCategory seeded successfully");
    }catch(error){
        console.log("EvCategory seeding failed",error);
    }
};