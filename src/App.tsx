/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Menu } from './components/Menu';
import { OrderTracking } from './components/OrderTracking';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { ProfileDrawer } from './components/ProfileDrawer';
import { AdminPanel } from './components/AdminPanel';
import { AboutUs } from './components/AboutUs';
import { Newsletter } from './components/Newsletter';
import { PromotionModal } from './components/PromotionModal';
import { AuthProvider } from './contexts/AuthContext';
import { Product, CartItem, Review } from './types';
import { PRODUCTS, CONTACT_INFO } from './constants';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { motion, useScroll, useSpring } from 'motion/react';
import { Leaf, ShieldCheck, Truck, Utensils, Phone } from 'lucide-react';

function AppContent() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isAdminOpen, setIsAdminOpen] = React.useState(false);

  React.useEffect(() => {
    // Listen to real-time product updates from Firestore
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      if (!snapshot.empty) {
        const fetchedProducts = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as Product));
        setProducts(fetchedProducts);
      } else {
        // Fallback to constants if DB is empty
        setProducts(PRODUCTS);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    return () => unsubscribe();
  }, []);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    // Open cart for feedback
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddReview = async (productId: string, reviewData: Omit<Review, 'id' | 'date'>) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const newReview: Review = {
        ...reviewData,
        id: `r-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        date: new Date().toISOString().split('T')[0]
      };

      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        reviews: [newReview, ...(product.reviews || [])]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-brand-green z-[100] origin-left"
        style={{ scaleX }}
      />
      
      <header className="fixed top-0 left-0 right-0 z-50">
        <Navbar 
          cartCount={cartCount} 
          onCartClick={() => setIsCartOpen(true)} 
          onProfileClick={() => setIsProfileOpen(true)}
          onAdminClick={() => setIsAdminOpen(true)}
        />
      </header>
      
      <main>
        <Hero />
        
        <AboutUs />

        <Menu 
          products={products} 
          onAddToCart={handleAddToCart} 
          onAddReview={handleAddReview}
        />
        
        <OrderTracking />
        
        <Newsletter />

        {/* CTA Section */}
        <section className="py-32 bg-brand-dark relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_rgba(16,185,129,0.1),_transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(16,185,129,0.05),_transparent)]" />
          
          <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-black uppercase tracking-widest mb-10">
              <Utensils size={14} />
              <span>Secure Your Slot</span>
            </div>
            
            <h2 className="text-5xl md:text-8xl font-display font-medium text-white mb-10 leading-[0.9] tracking-tighter">
              A better <span className="text-brand-green italic font-light">you</span> <br />
              starts with lunch.
            </h2>
            
            <p className="text-slate-400 text-xl mb-16 max-w-2xl mx-auto leading-relaxed font-medium">
              Join the elite circle of professionals who have traded burnout for bioavailability. Your body will thank you.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a 
                href="#menu" 
                className="w-full sm:w-auto bg-brand-green hover:bg-brand-green/90 text-white px-12 py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-2xl shadow-brand-green/30 group"
              >
                Join the Movement
              </a>
              <a 
                href={`https://wa.me/${CONTACT_INFO.whatsapp}`} 
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto border border-white/20 hover:border-brand-green/50 text-white px-12 py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-white/5 transition-all"
              >
                Direct Concierge
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Floating WhatsApp Button */}
      <a 
        href={`https://wa.me/${CONTACT_INFO.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-8 right-8 z-[50] group"
      >
        <motion.div 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl flex items-center gap-3 pr-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20" />
            <Phone size={24} />
          </div>
          <div className="hidden md:block">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 leading-none">Order on</p>
            <p className="font-bold text-sm">WhatsApp</p>
          </div>
        </motion.div>
      </a>

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveItem}
      />

      <ProfileDrawer 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onAddToCart={handleAddToCart}
        onAdminClick={() => setIsAdminOpen(true)}
        products={products}
      />

      <AdminPanel 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      <PromotionModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

