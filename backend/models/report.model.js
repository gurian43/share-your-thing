import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    reporter_id: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    file_id: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "file",
        required: true
    },
    reason: { 
        type: String,
        enum: ["inappropriate", "spam", "other"],
        required: true
    },
    description: { 
        type: String,
        default: ""
    },
    resolved: { 
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Report = mongoose.model("Report", reportSchema);

export default Report;
