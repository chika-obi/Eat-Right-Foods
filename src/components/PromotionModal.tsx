import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { cn } from '../lib/utils';

export function PromotionModal() {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    // Show after a short delay
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('erf_promo_dismissed');
      if (!dismissed) {
        setIsOpen(true);
      }
    }, 5000); // Increased to 5s for better UX

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Remember dismissal for today
    localStorage.setItem('erf_promo_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 pointer-events-none">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm pointer-events-auto"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl border border-white overflow-hidden pointer-events-auto"
          >
            {/* Visual Header */}
            <div className="h-32 bg-brand-dark relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_rgba(16,185,129,0.3),_transparent)]" />
               <motion.div 
                 animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                 transition={{ duration: 8, repeat: Infinity }}
                 className="absolute top-0 right-0 w-64 h-64 bg-brand-green/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" 
               />
               
               <div className="absolute inset-0 flex items-center px-10">
                  <div className="w-16 h-16 bg-brand-green/20 rounded-3xl flex items-center justify-center text-brand-green backdrop-blur-xl border border-brand-green/20">
                     <Calendar size={32} />
                  </div>
                  <div className="ml-6">
                     <h2 className="text-white font-display font-medium text-2xl tracking-tight">Weekly Collection</h2>
                     <p className="text-brand-green text-[10px] font-black uppercase tracking-[0.3em] mt-1">Enrollment Now Open</p>
                  </div>
               </div>

               <button 
                 onClick={handleClose}
                 className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
               >
                 <X size={20} />
               </button>
            </div>

            {/* Content */}
            <div className="p-10">
               <div className="space-y-6 mb-10">
                  <p className="text-slate-600 leading-relaxed font-medium">
                     The signature weekly meal rotation is now available for subscription. Lock in your spot for consistent, chef-crafted nutrition delivered across Port Harcourt.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-green shadow-sm">
                           <Truck size={16} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Doorstep Delivery</span>
                     </div>
                     <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-green shadow-sm">
                           <ShieldCheck size={16} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nutrient Dense</span>
                     </div>
                  </div>
               </div>

               <div className="flex gap-4">
                  <a 
                    href="#menu" 
                    onClick={handleClose}
                    className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white py-6 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand-green/20 group"
                  >
                    View Weekly Selection
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </a>
               </div>

               <p className="text-center mt-6 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                  Secure your slot before Saturday 18:00
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
