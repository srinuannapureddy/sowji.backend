
const mongoose = require('mongoose');

const customerDataSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    cart: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    wishlist: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    compare: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.CustomerData ||
  mongoose.model('CustomerData', customerDataSchema);
