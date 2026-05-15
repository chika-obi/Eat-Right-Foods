import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Plus, Minus, Send, Truck, Zap, Calendar, Clock, MapPin, CreditCard, ChevronDown, AlertCircle } from 'lucide-react';
import { CartItem, Address, PaymentMethod } from '../types';
import { CONTACT_INFO, DELIVERY_OPTIONS } from '../constants';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

export function CartDrawer({ isOpen, onClose, items, onUpdateQuantity, onRemove }: CartDrawerProps) {
  const { profile } = useAuth();
  const [step, setStep] = React.useState<'cart' | 'receipt'>('cart');
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [selectedDelivery, setSelectedDelivery] = React.useState(DELIVERY_OPTIONS[0]);
  const [scheduledDate, setScheduledDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = React.useState('12:00');
  const [deliveryAddress, setDeliveryAddress] = React.useState('');
  const [selectedAddressId, setSelectedAddressId] = React.useState<string>('');
  const [selectedPaymentId, setSelectedPaymentId] = React.useState<string>('');

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + selectedDelivery.price;
  const addressError = !deliveryAddress.trim();

  // Initialize from profile defaults
  React.useEffect(() => {
    if (profile) {
      const defaultAddr = profile.addresses.find(a => a.isDefault) || profile.addresses[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setDeliveryAddress(`${defaultAddr.street}, ${defaultAddr.city}, ${defaultAddr.state}`);
      }
      const defaultPM = profile.paymentMethods.find(p => p.isDefault) || profile.paymentMethods[0];
      if (defaultPM) {
        setSelectedPaymentId(defaultPM.id);
      }
    }
  }, [profile]);

  const handleWhatsAppCheckout = async () => {
    const schedulingInfo = selectedDelivery.id === 'scheduled' 
      ? `\n\nScheduled for: ${scheduledDate} at ${scheduledTime}`
      : '';

    const paymentInfo = selectedPaymentId && profile 
      ? `\n\nPayment Method: Saved ${profile.paymentMethods.find(p => p.id === selectedPaymentId)?.brand} card (•••• ${profile.paymentMethods.find(p => p.id === selectedPaymentId)?.last4})`
      : '\n\nPayment Method: Pay on Delivery';

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;

    const message = encodeURIComponent(
      `Hello Eat Right Foods! I'd like to place an order (ID: ${orderId}):\n\n` +
      items.map(item => `- ${item.name} x${item.quantity} (₦${(item.price * item.quantity).toLocaleString()})`).join('\n') +
      `\n\nDelivery Method: ${selectedDelivery.label} (₦${selectedDelivery.price.toLocaleString()})` +
      schedulingInfo +
      `\n\nTotal: ₦${total.toLocaleString()}\n\nDelivery Address: ${deliveryAddress}` +
      paymentInfo
    );

    // Save order to Firestore if user is logged in
    if (auth.currentUser) {
      try {
        const orderData = {
          id: orderId,
          date: new Date().toISOString(),
          items: items.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          subtotal,
          deliveryFee: selectedDelivery.price,
          total,
          status: 'pending',
          address: deliveryAddress,
          deliveryType: selectedDelivery.id
        };
        await setDoc(doc(db, 'profiles', auth.currentUser.uid, 'orders', orderId), orderData);
      } catch (err) {
        console.error("Failed to save order history:", err);
      }
    }

    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${message}`, '_blank');
    setShowSuccess(true);
  };

  const getDeliveryIcon = (id: string) => {
    switch (id) {
      case 'express': return <Zap size={18} />;
      case 'scheduled': return <Calendar size={18} />;
      default: return <Truck size={18} />;
    }
  };

  const getEstimatedTime = () => {
    switch (selectedDelivery.id) {
      case 'express': return 'Within 20 mins';
      case 'scheduled': return `${scheduledDate} @ ${scheduledTime}`;
      default: return '30-45 mins';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
          />
          
          {/* drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-bottom flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                {step === 'receipt' ? (
                  <button 
                    onClick={() => setStep('cart')}
                    className="p-2 -ml-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                  >
                    <ChevronDown size={24} className="rotate-90" />
                  </button>
                ) : (
                  <div className="bg-brand-green p-2 rounded-xl text-white">
                    <ShoppingBag size={20} />
                  </div>
                )}
                <h2 className="font-display font-bold text-xl">
                  {step === 'cart' ? 'Your Order' : 'Review Receipt'}
                </h2>
              </div>
              <button 
                onClick={() => {
                  onClose();
                  setTimeout(() => {
                    setStep('cart');
                    setShowSuccess(false);
                  }, 300);
                }} 
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {showSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-6 p-4"
                >
                  <div className="w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green animate-bounce">
                    <Send size={48} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-display font-bold text-2xl text-slate-900">Order Sent Successfully!</h2>
                    <p className="text-slate-500 leading-relaxed">
                      We've redirected you to WhatsApp to finalize your order. Our team is ready to serve you!
                    </p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 w-full">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">What's Next?</p>
                    <ul className="text-sm text-slate-600 space-y-3 text-left">
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">1</div>
                        <span>Send the pre-filled message on WhatsApp.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">2</div>
                        <span>Our rep will confirm your delivery address and total.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">3</div>
                        <span>Relaxes while we prepare your fresh meal!</span>
                      </li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => {
                      onClose();
                      setTimeout(() => {
                        setShowSuccess(false);
                        setStep('cart');
                      }, 300);
                    }}
                    className="w-full bg-brand-green text-white py-4 rounded-2xl font-bold hover:bg-brand-green/90 transition-all shadow-xl shadow-brand-green/20"
                  >
                    Done
                  </button>
                </motion.div>
              ) : items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <ShoppingBag size={40} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Your cart is empty</h3>
                    <p className="text-sm text-slate-500">Add some healthy meals to get started!</p>
                  </div>
                  <a 
                    href="#menu"
                    onClick={onClose}
                    className="text-brand-green font-bold text-sm hover:underline"
                  >
                    Start Shopping
                  </a>
                </div>
              ) : step === 'receipt' ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-100 rounded-[2rem] p-8 font-mono text-sm leading-relaxed shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-brand-green/20" />
                  
                  {/* Receipt Header */}
                  <div className="text-center space-y-2 mb-8">
                    <h3 className="font-display font-black text-lg tracking-tight uppercase">Order Summary</h3>
                    <div className="h-px w-full border-t border-dashed border-slate-200 my-4" />
                    <p className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-widest">{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>

                  {/* Items List */}
                  <div className="space-y-4 mb-8">
                    {items.map((item) => (
                      <div key={`receipt-${item.id}`} className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate uppercase">{item.name}</p>
                          <p className="text-[10px] text-slate-400">₦{item.price.toLocaleString()} x {item.quantity}</p>
                        </div>
                        <span className="font-bold text-slate-900">₦{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="h-px w-full border-t border-dashed border-slate-200 mt-4" />
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 mb-8">
                    <div className="flex justify-between text-slate-500">
                      <span>SUBTOTAL</span>
                      <span>₦{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>DELIVERY</span>
                      <span>₦{selectedDelivery.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-black text-lg text-slate-900 pt-2 border-t border-slate-50">
                      <span>TOTAL</span>
                      <span className="text-brand-green font-sans">₦{total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="space-y-3 pt-4 border-t border-dashed border-slate-200">
                    <p className="text-center font-bold text-slate-400 text-[10px] tracking-widest">SHIPPING TO</p>
                    <div className="bg-slate-50 p-4 rounded-xl italic text-xs text-center border border-slate-100">
                      "{deliveryAddress}"
                    </div>
                  </div>

                  {/* Zig-zag-ish bottom effect divider could be added here if needed */}
                </motion.div>
              ) : (
                <>
                  <div className="space-y-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                            <button 
                              onClick={() => onRemove(item.id)} 
                              className="text-slate-400 hover:text-brand-red transition-colors group flex items-center gap-1"
                              title="Remove item"
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Remove</span>
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-sm text-brand-green font-bold mb-3">₦{(item.price * item.quantity).toLocaleString()}</p>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-slate-200 rounded-lg p-1 px-2 gap-3">
                              <button 
                                onClick={() => onUpdateQuantity(item.id, -1)}
                                className="text-slate-500 hover:text-brand-green disabled:opacity-30"
                                disabled={item.quantity <= 1}
                              >
                                <Minus size={14} />
                              </button>
                              <input 
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val >= 1) {
                                    onUpdateQuantity(item.id, val - item.quantity);
                                  }
                                }}
                                className="font-bold text-sm w-12 text-center bg-transparent border-none focus:ring-0 p-0"
                              />
                              <button 
                                onClick={() => onUpdateQuantity(item.id, 1)}
                                className="text-slate-500 hover:text-brand-green"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="font-display font-bold text-lg mb-4">Delivery Options</h3>
                    <div className="space-y-3">
                      {DELIVERY_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedDelivery(option)}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                            selectedDelivery.id === option.id 
                              ? "border-brand-green bg-brand-green/5" 
                              : "border-slate-100 hover:border-slate-200 bg-white"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            selectedDelivery.id === option.id ? "bg-brand-green text-white" : "bg-slate-100 text-slate-500"
                          )}>
                            {getDeliveryIcon(option.id)}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm">{option.label}</p>
                            <p className="text-xs text-slate-500">{option.description}</p>
                          </div>
                          <p className="font-bold text-brand-green text-sm">₦{option.price.toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedDelivery.id === 'scheduled' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-6 border-t border-slate-100"
                    >
                      <div className="bg-brand-green/5 border border-brand-green/20 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar size={18} className="text-brand-green" />
                          <h4 className="font-display font-bold text-slate-900">Choose Delivery Slot</h4>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Select Date</label>
                            <input 
                              type="date" 
                              min={new Date().toISOString().split('T')[0]}
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-green/20 outline-none"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Select Time</label>
                            <div className="grid grid-cols-3 gap-2">
                              {['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'].map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setScheduledTime(t)}
                                  className={cn(
                                    "py-2 rounded-lg text-xs font-bold transition-all border",
                                    scheduledTime === t 
                                      ? "bg-brand-green border-brand-green text-white shadow-md shadow-brand-green/20" 
                                      : "bg-white border-slate-200 text-slate-600 hover:border-brand-green/50"
                                  )}
                                >
                                  {parseInt(t) > 12 ? `${parseInt(t)-12} PM` : `${parseInt(t)} AM`}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <p className="text-[10px] text-slate-400 font-medium italic">
                            * Delivery available between 8:00 AM and 8:00 PM local time.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            {items.length > 0 && !showSuccess && (
              <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
                {step === 'cart' ? (
                  <>
                    <div className="flex justify-between items-center text-slate-500 text-sm">
                      <span>Subtotal</span>
                      <span>₦{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 text-sm">
                      <span>Delivery Fee</span>
                      <span>₦{selectedDelivery.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-y border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Clock size={16} className="text-brand-green" />
                        <span>Est. Arrival</span>
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{getEstimatedTime()}</span>
                    </div>
                    {selectedDelivery.id === 'scheduled' && (
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-brand-green bg-brand-green/10 px-3 py-1.5 rounded-lg">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> Scheduled</span>
                        <span>{scheduledDate} @ {scheduledTime}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-display font-bold text-xl">Total</span>
                      <span className="font-display font-bold text-2xl text-brand-green">₦{total.toLocaleString()}</span>
                    </div>
                    
                      <div className="pt-2 space-y-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                            <MapPin size={12} className="text-brand-green" /> Delivery Address
                          </label>
                          
                          {profile && profile.addresses.length > 0 ? (
                            <div className="space-y-2 mb-3">
                              <div className="grid grid-cols-1 gap-2">
                                {profile.addresses.map(addr => (
                                  <button
                                    key={addr.id}
                                    onClick={() => {
                                      setSelectedAddressId(addr.id);
                                      setDeliveryAddress(`${addr.street}, ${addr.city}, ${addr.state}`);
                                    }}
                                    className={cn(
                                      "text-left p-3 rounded-xl border-2 transition-all text-xs",
                                      selectedAddressId === addr.id ? "border-brand-green bg-brand-green/5" : "border-slate-100"
                                    )}
                                  >
                                    <p className="font-bold mb-0.5">{addr.label}</p>
                                    <p className="text-slate-500 line-clamp-1">{addr.street}, {addr.city}</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <textarea 
                            value={deliveryAddress}
                            onChange={(e) => {
                              setDeliveryAddress(e.target.value);
                              setSelectedAddressId('');
                            }}
                            placeholder="Enter your street address, apartment, or landmark in Port Harcourt..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-green/20 outline-none min-h-[80px] resize-none"
                            required
                          />
                        </div>
 
                        {/* Payment Method Section */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                            <CreditCard size={14} className="text-brand-green" /> Payment Method
                          </label>
                          <div className={cn(
                            "grid gap-2",
                            profile && profile.paymentMethods.length > 0 ? "grid-cols-2" : "grid-cols-1"
                          )}>
                            <button
                              type="button"
                              onClick={() => setSelectedPaymentId('')}
                              className={cn(
                                "p-4 rounded-2xl border-2 transition-all text-left group relative overflow-hidden",
                                selectedPaymentId === '' 
                                  ? "border-brand-green bg-brand-green/5" 
                                  : "border-slate-100 bg-white hover:border-slate-200"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                  selectedPaymentId === '' ? "bg-brand-green text-white" : "bg-slate-100 text-slate-400"
                                )}>
                                  <Truck size={16} />
                                </div>
                                <div>
                                  <p className={cn(
                                    "font-bold text-xs uppercase tracking-wider",
                                    selectedPaymentId === '' ? "text-brand-green" : "text-slate-900"
                                  )}>Pay on Delivery</p>
                                  <p className="text-[10px] text-slate-500 font-medium">Cash or Transfer</p>
                                </div>
                              </div>
                              {selectedPaymentId === '' && (
                                <div className="absolute top-0 right-0 p-2">
                                  <div className="w-2 h-2 rounded-full bg-brand-green" />
                                </div>
                              )}
                            </button>

                            {profile && profile.paymentMethods.map(pm => (
                              <button
                                key={pm.id}
                                type="button"
                                onClick={() => setSelectedPaymentId(pm.id)}
                                className={cn(
                                  "p-4 rounded-2xl border-2 transition-all text-left group relative overflow-hidden",
                                  selectedPaymentId === pm.id 
                                    ? "border-brand-green bg-brand-green/5" 
                                    : "border-slate-100 bg-white hover:border-slate-200"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                    selectedPaymentId === pm.id ? "bg-brand-green text-white" : "bg-slate-100 text-slate-400"
                                  )}>
                                    <CreditCard size={16} />
                                  </div>
                                  <div>
                                    <p className={cn(
                                      "font-bold text-xs uppercase tracking-wider",
                                      selectedPaymentId === pm.id ? "text-brand-green" : "text-slate-900"
                                    )}>•••• {pm.last4}</p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase">{pm.brand}</p>
                                  </div>
                                </div>
                                {selectedPaymentId === pm.id && (
                                  <div className="absolute top-0 right-0 p-2">
                                    <div className="w-2 h-2 rounded-full bg-brand-green" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                    {addressError && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-brand-red/5 border border-brand-red/20 rounded-xl p-3 flex items-start gap-2 mb-2"
                      >
                        <AlertCircle size={16} className="text-brand-red shrink-0 mt-0.5" />
                        <p className="text-xs font-medium text-brand-red">
                          A delivery address is required to review your order.
                        </p>
                      </motion.div>
                    )}

                    <button 
                      onClick={() => setStep('receipt')}
                      disabled={addressError}
                      className="w-full bg-brand-green hover:bg-brand-green/90 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-shadow shadow-lg shadow-brand-green/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Review Order Summary
                      <ChevronDown size={20} className="-rotate-90" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-brand-green/5 p-4 rounded-2xl border border-brand-green/10 flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center text-white shrink-0">
                        <Send size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-tighter">Ready to Checkout?</p>
                        <p className="text-[10px] text-slate-500">Your order will be sent to our team via WhatsApp.</p>
                      </div>
                    </div>

                    <div className="space-y-2 py-4 border-t border-slate-200 mb-4">
                      <div className="flex justify-between items-center text-slate-500 text-sm">
                        <span>Subtotal</span>
                        <span className="font-medium text-slate-900">₦{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500 text-sm">
                        <span>Delivery Fee ({selectedDelivery.label})</span>
                        <span className="font-medium text-slate-900">₦{selectedDelivery.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
                        <span className="font-display font-bold text-lg text-slate-900">Total Amount</span>
                        <span className="font-display font-bold text-xl text-brand-green">₦{total.toLocaleString()}</span>
                      </div>
                    </div>

                    {addressError && (
                      <div className="bg-brand-red/5 border border-brand-red/20 rounded-xl p-3 flex items-start gap-2 mb-4">
                        <AlertCircle size={16} className="text-brand-red shrink-0 mt-0.5" />
                        <p className="text-xs font-medium text-brand-red">
                          Invalid delivery address. Please go back and provide a valid address.
                        </p>
                      </div>
                    )}

                    <button 
                      onClick={handleWhatsAppCheckout}
                      disabled={addressError}
                      className="w-full bg-brand-green hover:bg-brand-green/90 text-white py-5 rounded-2xl font-bold flex flex-col items-center justify-center transition-all shadow-xl shadow-brand-green/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center gap-2">
                        <Send size={20} />
                        Confirm & Order on WhatsApp
                      </span>
                      <span className="text-[10px] opacity-70 mt-1 uppercase font-black tracking-[0.2em]">₦{total.toLocaleString()} TOTAL</span>
                    </button>
                    
                    <button 
                      onClick={() => setStep('cart')}
                      className="w-full text-slate-400 font-bold text-xs py-2 hover:text-slate-600 transition-colors"
                    >
                      Go Back to Edit
                    </button>
                  </>
                )}
                
                <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
                  Fastest way to order in Port Harcourt
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
