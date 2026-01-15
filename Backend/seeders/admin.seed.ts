import { User } from "../src/entities/User";
import { adminData } from "../data/admin.data";
export const seedAdmin = async () => {
    try{
        await User.deleteMany();
        await User.create(adminData);
        console.log("Admin seeded successfully");
    }catch(error){
        console.log("Admin seeding failed",error);
    }
};