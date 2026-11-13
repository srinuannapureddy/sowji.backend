
const mongoose = require('mongoose');

const instagramUrlValidator = {
  validator: function (value) {
    if (!value) return true;

    try {
      const url = new URL(value);

      return (
        url.protocol === 'https:' &&
        ['instagram.com', 'www.instagram.com'].includes(url.hostname)
      );
    } catch {
      return false;
    }
  },
  message: 'Only valid Instagram URLs are allowed'
};

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      default: null,
      min: 0
    },

    discountPrice: {
      type: Number,
      default: null,
      min: 0
    },

    stock: {
      type: Number,
      default: null,
      min: 0
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    description: {
      type: String,
      default: '',
      trim: true
    },

    images: [
      {
        url: {
          type: String,
          required: true,
          trim: true
        },
        isMain: {
          type: Boolean,
          default: false
        }
      }
    ],

    // Multiple available colours for a saree.
    colors: {
      type: [{
        type: String,
        trim: true
      }],
      default: []
    },

    // Optional detailed colour variants.
    colorVariants: [
      {
        name: {
          type: String,
          trim: true
        },
        color: {
          type: String,
          trim: true
        },
        stock: {
          type: Number,
          default: null,
          min: 0
        },
        sku: {
          type: String,
          trim: true
        }
      }
    ],

    // Existing single colour field retained for compatibility.
    color: {
      type: String,
      default: '',
      trim: true
    },

    fabric: {
  type: String,
  default: '',
  trim: true
},

weaveType: {
  type: String,
  default: '',
  trim: true
},

blousePiece: {
  type: String,
  default: '',
  trim: true
},

blouseIncluded: {
  type: Boolean,
  default: false
},

occasion: {
  type: String,
  default: '',
  trim: true
},

careInstructions: {
  type: String,
  default: '',
  trim: true
},

    isVerified: {
      type: Boolean,
      default: false
    },

    isPublished: {
      type: Boolean,
      default: false
    },

    verifiedAt: {
      type: Date,
      default: null
    },

    sourcePostUrl: {
      type: String,
      default: '',
      trim: true,
      validate: instagramUrlValidator
    },

    instagramUrl: {
      type: String,
      default: '',
      trim: true,
      validate: instagramUrlValidator
    },

    isBestSeller: {
      type: Boolean,
      default: false
    },

    isNewArrival: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({
  isVerified: 1,
  isPublished: 1
});

productSchema.index({
  colors: 1
});

module.exports = mongoose.model('Product', productSchema);
