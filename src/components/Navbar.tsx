import React from 'react';
import { ShoppingBag, Menu, Phone, Instagram, MapPin, LogIn, User, X, ChevronRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle } from '../lib/firebase';
import logo from '../assets/images/EatRight_logo.jfif';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onProfileClick: () => void;
  onAdminClick: () => void;
}

export function Navbar({ cartCount, onCartClick, onProfileClick, onAdminClick }: NavbarProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { user, profile, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 md:px-8",
        isScrolled ? "py-4" : "py-6"
      )}
    >
      <div className={cn(
        "max-w-7xl mx-auto flex items-center justify-between gap-4 transition-all duration-500 rounded-[2rem]",
        isScrolled ? "glass-card px-6 py-2" : "px-0 py-0"
      )}>
        <div className="flex items-center gap-4 shrink-0">
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-3 group"
          >
            <div className="bg-white p-1 rounded-2xl shadow-xl overflow-hidden transform group-hover:scale-110 transition-all duration-500">
               <img 
                 src={logo} 
                 alt="Eat Right Logo" 
                 className="h-10 md:h-12 w-auto object-contain" 
               />
            </div>
            <div>
              <h1 className={cn(
                "font-display font-medium text-xl md:text-2xl tracking-tighter leading-none transition-colors",
                isScrolled ? "text-brand-dark" : "text-white"
              )}>
                Eat<span className={isScrolled ? "text-brand-green" : "text-white opacity-80"}>Right</span>
              </h1>
              <p className={cn(
                "text-[8px] uppercase font-black tracking-[3px] leading-none mt-0.5",
                isScrolled ? "text-slate-400" : "text-white/60"
              )}>
                Gourmet Wellness
              </p>
            </div>
          </a>
        </div>

        <div className="hidden lg:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em]">
          {['Menu', 'Track', 'About', 'Contact'].map((item) => (
            <a 
              key={item} 
              href={item === 'Track' ? '#track' : `#${item.toLowerCase()}`}
              className={cn(
                "hover:text-brand-green transition-all relative group",
                isScrolled ? "text-slate-500" : "text-white/80 hover:text-white"
              )}
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-green transition-all group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3 md:gap-5 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={onAdminClick}
                  className={cn(
                    "hidden xl:flex items-center gap-2 px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] transition-all",
                    isScrolled ? "bg-brand-dark text-white hover:bg-brand-green" : "bg-white/10 text-white backdrop-blur-md hover:bg-white/20 border border-white/20"
                  )}
                >
                  <ShieldCheck size={14} className="text-brand-green" />
                  Console
                </button>
              )}
              <button 
                onClick={onProfileClick}
                className={cn(
                  "flex items-center gap-2 p-1.5 pr-4 rounded-full transition-all duration-300",
                  isScrolled ? "bg-slate-50 border border-slate-100 text-slate-700" : "bg-white/10 border border-white/10 text-white backdrop-blur-md"
                )}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-green ring-2 ring-white/20 shadow-lg">
                  {user.photoURL ? <img src={user.photoURL} alt="" /> : <User size={16} className="m-auto mt-2" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{profile?.displayName?.split(' ')[0] || 'User'}</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signInWithGoogle()}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                isScrolled ? "bg-brand-green text-white shadow-lg shadow-brand-green/20" : "bg-white text-brand-dark"
              )}
            >
              <LogIn size={14} />
              <span className="hidden sm:block">Access</span>
            </button>
          )}

          <button 
            onClick={onCartClick}
            className={cn(
              "relative p-3 rounded-full transition-all duration-500",
              isScrolled ? "bg-brand-dark text-white hover:bg-brand-green" : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-lg border border-white/10"
            )}
            id="cart-button"
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-brand-red text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
          
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-3 text-white bg-brand-green rounded-2xl hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-[280px] bg-white z-50 md:hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-sm bg-brand-green" />
                  </div>
                  <span className="font-display font-bold text-slate-900">MENU</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-2">
                {isAdmin && (
                  <button 
                    onClick={() => {
                      onAdminClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900 text-white font-bold mb-4 shadow-lg shadow-black/20 group"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={18} />
                      <span>Admin Dashboard</span>
                    </div>
                    <ChevronRight size={18} className="text-white/40 group-hover:text-white transition-colors" />
                  </button>
                )}
                {['Menu', 'Track', 'About', 'Contact'].map((item) => (
                  <a 
                    key={item} 
                    href={item === 'Track' ? '#track' : `#${item.toLowerCase()}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 text-slate-700 font-bold hover:bg-brand-green/5 hover:text-brand-green transition-all group"
                  >
                    <span>{item}</span>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-green transition-colors" />
                  </a>
                ))}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50">
                 <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-center">
                   © 2024 Eat Right Nigeria
                 </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
