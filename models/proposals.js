import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        default: () => Math.floor(Math.random() * 10)
    },

    cost: {
        type: Number,
        required: true
    },

    deliveryDate: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

export const Proposals = mongoose.model('Proposal', proposalSchema);