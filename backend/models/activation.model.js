import mongoose from 'mongoose';

const activationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    activation_token_hash: {
        type: String,
        required: true
    }
});

const Activation = mongoose.model('activation', activationSchema);

export default Activation;