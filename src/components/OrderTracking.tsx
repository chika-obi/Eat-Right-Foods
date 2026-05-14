import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Package, ChefHat, Bike, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { OrderStatus, OrderTrackingInfo } from '../types';
import { cn } from '../lib/utils';

export function OrderTracking() {
  const [orderId, setOrderId] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [trackingData, setTrackingData] = React.useState<OrderTrackingInfo | null>(null);
  const [error, setError] = React.useState('');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setIsSearching(true);
    setError('');
    
    // Simulate API call
    setTimeout(() => {
      // Mock data logic: Any ID starting with 'ERF' or just digits works for now
      if (orderId.length >= 4) {
        setTrackingData({
          id: orderId.toUpperCase().startsWith('ERF-') ? orderId.toUpperCase() : `ERF-${orderId}`,
          status: 'dispatched',
          estimatedDelivery: '25 - 35 mins',
          items: ['Party Jollof Rice', 'Grilled Chicken Salad'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } else {
        setError('Order ID not found. Please check your confirmation message.');
      }
      setIsSearching(false);
    }, 1200);
  };

  const steps: { status: OrderStatus; label: string; icon: React.ReactNode; desc: string }[] = [
    { status: 'pending', label: 'Order Received', icon: <Package size={20} />, desc: 'We have received your healthy order.' },
    { status: 'preparing', label: 'Preparing', icon: <ChefHat size={20} />, desc: 'Our chefs are crafting your meal with fresh ingredients.' },
    { status: 'dispatched', label: 'On the Way', icon: <Bike size={20} />, desc: 'Your meal is out for delivery across Port Harcourt.' },
    { status: 'delivered', label: 'Delivered', icon: <CheckCircle2 size={20} />, desc: 'Enjoy your delicious, wholesome meal!' },
  ];

  const currentStepIndex = trackingData ? steps.findIndex(s => s.status === trackingData.status) : -1;

  return (
    <section id="track" className="py-24 bg-slate-50 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-display font-bold text-slate-900 mb-4">
            Track Your <span className="text-brand-green italic">Healthy Meal</span>
          </h2>
          <p className="text-slate-500">
            Enter your Order ID (from your WhatsApp confirmation) to see real-time delivery status.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/60 border border-slate-100">
          <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4 mb-10">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Enter Order ID (e.g. ERF-1234)"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all font-medium"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={isSearching}
              className="bg-brand-green hover:bg-brand-green/90 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-green/20 disabled:opacity-50"
            >
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Track Now'
              )}
            </button>
          </form>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-brand-red/10 border border-brand-red/20 text-brand-red p-4 rounded-2xl flex items-center gap-3 text-sm font-medium"
              >
                <AlertCircle size={20} />
                {error}
              </motion.div>
            )}

            {trackingData && !isSearching && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                {/* Order Summary Header */}
                <div className="flex flex-wrap justify-between items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Tracking ID</p>
                    <p className="text-xl font-display font-bold text-slate-900">{trackingData.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Est. Arrival</p>
                    <div className="flex items-center gap-2 text-brand-green font-bold">
                      <Clock size={16} />
                      <span className="text-xl font-display">{trackingData.estimatedDelivery}</span>
                    </div>
                  </div>
                </div>

                {/* Vertical Timeline */}
                <div className="relative space-y-12 pl-4">
                  {/* Progress Line */}
                  <div className="absolute left-[34px] top-4 bottom-4 w-1 bg-slate-100" />
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                    className="absolute left-[34px] top-4 w-1 bg-brand-green transition-all duration-1000 origin-top"
                  />

                  {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isActive = index === currentStepIndex;

                    return (
                      <div key={step.status} className="relative flex gap-8">
                        <div className={cn(
                          "relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500",
                          isCompleted ? "bg-brand-green border-brand-green text-white shadow-lg shadow-brand-green/30" : "bg-white border-slate-100 text-slate-300"
                        )}>
                          {step.icon}
                        </div>
                        
                        <div className="flex-1 pt-1">
                          <h4 className={cn(
                            "font-bold transition-colors",
                            isCompleted ? "text-slate-900" : "text-slate-400"
                          )}>
                            {step.label}
                            {isActive && <span className="ml-3 inline-block w-2 h-2 rounded-full bg-brand-green animate-pulse" />}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Details Mini */}
                <div className="pt-8 border-t border-slate-100">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Inside your package:</h5>
                  <div className="flex flex-wrap gap-2">
                    {trackingData.items.map((item, idx) => (
                      <span key={`${item}-${idx}`} className="px-3 py-1 bg-slate-50 rounded-full text-xs font-medium text-slate-600 border border-slate-100 italic">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
