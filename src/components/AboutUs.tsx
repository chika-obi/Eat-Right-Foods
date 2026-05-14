import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform, animate, useInView } from 'motion/react';
import { Leaf, Heart, Users, Target } from 'lucide-react';

function StatCounter({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration: 2,
        onUpdate: (prev) => setDisplayValue(Math.floor(prev)),
        ease: "easeOut"
      });
      return () => controls.stop();
    }
  }, [value, isInView]);

  return (
    <div ref={ref}>
      <h4 className="font-display font-bold text-3xl text-brand-green mb-1">
        {displayValue.toLocaleString()}{suffix}
      </h4>
      <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}

export function AboutUs() {
  return (
    <section id="about" className="py-32 bg-brand-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Main Info Block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7 bento-card flex flex-col justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-black uppercase tracking-widest mb-8 self-start">
              <Leaf size={14} />
              <span>The Philosophy</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-display font-bold text-brand-dark leading-[1.05] mb-8">
              Nutrition simplified. <br />
              <span className="text-brand-green italic">Gourmet</span> delivered.
            </h2>
            
            <div className="space-y-6 max-w-2xl">
              <p className="text-lg text-slate-600 leading-relaxed">
                Eat Right Feel Light (ERF) was born from a simple belief: that eating healthy shouldn't feel like a compromise. In the heart of Port Harcourt, we've redefined the ritual of the daily meal.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed font-medium">
                We bridge the gap between "fast food" and "functional nutrition," delivering chef-crafted, calorie-controlled dishes that respect both your palate and your performance.
              </p>
            </div>

            <div className="mt-12 flex flex-wrap gap-12 pt-12 border-t border-slate-100">
              <StatCounter value={5000} suffix="+" label="Daily Deliveries" />
              <StatCounter value={1200} suffix="+" label="Elite Members" />
            </div>
          </motion.div>

          {/* Visual Block */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-5 relative group"
          >
            <div className="h-full min-h-[400px] rounded-[3rem] overflow-hidden shadow-2xl relative">
              <img 
                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=1000" 
                alt="Our Kitchen" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-brand-dark/20 group-hover:bg-brand-dark/10 transition-colors duration-700" />
              
              <div className="absolute top-8 left-8 right-8">
                <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-green rounded-xl flex items-center justify-center text-white shrink-0">
                    <Target size={24} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-brand-dark">Precision Prep</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Every gram counted</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 left-8 right-8">
                <button className="w-full py-4 bg-white text-brand-dark font-black uppercase text-[10px] tracking-[0.2em] rounded-full hover:bg-brand-green hover:text-white transition-all duration-300 shadow-xl">
                  Explore Our Craft
                </button>
              </div>
            </div>
          </motion.div>

          {/* Core Values Grid */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {[
              {
                icon: <Target size={24} />,
                title: "Maximum Bioavailability",
                desc: "We source ingredients specifically for their nutrient density and freshness, ensuring your body gets exactly what it needs."
              },
              {
                icon: <Users size={24} />,
                title: "Farmer First Sourcing",
                desc: "100% of our organic produce comes from verified local farms in Rivers State, supporting our local ecosystem."
              },
              {
                icon: <Leaf size={24} />,
                title: "Zero Filler Policy",
                desc: "No preservatives, no excess sodium, no hidden sugars. Just real food prepared with real integrity."
              }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bento-card !p-10"
              >
                <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center mb-8 text-brand-green">
                  {item.icon}
                </div>
                <h3 className="font-display font-bold text-2xl mb-4 text-brand-dark">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
