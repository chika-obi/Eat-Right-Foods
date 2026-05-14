import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Download, Share2, CheckCircle2 } from 'lucide-react';
import { Order } from '../types';
import { cn } from '../lib/utils';

interface OrderReceiptProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderReceipt({ order, isOpen, onClose }: OrderReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Action Bar */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrint}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-brand-green/10 text-brand-green hover:bg-brand-green/20 transition-colors"
                >
                  <Printer size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 font-mono text-[13px] leading-relaxed text-slate-700 bg-white print:p-0 select-none">
              {/* Receipt Header */}
              <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-green text-white mb-2 rotate-3">
                  <CheckCircle2 size={24} />
                </div>
                <h2 className="font-display font-black text-xl tracking-tight text-slate-900 uppercase">Eat Right Foods</h2>
                <p className="text-[10px] text-slate-400 font-sans font-bold">PORT HARCOURT, NIGERIA</p>
                <div className="pt-4 flex flex-col items-center">
                   <div className="h-px w-full border-t border-dashed border-slate-200 my-2" />
                   <p className="font-bold text-slate-900">OFFICIAL RECEIPT</p>
                   <div className="h-px w-full border-t border-dashed border-slate-200 my-2" />
                </div>
              </div>

              {/* Order Metadata */}
              <div className="space-y-1 mb-8">
                <div className="flex justify-between">
                  <span>ORDER ID:</span>
                  <span className="font-bold text-slate-900">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span className="font-bold text-slate-900">{new Date(order.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>TIME:</span>
                  <span className="font-bold text-slate-900">{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>STATUS:</span>
                  <span className="font-bold text-brand-green uppercase">{order.status}</span>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between font-bold text-slate-400 pb-1 border-b border-slate-100">
                  <span>ITEM / QTY</span>
                  <span>PRICE</span>
                </div>
                {order.items.map((item, idx) => (
                  <div key={`${order.id}-receipt-item-${item.productId}-${idx}`} className="space-y-0.5">
                    <div className="flex justify-between items-start">
                      <span className="text-slate-900 font-bold max-w-[200px] truncate">{item.name}</span>
                      <span className="font-bold text-slate-900">₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ₦{item.price.toLocaleString()} x {item.quantity}
                    </div>
                  </div>
                ))}
                <div className="h-px w-full border-t border-dashed border-slate-200 mt-4" />
              </div>

              {/* Totals Section */}
              <div className="space-y-2 mb-8">
                <div className="flex justify-between text-slate-500">
                  <span>SUBTOTAL</span>
                  <span>₦{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>DELIVERY FEE</span>
                  <span>₦{order.deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-lg text-slate-900 pt-2">
                  <span>TOTAL PAID</span>
                  <span>₦{order.total.toLocaleString()}</span>
                </div>
                <div className="h-px w-full border-t border-dashed border-slate-200 mt-4" />
              </div>

              {/* Delivery Info */}
              <div className="space-y-3 mb-10">
                <p className="text-center font-bold text-slate-400 text-[10px]">DELIVERY DETAILS</p>
                <div className="bg-slate-50 p-4 rounded-2xl italic text-center leading-relaxed">
                  "{order.address}"
                </div>
                <div className="flex justify-center gap-2 text-[10px] uppercase font-bold text-slate-400">
                  <span>•</span>
                  <span>{order.deliveryType} Delivery</span>
                  <span>•</span>
                </div>
              </div>

              {/* Barcode-ish Footer */}
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex gap-0.5 items-end justify-center h-8">
                  {[...Array(40)].map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "bg-slate-200",
                        Math.random() > 0.5 ? "w-px h-6" : Math.random() > 0.3 ? "w-[1.5px] h-8" : "w-[2px] h-5"
                      )} 
                    />
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">THANK YOU FOR THE SUPPORT!</p>
                  <p className="text-[10px] text-brand-green font-sans font-black">EAT HEALTHY. LIVE BETTER.</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 mt-auto">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-brand-green text-white rounded-2xl font-display font-black text-sm shadow-xl shadow-brand-green/20 active:scale-[0.98] transition-all"
              >
                CLOSE RECEIPT
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
