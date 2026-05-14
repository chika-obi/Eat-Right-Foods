import { Instagram, Twitter, Phone, Mail, MapPin, Clock, Leaf } from 'lucide-react';
import { CONTACT_INFO } from '../constants';
import logo from '../assets/images/EatRight_logo.jfif';

export function Footer() {
  return (
    <footer id="contact" className="bg-[#050505] text-white pt-32 pb-12 overflow-hidden relative">
      <div className="absolute top-0 right-0 opacity-[0.03] pointer-events-none">
        <Leaf size={600} className="text-brand-green translate-x-1/3 -translate-y-1/3" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 mb-24">
          
          {/* Brand Block */}
          <div className="lg:col-span-4 space-y-10">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex items-center gap-4 group cursor-pointer"
            >
              <div className="bg-white p-1 rounded-2xl shadow-2xl overflow-hidden transform group-hover:scale-110 transition-all duration-700">
                <img 
                  src={logo} 
                  alt="Eat Right Logo" 
                  className="h-16 w-auto object-contain" 
                />
              </div>
              <div>
                <h3 className="font-display font-medium text-3xl tracking-tighter leading-none">
                  Eat<span className="text-brand-green">Right</span>
                </h3>
                <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em] mt-1.5">Gourmet Wellness</p>
              </div>
            </a>
            
            <p className="text-slate-500 text-lg leading-relaxed font-medium">
              We've redefined the ritual of the daily meal in Port Harcourt. Precision nutrition, chef-crafted, delivered.
            </p>

            <div className="flex gap-4">
              <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-green hover:text-white transition-all group">
                <Instagram size={20} className="group-hover:scale-110 transition-transform" />
              </a>
              <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-green hover:text-white transition-all group">
                <Twitter size={20} className="group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-1 hidden lg:block" />

          {/* Links */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-green mb-10">Navigation</h4>
            <ul className="space-y-6 text-slate-400 text-xs font-black uppercase tracking-widest">
              <li><a href="#menu" className="hover:text-white transition-colors">The Menu</a></li>
              <li><a href="#track" className="hover:text-white transition-colors">Order Status</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">Our Ethos</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Direct Line</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-green mb-10">Concierge</h4>
            <ul className="space-y-6 text-slate-400 text-xs font-black tracking-widest uppercase">
              <li className="flex flex-col gap-2">
                <span className="text-[8px] text-slate-600">Location</span>
                <span className="text-white normal-case font-medium">{CONTACT_INFO.address}</span>
              </li>
              <li className="flex flex-col gap-2">
                <span className="text-[8px] text-slate-600">WhatsApp</span>
                <span className="text-white normal-case font-medium">{CONTACT_INFO.whatsappDisplay}</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div className="lg:col-span-3">
             <div className="glass-card !bg-white/[0.02] border-white/5 rounded-[2rem] p-8">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-green mb-6">Service Window</h4>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                      <span className="text-slate-500">Mon — Sat</span>
                      <span className="text-white">08:00 — 20:00</span>
                   </div>
                   <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                      <span className="text-slate-500">Sunday</span>
                      <span className="text-brand-red opacity-50">Inactive</span>
                   </div>
                </div>
                <div className="mt-8 pt-8 border-t border-white/5">
                   <p className="text-[9px] text-slate-600 uppercase font-black leading-relaxed">
                      Pre-orders for Monday delivery close Saturday at 18:00
                   </p>
                </div>
             </div>
          </div>

        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-600 text-[9px] uppercase font-black tracking-widest">© 2024 Eat Right Foods. Crafted for High Performance.</p>
          <div className="flex gap-10">
            <a href="#" className="text-slate-600 hover:text-white transition-colors text-[9px] uppercase font-black tracking-widest">Privacy</a>
            <a href="#" className="text-slate-600 hover:text-white transition-colors text-[9px] uppercase font-black tracking-widest">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
