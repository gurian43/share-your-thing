import mongoose from "mongoose";

const connectToDatabase = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("Database connection error:", error);
        if(process.env.NODE_ENV == 'production'){
            process.exit(1);
        } else {
            console.log("Continuing in development mode...");
        }
    }
}

export default connectToDatabase;