
require('dotenv').config();

const API_URL = 'https://sowji-backend.onrender.com/api/products';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_API_KEY) {
  console.error('ERROR: ADMIN_API_KEY is missing from your local .env file.');
  process.exit(1);
}

const products = [
  {
    name: 'Royal Kanchipuram Bridal Silk Saree',
    slug: 'royal-kanchipuram-bridal-silk-saree',
    category: 'Kanchipuram Silk Sarees',
    price: 12999,
    discountPrice: 10999,
    stock: 10,
    sku: 'SOW-KAN-001',
    description: 'A luxurious traditional Kanchipuram silk saree with an elegant zari-inspired bridal look.',
    fabric: 'Pure Silk',
    color: 'Maroon',
    isBestSeller: true,
    isNewArrival: true,
    images: [{ url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=85', isMain: true }]
  },
  {
    name: 'Classic Banarasi Gold Zari Saree',
    slug: 'classic-banarasi-gold-zari-saree',
    category: 'Banarasi Sarees',
    price: 8999,
    discountPrice: 7499,
    stock: 12,
    sku: 'SOW-BAN-002',
    description: 'An elegant Banarasi-inspired saree for weddings and special occasions.',
    fabric: 'Silk Blend',
    color: 'Royal Blue',
    isBestSeller: true,
    isNewArrival: false,
    images: [{ url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&q=85', isMain: true }]
  },
  {
    name: 'Elegant Everyday Cotton Saree',
    slug: 'elegant-everyday-cotton-saree',
    category: 'Cotton Sarees',
    price: 1599,
    discountPrice: 1299,
    stock: 20,
    sku: 'SOW-COT-003',
    description: 'A comfortable and breathable cotton saree for everyday elegance.',
    fabric: 'Cotton',
    color: 'Mustard',
    isBestSeller: false,
    isNewArrival: true,
    images: [{ url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e7?w=900&q=85', isMain: true }]
  },
  {
    name: 'Pastel Organza Party Wear Saree',
    slug: 'pastel-organza-party-wear-saree',
    category: 'Organza Sarees',
    price: 3999,
    discountPrice: 3299,
    stock: 8,
    sku: 'SOW-ORG-004',
    description: 'A graceful lightweight organza saree for parties and celebrations.',
    fabric: 'Organza',
    color: 'Pastel Pink',
    isBestSeller: false,
    isNewArrival: true,
    images: [{ url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=85', isMain: true }]
  },
  {
    name: 'Premium Linen Designer Saree',
    slug: 'premium-linen-designer-saree',
    category: 'Linen Sarees',
    price: 2799,
    discountPrice: 2399,
    stock: 15,
    sku: 'SOW-LIN-005',
    description: 'A sophisticated linen saree with a minimal and timeless appearance.',
    fabric: 'Linen',
    color: 'Beige',
    isBestSeller: false,
    isNewArrival: true,
    images: [{ url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&q=85', isMain: true }]
  },
  {
    name: 'Mysore Silk Traditional Saree',
    slug: 'mysore-silk-traditional-saree',
    category: 'Mysore Silk Sarees',
    price: 6999,
    discountPrice: 5999,
    stock: 9,
    sku: 'SOW-MYS-006',
    description: 'A beautiful traditional silk saree inspired by the elegance of Mysore.',
    fabric: 'Silk',
    color: 'Emerald Green',
    isBestSeller: true,
    isNewArrival: false,
    images: [{ url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e7?w=900&q=85', isMain: true }]
  },
  {
    name: 'Mangalagiri Cotton Classic Saree',
    slug: 'mangalagiri-cotton-classic-saree',
    category: 'Mangalagiri Sarees',
    price: 2199,
    discountPrice: 1899,
    stock: 14,
    sku: 'SOW-MAN-007',
    description: 'A classic Mangalagiri-inspired saree for comfortable traditional wear.',
    fabric: 'Cotton',
    color: 'Red',
    isBestSeller: false,
    isNewArrival: true,
    images: [{ url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=85', isMain: true }]
  },
  {
    name: 'Venkatagiri Elegant Silk Saree',
    slug: 'venkatagiri-elegant-silk-saree',
    category: 'Venkatagiri Sarees',
    price: 5499,
    discountPrice: 4699,
    stock: 7,
    sku: 'SOW-VEN-008',
    description: 'An elegant traditional-style saree for festive and family occasions.',
    fabric: 'Silk Cotton',
    color: 'Purple',
    isBestSeller: false,
    isNewArrival: false,
    images: [{ url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&q=85', isMain: true }]
  },
  {
    name: 'Designer Floral Celebration Saree',
    slug: 'designer-floral-celebration-saree',
    category: 'Designer Sarees',
    price: 4599,
    discountPrice: 3899,
    stock: 11,
    sku: 'SOW-DES-009',
    description: 'A contemporary designer saree for celebrations and elegant gatherings.',
    fabric: 'Georgette',
    color: 'Peach',
    isBestSeller: true,
    isNewArrival: true,
    images: [{ url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e7?w=900&q=85', isMain: true }]
  },
  {
    name: 'Grand Bridal Wedding Saree',
    slug: 'grand-bridal-wedding-saree',
    category: 'Bridal Sarees',
    price: 15999,
    discountPrice: 13999,
    stock: 5,
    sku: 'SOW-BRI-010',
    description: 'A statement bridal saree for weddings and unforgettable celebrations.',
    fabric: 'Silk Blend',
    color: 'Deep Red',
    isBestSeller: true,
    isNewArrival: true,
    images: [{ url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=85', isMain: true }]
  },
  {
    name: 'Festive Party Wear Saree',
    slug: 'festive-party-wear-saree',
    category: 'Party Wear Sarees',
    price: 3499,
    discountPrice: 2999,
    stock: 13,
    sku: 'SOW-PAR-011',
    description: 'A stylish festive saree designed for parties and special evenings.',
    fabric: 'Georgette',
    color: 'Wine',
    isBestSeller: false,
    isNewArrival: true,
    images: [{ url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&q=85', isMain: true }]
  },
  {
    name: 'Daily Wear Soft Printed Saree',
    slug: 'daily-wear-soft-printed-saree',
    category: 'Daily Wear Sarees',
    price: 1199,
    discountPrice: 999,
    stock: 25,
    sku: 'SOW-DAI-012',
    description: 'A lightweight printed saree for comfortable everyday use.',
    fabric: 'Cotton Blend',
    color: 'Teal',
    isBestSeller: false,
    isNewArrival: false,
    images: [{ url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e7?w=900&q=85', isMain: true }]
  }
];

async function seedProducts() {
  try {
    console.log('Checking existing products...');

    const existingResponse = await fetch(`${API_URL}?limit=100`);

    if (!existingResponse.ok) {
      throw new Error(`Could not read products: HTTP ${existingResponse.status}`);
    }

    const existingData = await existingResponse.json();
    const existingSkus = new Set(
      (existingData.items || []).map(product => product.sku)
    );

    const newProducts = products.filter(
      product => !existingSkus.has(product.sku)
    );

    if (newProducts.length === 0) {
      console.log('All 12 sample products already exist. Nothing to add.');
      return;
    }

    console.log(`Adding ${newProducts.length} sample products...`);

    const response = await fetch(`${API_URL}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_API_KEY
      },
      body: JSON.stringify({ products: newProducts })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `HTTP ${response.status}`);
    }

    console.log('SUCCESS:', result.message);
    console.log('Products added:', result.count);
    console.log('Visit your website to see the products.');

  } catch (error) {
    console.error('SEED FAILED:', error.message);
    process.exitCode = 1;
  }
}

seedProducts();
