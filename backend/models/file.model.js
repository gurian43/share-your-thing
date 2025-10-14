import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
    owner_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "user", 
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
    expires_at: { 
        type: Date, 
        default: null 
    },
    encrypted: { 
        type: Boolean, 
        default: false 
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
