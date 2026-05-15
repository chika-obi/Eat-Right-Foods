import React from 'react';
import { motion } from 'motion/react';
import { Megaphone, Truck, Zap, ShieldCheck } from 'lucide-react';

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
