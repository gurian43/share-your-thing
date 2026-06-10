import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    file_id: { type: mongoose.Schema.Types.ObjectId, ref: "file", required: true },
    value: { type: Number, enum: [-1, 1], required: true }
}, { timestamps: true });

voteSchema.index({ user_id: 1, file_id: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);

export default Vote;