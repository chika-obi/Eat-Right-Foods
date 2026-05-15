import { Plus, ShoppingBag, Star, MessageSquare } from 'lucide-react';
import { Product } from '../types';
import { cn } from '../lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewReviews: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onViewReviews }: ProductCardProps) {
  const averageRating = product.reviews.length > 0
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
    : 0;

  return (
    <div className="group bg-white rounded-[2.5rem] overflow-hidden border border-white shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
      <a 
        href="#reviews" 
        onClick={(e) => { e.preventDefault(); onViewReviews(product); }}
        className="relative h-72 overflow-hidden cursor-pointer block m-3 rounded-[2rem]"
      >
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="bg-brand-dark/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-sm self-start">
            {product.category}
          </span>
          {averageRating > 0 && (
            <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-brand-dark flex items-center gap-1 shadow-sm self-start">
              <Star size={10} fill="currentColor" className="text-amber-400" />
              {averageRating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="absolute inset-0 bg-brand-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <span className="bg-white text-brand-dark px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-xl">
            View Details
          </span>
        </div>
      </a>
      
      <div className="p-8 pt-2">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-display font-bold text-2xl text-brand-dark tracking-tight leading-tight max-w-[70%]">
            {product.name}
          </h3>
          <div className="flex flex-col items-end">
             <span className="font-display font-bold text-xl text-brand-green">
               ₦{product.price.toLocaleString()}
             </span>
             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">per serving</span>
          </div>
        </div>

        {product.calories && (
          <div className="flex gap-6 mb-6">
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cals</span>
                <span className="text-sm font-bold text-brand-dark">{product.calories}k</span>
             </div>
             <div className="w-px h-8 bg-slate-100" />
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Protein</span>
                <span className="text-sm font-bold text-brand-dark">{product.protein}g</span>
             </div>
             <div className="w-px h-8 bg-slate-100" />
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carbs</span>
                <span className="text-sm font-bold text-brand-dark">{product.carbs || 24}g</span>
             </div>
          </div>
        )}
        
        <p className="text-sm text-slate-500 line-clamp-2 mb-8 leading-relaxed">
          {product.description}
        </p>
        
        <div className="flex gap-2">
          <button 
            onClick={() => onAddToCart(product)}
            className="flex-1 bg-brand-dark hover:bg-brand-green text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-brand-dark/10 group/btn"
          >
            <ShoppingBag size={16} className="transition-transform group-hover/btn:-translate-y-0.5" />
            Add to Bag
          </button>
          <button 
            onClick={() => onViewReviews(product)}
            className="w-14 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 text-slate-400 hover:text-brand-green rounded-2xl flex items-center justify-center transition-all duration-300"
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
