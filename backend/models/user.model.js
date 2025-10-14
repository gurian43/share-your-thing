import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    profile: {
        avatar_url: { type: String, default: '' },
        bio: { type: String, default: '' }
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
