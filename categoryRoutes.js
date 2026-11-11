const express = require('express');
const router = express.Router();

const CATEGORIES = [
  { name: 'Kanchipuram Silk Sarees', slug: 'kanchipuram-silk-sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80' },
  { name: 'Banarasi Sarees', slug: 'banarasi-sarees', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Cotton Sarees', slug: 'cotton-sarees', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80' },
  { name: 'Organza Sarees', slug: 'organza-sarees', image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=600&q=80' },
  { name: 'Designer Sarees', slug: 'designer-sarees', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80' },
  { name: 'Party Wear Sarees', slug: 'party-wear-sarees', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80' }
];

router.get('/', (req, res) => {
  res.json({ items: CATEGORIES });
});

module.exports = router;
