import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, Sparkles } from 'lucide-react';

export function Newsletter() {
  const [email, setEmail] = React.useState('');
  const [isSubscribed, setIsSubscribed] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section className="py-24 bg-white border-y border-slate-100 overflow-hidden relative">
      {/* Decorative Circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-green/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl saturate-150" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-green/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl saturate-150" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-24 relative overflow-hidden">
          {/* Internal gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-green/10 via-transparent to-transparent opacity-50" />

          <div className="flex-1 space-y-6">
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="inline-flex items-center gap-2 bg-brand-green/20 border border-brand-green/30 px-4 py-1.5 rounded-full text-brand-green text-xs font-bold uppercase tracking-[0.2em]"
            >
              <Sparkles size={14} />
              <span>Newsletter</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl md:text-7xl font-display font-medium text-white leading-[1] tracking-tight"
            >
              Master your <br />
              <span className="text-brand-green italic font-light">Wellness.</span>
            </motion.h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-lg font-medium">
              Join 5,000+ elite Port Harcourt residents receiving our signature health guides and seasonal collection alerts.
            </p>
          </div>

          <div className="w-full lg:w-[450px]">
            <AnimatePresence mode="wait">
              {isSubscribed ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-brand-green/10 border border-brand-green/30 p-8 rounded-3xl text-center space-y-4 backdrop-blur-md"
                >
                  <div className="w-16 h-16 bg-brand-green text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-brand-green/20 rotate-3">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-white">You're in!</h3>
                    <p className="text-slate-400 text-sm">Check your inbox for your 10% welcome discount.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.form 
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="relative group">
                    <input 
                      type="email" 
                      required
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white placeholder-slate-500 outline-none focus:border-brand-green focus:bg-white/10 transition-all duration-300"
                    />
                    <div className="absolute inset-0 rounded-2xl border border-brand-green opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-brand-green hover:bg-brand-green/90 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-brand-green/20 active:scale-[0.98] transition-all"
                  >
                    Subscribe Now
                    <Send size={18} />
                  </button>
                  <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
                    Join the movement for a healthier Nigeria
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
