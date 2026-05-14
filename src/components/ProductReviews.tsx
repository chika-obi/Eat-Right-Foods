import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, User, Send, StarHalf } from 'lucide-react';
import { Product, Review } from '../types';
import { cn } from '../lib/utils';

interface ProductReviewsProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddReview: (productId: string, review: Omit<Review, 'id' | 'date'>) => void;
}

export function ProductReviews({ product, isOpen, onClose, onAddReview }: ProductReviewsProps) {
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');
  const [userName, setUserName] = React.useState('');

  const averageRating = product.reviews.length > 0
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !comment) return;
    onAddReview(product.id, { userName, rating, comment });
    setComment('');
    setRating(5);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white z-[90] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="relative h-48 sm:h-64 flex-shrink-0">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4 space-y-8">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-3xl font-display font-bold text-slate-900 leading-none">{product.name}</h2>
                  <div className="flex items-center gap-2 bg-brand-green/10 px-3 py-1.5 rounded-full">
                    <Star size={16} className="text-brand-green fill-brand-green" />
                    <span className="font-bold text-brand-green">{averageRating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{product.description}</p>
              </div>

              {/* Review Form */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                  <Star size={20} className="text-brand-green" /> Leave a Review
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Your Name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-green/20 outline-none"
                      required
                    />
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mr-2">Rating</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button 
                            key={`form-star-${s}`} 
                            type="button"
                            onClick={() => setRating(s)}
                            className={cn("transition-colors", s <= rating ? "text-yellow-400" : "text-slate-200")}
                          >
                            <Star size={18} fill={s <= rating ? "currentColor" : "none"} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <textarea 
                    placeholder="Tell us what you liked about this meal..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-green/20 outline-none min-h-[80px] resize-none"
                    required
                  />
                  <button 
                    type="submit"
                    className="w-full bg-brand-green text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20"
                  >
                    <Send size={18} /> Submit Review
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                <h3 className="font-display font-bold text-xl text-slate-900 border-b border-slate-100 pb-4">
                  Customer Reviews ({product.reviews.length})
                </h3>
                {product.reviews.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 italic font-medium">No reviews yet. Be the first!</p>
                ) : (
                  <div className="space-y-6">
                    {product.reviews.map((review) => (
                      <div key={review.id} className="flex gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 flex-shrink-0">
                          <User size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-slate-900">{review.userName}</h4>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{review.date}</span>
                          </div>
                          <div className="flex gap-0.5 mb-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star 
                                key={`review-${review.id}-star-${s}`} 
                                size={12} 
                                className={cn(s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200")} 
                              />
                            ))}
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed italic">"{review.comment}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
