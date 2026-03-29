import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb://localhost:27017/Foodie_frenzy')
        .then(() => console.log('DB CONNECTED'))
}