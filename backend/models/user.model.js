import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    active: { type: Boolean, default: false },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    max_storage: { type: Number, default: 5 * 1024 * 1024 * 1024 },
    current_storage: { type: Number, default: 0 },
    badges: [{ title: String, date_awarded: Date, color: String }, { default: [] }],
    admin: { type: Boolean, default: false },
    profile: {
        avatar_url: { type: String, default: '' },
        bio: { type: String, default: '' }
    },
}, { timestamps: true });

userSchema.virtual('effective_max_storage').get(function() {
    return this.admin ? Infinity : this.max_storage;
});

const User = mongoose.model('User', userSchema);

export default User;