import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    file_name: { 
        type: String, 
        required: true 
    },
    file_path: { 
        type: String, 
        required: true 
    },
    file_size: { 
        type: Number,
        required: true 
    },
    visibility: { 
        type: String, 
        enum: ["private", "unlisted", "public"], 
        default: "unlisted" 
    },
    password: { 
        type: String, 
        default: null 
    },
    description: { 
        type: String, 
        default: "" 
    },
    checksum: { 
        type: String, 
        required: true 
    },
    download_count: { 
        type: Number, 
        default: 0 
    },
    max_downloads: { 
        type: Number, 
        default: null 
    },
    shared_with: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        default: []
    }],
    active: {
        type: Boolean,
        default: true
    },
    expires_at: { 
        type: Date, 
        default: null
    },
    uploaded_at: { 
        type: Date, 
        default: Date.now 
    }
}, { 
    timestamps: true
});

const File = mongoose.model("file", fileSchema);

export default File;
