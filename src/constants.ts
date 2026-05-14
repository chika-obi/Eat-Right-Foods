import { Product, DeliveryOption } from './types';
import swallowImage from './assets/images/healthy_swallow_soup_1778705674948.png';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Party Jollof Rice',
    description: 'Smoky party jollof served with grilled chicken, moin-moin, and coleslaw.',
    price: 4500,
    category: 'Nigerian',
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=1200',
    calories: 850,
    protein: 35,
    reviews: [
      { id: 'r1', userName: 'Chidi O.', rating: 5, comment: 'The best jollof in Port Harcourt! Tastes exactly like party rice.', date: '2024-03-10' },
      { id: 'r2', userName: 'Amaka E.', rating: 4, comment: 'Very delicious, but the chicken could be a bit spicier.', date: '2024-03-12' }
    ]
  },
  {
    id: '2',
    name: 'Sea Pasta Special',
    description: 'Creamy fettuccine with prawns, calamari, and fresh herbs.',
    price: 6500,
    category: 'Continental',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=1200',
    calories: 720,
    protein: 42,
    reviews: [
      { id: 'r3', userName: 'James W.', rating: 5, comment: 'The prawns were so fresh and the sauce was perfect.', date: '2024-03-08' }
    ]
  },
  {
    id: '3',
    name: 'Healthy Egusi & Pounded Yam',
    description: 'Rich Egusi soup with goat meat and assorted delicacies, served with soft pounded yam.',
    price: 5500,
    category: 'Nigerian',
    image: swallowImage, 
    calories: 950,
    protein: 55,
    reviews: [
      { id: 'r4', userName: 'Tunde A.', rating: 5, comment: 'Exactly how my mom makes it. So wholesome.', date: '2024-03-15' }
    ]
  },
  {
    id: '4',
    name: 'Grilled Chicken Salad',
    description: 'Fresh organic greens, avocado, cherry tomatoes, and perfectly seasoned grilled chicken.',
    price: 3800,
    category: 'Healthy',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1200',
    calories: 450,
    protein: 48,
    reviews: [
      { id: 'r5', userName: 'Sarah L.', rating: 4, comment: 'Great portions for a salad. Very filling!', date: '2024-03-14' }
    ]
  },
  {
    id: '5',
    name: 'Stir-fry Noodles with Shrimp',
    description: 'Quick, reliable and tasty noodles with jumbo shrimps and crunchy veggies.',
    price: 4200,
    category: 'Continental',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=1200',
    calories: 680,
    protein: 28,
    reviews: []
  },
  {
    id: '6',
    name: 'Native Fried Rice',
    description: 'Traditional fried rice with scent leaves, dried fish, and prawns.',
    price: 4800,
    category: 'Nigerian',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=1200',
    calories: 780,
    protein: 38,
    reviews: [
      { id: 'r6', userName: 'Obi K.', rating: 5, comment: 'The scent leaves make all the difference. Highly recommended.', date: '2024-03-11' }
    ]
  },
];

export const CATEGORIES = ['All', 'Nigerian', 'Continental', 'Healthy', 'Drinks'] as const;

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: 'standard',
    label: 'Standard Delivery',
    price: 1500,
    description: '30-45 mins delivery.'
  },
  {
    id: 'express',
    label: 'Express Delivery',
    price: 3000,
    description: 'Priority delivery within 20 mins.'
  },
  {
    id: 'scheduled',
    label: 'Scheduled Delivery',
    price: 1000,
    description: 'Pick a time that suits you.'
  }
];

export const CONTACT_INFO = {
  whatsapp: '2348030522403',
  whatsappDisplay: '0803 052 2403',
  address: '9, 12 Tombia Extension, New GRA, Phase 2, Port Harcourt',
  hours: 'Mon - Sat: 8:00 AM - 8:00 PM',
  socials: {
    instagram: '@eatright_restaurant',
    twitter: '@eatrightfoodtv'
  }
};
