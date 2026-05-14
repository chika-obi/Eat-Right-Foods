import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES } from '../constants';
import { ProductCard } from './ProductCard';
import { Product, Review } from '../types';
import { ProductReviews } from './ProductReviews';
import { Search, SlidersHorizontal, X, ShoppingBag } from 'lucide-react';

interface MenuProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onAddReview: (productId: string, review: Omit<Review, 'id' | 'date'>) => void;
}

export function Menu({ products, onAddToCart, onAddReview }: MenuProps) {
  const [activeCategory, setActiveCategory] = React.useState<typeof CATEGORIES[number]>('All');
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId) || null;

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="menu" className="py-32 bg-brand-cream">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-black uppercase tracking-widest mb-6">
              <ShoppingBag size={14} />
              <span>Gourmet Selection</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-display font-bold text-brand-dark leading-[1.05]">
              Our Regular <br />
              <span className="text-brand-green italic">Masterpieces</span>
            </h2>
          </div>
          <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
            Every dish is a calculated harmony of nutrients and flavor, prepared daily in our Port Harcourt kitchen.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-16 glass-card !rounded-[2.5rem] p-4 flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search for your favorite clean meal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/50 rounded-2xl py-4 pl-14 pr-6 text-sm font-medium focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all border border-slate-100"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto px-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest whitespace-nowrap transition-all border ${
                  activeCategory === category 
                    ? 'bg-brand-dark text-white border-brand-dark shadow-xl shadow-brand-dark/20' 
                    : 'bg-white/50 text-slate-500 border-white hover:border-brand-green'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <ProductCard 
                  product={product} 
                  onAddToCart={onAddToCart} 
                  onViewReviews={(p) => setSelectedProductId(p.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium italic">No items available in this category yet.</p>
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductReviews 
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProductId(null)}
          onAddReview={onAddReview}
        />
      )}
    </section>
  );
}
