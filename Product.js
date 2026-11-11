const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  stock: { type: Number, default: 10 },
  sku: { type: String, required: true, unique: true },
  description: { type: String },
  images: [{
    url: { type: String, required: true },
    isMain: { type: Boolean, default: false }
  }],
  isBestSeller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  fabric: { type: String },
  color: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
