import mongoose from 'mongoose';

const rfpSchema = new mongoose.Schema({
  items: [
    {
      itemName: {
        type: String,
        required: true,
        trim: true     
      },
      quantity: {
        type: Number,
        required: true,
        min: 1         
      }
    }
  ],

  'budget_in_$': {
    type: Number,
    required: true,
    min: 0
  },
  deadline: {
    type: Date,
    required: true
  },
  proposalIds: {
    type: [Number],
    default: []
  }
}, {
  timestamps: true 
});

export const Rfp = mongoose.model('Rfp', rfpSchema);