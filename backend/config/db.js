import mongoose from "mongoose";

const connectToDatabase = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("Database connection error:", error.message);
        if(process.env.NODE_ENV == 'production'){
            process.exit(1);
        } else {
            console.log("Continuing in development mode without database...");
        }
    }
}

export default connectToDatabase;