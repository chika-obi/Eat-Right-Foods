import React from 'react';
import { motion } from 'motion/react';
import { Megaphone, Truck, Zap, ShieldCheck } from 'lucide-react';

export function PromoTicker() {
  return (
    <div className="bg-brand-dark py-2.5 md:py-3.5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(16,185,129,0.15),_transparent)]" />
      
      {/* Animated shimmer effect */}
      <motion.div 
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-brand-green/5 to-transparent skew-x-12"
      />

      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center md:justify-between text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
        <div className="hidden lg:flex items-center gap-10">
          <div className="flex items-center gap-2 group cursor-help">
            <Truck size={14} className="text-brand-green group-hover:scale-110 transition-transform" />
            <span className="text-white/60 group-hover:text-white transition-colors">Elite Delivery above ₦100k</span>
          </div>
          <div className="flex items-center gap-2 group cursor-help">
            <ShieldCheck size={14} className="text-brand-green group-hover:rotate-12 transition-transform" />
            <span className="text-white/60 group-hover:text-white transition-colors">ISO 22000 Certified Hygiene</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              borderColor: ['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.5)', 'rgba(16,185,129,0.2)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-3 px-4 py-2 rounded-full border border-brand-green/30 bg-brand-green/5 shadow-2xl shadow-black/20"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
            </span>
            <span className="whitespace-nowrap text-white font-black tracking-[0.1em]">Weekly Plans Open</span>
          </motion.div>
          
          <a href="#menu" className="hidden sm:flex items-center gap-1.5 bg-brand-green text-white px-4 py-1.5 rounded-[0.5rem] font-black hover:scale-105 transition-all shadow-lg shadow-brand-green/30 active:scale-95">
            JOIN
          </a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <span className="text-white/30 flex items-center gap-2 select-none font-medium italic">
            Port Harcourt's Signature Wellness
          </span>
        </div>
      </div>
    </div>
  );
}

export function TrustBar() {
  const partners = [
    "NAFDAC REGISTERED",
    "ISO 9001:2015",
    "100% ORGANIC SOURCED",
    "ZERO PRESERVATIVES",
    "HYGIENE RATED 5*",
    "RIVERS STATE PARTNER",
    "HALAL CERTIFIED"
  ];

  return (
    <div className="w-full bg-[#050505] border-t border-white/5 py-10 overflow-hidden">
      <div className="flex whitespace-nowrap">
        <motion.div 
          animate={{ x: [0, -2000] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-24 pr-24"
        >
          {[...partners, ...partners, ...partners].map((p, i) => (
            <div key={`trust-partner-${p}-${i}`} className="flex items-center gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-green shadow-[0_0_15px_rgba(16,185,129,1)]" />
              <span className="text-white/20 text-[10px] font-black tracking-[0.4em] uppercase">
                {p}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
