import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Loader2, RefreshCw, ChevronRight, Apple } from 'lucide-react';
import { Product } from '../types';
import { cn } from '../lib/utils';

interface MealCompanionProps {
  products: Product[];
}

interface Recommendation {
  productId: string;
  reasoning: string;
}

interface AIResponse {
  recommendations: Recommendation[];
  advice: string;
}

export function MealCompanion({ products }: MealCompanionProps) {
  const [preferences, setPreferences] = React.useState('');
  const [dietaryGoals, setDietaryGoals] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<AIResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences.trim() || !dietaryGoals.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences,
          dietaryGoals,
          products: products.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category,
            calories: p.calories
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendedProducts = () => {
    if (!result) return [];
    return result.recommendations
      .map(rec => {
        const product = products.find(p => p.id === rec.productId);
        if (!product) return null;
        return { ...product, reasoning: rec.reasoning };
      })
      .filter((p): p is Product & { reasoning: string } => p !== null);
  };

  return (
    <div className="mb-20 glass-card !rounded-[2.5rem] overflow-hidden border border-brand-green/20">
      <div className="grid lg:grid-cols-2">
        {/* Left: Input Section */}
        <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center text-white shadow-lg shadow-brand-green/30">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-brand-dark">Meal Companion</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Personalized Recommendations</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">What do you crave?</label>
              <textarea 
                placeholder="e.g. I love spicy Nigerian food but want something light for lunch..."
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-medium border border-slate-100 focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all resize-none h-24"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Your Dietary Goals</label>
              <input 
                type="text"
                placeholder="e.g. Weight loss, muscle gain, low carb..."
                value={dietaryGoals}
                onChange={(e) => setDietaryGoals(e.target.value)}
                className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-medium border border-slate-100 focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green outline-none transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading || !preferences.trim() || !dietaryGoals.trim()}
              className="w-full py-4 bg-brand-dark text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-brand-dark/20 hover:bg-brand-green hover:shadow-brand-green/20 disabled:opacity-50 disabled:hover:bg-brand-dark transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Analyzing Flavors...</span>
                </>
              ) : (
                <>
                  <span>Get Recommendations</span>
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )
            }
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
              {error}
            </div>
          )}
        </div>

        {/* Right: Results Section */}
        <div className="bg-slate-50/50 p-8 md:p-12 flex flex-col">
          <AnimatePresence mode="wait">
            {!result && !isLoading ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col items-center justify-center text-center py-12"
              >
                <div className="w-20 h-20 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-200 mb-6 group-hover:scale-110 transition-transform">
                  <Apple size={40} />
                </div>
                <h4 className="text-lg font-display font-bold text-slate-400 mb-2">Ready to curate your plate?</h4>
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed italic">
                  Tell us what you like and we'll handpick masterpieces from our menu that fuel your specific goals.
                </p>
              </motion.div>
            ) : isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center py-12"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-brand-green/20 border-t-brand-green animate-spin" />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-brand-green" size={24} />
                </div>
                <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-brand-green animate-pulse">Personalizing your menu...</p>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1"
              >
                <div className="mb-8">
                  <div className="inline-block px-3 py-1 rounded-lg bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Expert Advice</div>
                  <p className="text-sm text-slate-600 leading-relaxed italic">"{result.advice}"</p>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Handpicked Selections</div>
                  {getRecommendedProducts().map((product, idx) => (
                    <motion.div 
                      key={`${product.id}-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group bg-white p-4 rounded-2xl border border-slate-100 hover:border-brand-green/30 hover:shadow-xl hover:shadow-brand-green/5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h5 className="font-display font-bold text-brand-dark group-hover:text-brand-green transition-colors">{product.name}</h5>
                          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                            <span className="font-black text-brand-green uppercase tracking-widest mr-2">Why it fits:</span>
                            {product.reasoning}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button 
                  onClick={() => {
                     setResult(null);
                     setPreferences('');
                     setDietaryGoals('');
                  }}
                  className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-green flex items-center gap-2 transition-colors"
                >
                  <RefreshCw size={12} />
                  Start Over
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
