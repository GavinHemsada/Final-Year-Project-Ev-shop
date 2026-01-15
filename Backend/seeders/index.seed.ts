import { seedAdmin } from "./admin.seed";
import { seedEvBrand } from "./evBrand.seed";
import { seedEvCategory } from "./evCategory.seed";
import connectDB from "../src/config/DBConnection";
import dotenv from "dotenv";
dotenv.config();    

const runSeeders = async () => {
    try{
        await connectDB();
        await seedAdmin();
        await seedEvBrand();
        await seedEvCategory();
        console.log("seeded successfully");
        process.exit();
    }catch(error){
        console.log("seed failed",error);
    }
};

runSeeders();
