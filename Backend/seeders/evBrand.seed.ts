import { EvBrand } from "../src/entities/EvBrand";
import { evBrandData } from "../data/evBrand.data";
export const seedEvBrand = async () => {
    try{
        await EvBrand.deleteMany();
        await EvBrand.create(evBrandData);
        console.log("EvBrand seeded successfully");
    }catch(error){
        console.log("EvBrand seeding failed",error);
    }
};