import mongoose from 'mongoose';

const pwdresetSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    reset_token_hash: {
        type: String,
        required: true
    }
});

const Pwdreset = mongoose.model('pwdreset', pwdresetSchema);

export default Pwdreset;