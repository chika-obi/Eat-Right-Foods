import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, CreditCard, Plus, Trash2, Home, Briefcase, PlusCircle, CheckCircle2, User, History, Package, ChevronRight, ExternalLink, ShieldCheck, RotateCw, ShoppingCart, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { doc, updateDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Address, PaymentMethod, Order, Product } from '../types';
import { cn } from '../lib/utils';
import { OrderReceipt } from './OrderReceipt';
import { AdminPanel } from './AdminPanel';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
  onAdminClick: () => void;
  products?: Product[];
}

export function ProfileDrawer({ isOpen, onClose, onAddToCart, onAdminClick, products }: ProfileDrawerProps) {
  const { profile, user, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'addresses' | 'payments' | 'orders'>('addresses');
  const [showAddAddress, setShowAddAddress] = React.useState(false);
  const [editingAddressId, setEditingAddressId] = React.useState<string | null>(null);
  const [showAddPayment, setShowAddPayment] = React.useState(false);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);

  const [orders, setOrders] = React.useState<Order[]>([]);

  React.useEffect(() => {
    if (!profile) return;
    const ordersRef = collection(db, 'profiles', profile.id, 'orders');
    const q = query(ordersRef, orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => {
        const data = doc.data() as Order;
        return { ...data, id: doc.id, orderNumber: data.id || doc.id } as Order;
      }));
    }, (err) => {
      // Only report if we are still authenticated as this profile user
      if (auth.currentUser?.uid === profile.id) {
        handleFirestoreError(err, OperationType.GET, `profiles/${profile.id}/orders`);
      }
    });
    return () => unsubscribe();
  }, [profile]);

  // Form states
  const [newAddress, setNewAddress] = React.useState({ label: '', street: '', city: '', state: '' });
  const [newCard, setNewCard] = React.useState({ brand: 'Visa', last4: '', expiry: '' });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'preparing': return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'dispatched': return 'bg-orange-100 text-orange-700 border border-orange-200';
      default: return 'bg-slate-100 text-slate-500 border border-slate-200';
    }
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      if (editingAddressId) {
        const updatedAddresses = profile.addresses.map(addr => 
          addr.id === editingAddressId ? { ...addr, ...newAddress } : addr
        );
        await updateDoc(doc(db, 'profiles', profile.id), {
          addresses: updatedAddresses
        });
        setEditingAddressId(null);
      } else {
        const address: Address = {
          id: `addr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          ...newAddress,
          isDefault: profile.addresses.length === 0,
        };
        await updateDoc(doc(db, 'profiles', profile.id), {
          addresses: [...profile.addresses, address]
        });
      }
      setShowAddAddress(false);
      setNewAddress({ label: '', street: '', city: '', state: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${profile.id}`);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!profile) return;
    try {
      const updatedAddresses = profile.addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      }));
      await updateDoc(doc(db, 'profiles', profile.id), {
        addresses: updatedAddresses
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${profile.id}`);
    }
  };

  const handleEditAddress = (addr: Address) => {
    setNewAddress({
      label: addr.label,
      street: addr.street,
      city: addr.city,
      state: addr.state
    });
    setEditingAddressId(addr.id);
    setShowAddAddress(true);
  };

  const handleRemoveAddress = async (id: string) => {
    if (!profile) return;
    try {
      await updateDoc(doc(db, 'profiles', profile.id), {
        addresses: profile.addresses.filter(a => a.id !== id)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${profile.id}`);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      const card: PaymentMethod = {
        id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'card',
        ...newCard,
        isDefault: profile.paymentMethods.length === 0,
      };
      await updateDoc(doc(db, 'profiles', profile.id), {
        paymentMethods: [...profile.paymentMethods, card]
      });
      setShowAddPayment(false);
      setNewCard({ brand: 'Visa', last4: '', expiry: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${profile.id}`);
    }
  };

  const handleRemovePayment = async (id: string) => {
    if (!profile) return;
    try {
      await updateDoc(doc(db, 'profiles', profile.id), {
        paymentMethods: profile.paymentMethods.filter(p => p.id !== id)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${profile.id}`);
    }
  };

  const handleReorderItem = (productId: string) => {
    if (!onAddToCart || !products) return;
    const product = products.find(p => p.id === productId);
    if (product) {
      onAddToCart(product);
    }
  };

  const handleReorderAll = (order: Order) => {
    if (!onAddToCart || !products) return;
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        // We add it multiple times based on quantity? 
        // Actually handleAddToCart usually adds 1. 
        // Let's just add it correctly.
        for(let i = 0; i < item.quantity; i++) {
          onAddToCart(product);
        }
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-slate-900">{profile?.displayName || 'User Profile'}</h2>
                  <p className="text-sm text-slate-500">{profile?.email}</p>
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        onAdminClick();
                        onClose();
                      }}
                      className="mt-2 flex items-center gap-2 px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-black transition-colors"
                    >
                      <ShieldCheck size={12} /> Admin Dashboard
                    </button>
                  )}
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setActiveTab('addresses')}
                className={cn(
                  "flex-1 py-4 text-sm font-bold transition-all border-b-2",
                  activeTab === 'addresses' ? "border-brand-green text-brand-green" : "border-transparent text-slate-400"
                )}
              >
                Addresses
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={cn(
                  "flex-1 py-4 text-sm font-bold transition-all border-b-2",
                  activeTab === 'payments' ? "border-brand-green text-brand-green" : "border-transparent text-slate-400"
                )}
              >
                Payments
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={cn(
                  "flex-1 py-4 text-sm font-bold transition-all border-b-2",
                  activeTab === 'orders' ? "border-brand-green text-brand-green" : "border-transparent text-slate-400"
                )}
              >
                Orders
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {activeTab === 'addresses' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-lg">My Addresses</h3>
                    <button 
                      onClick={() => {
                        setShowAddAddress(!showAddAddress);
                        if (showAddAddress) {
                          setEditingAddressId(null);
                          setNewAddress({ label: '', street: '', city: '', state: '' });
                        }
                      }}
                      className="text-brand-green flex items-center gap-1 text-sm font-bold hover:underline"
                    >
                      <PlusCircle size={18} /> {editingAddressId ? 'Cancel Edit' : 'Add New'}
                    </button>
                  </div>

                  {showAddAddress && (
                    <motion.form 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleAddAddress}
                      className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3"
                    >
                      <input 
                        placeholder="Label (e.g. Home, Office)"
                        value={newAddress.label}
                        onChange={e => setNewAddress({...newAddress, label: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-green/20"
                        required
                      />
                      <input 
                        placeholder="Street Address"
                        value={newAddress.street}
                        onChange={e => setNewAddress({...newAddress, street: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-green/20"
                        required
                      />
                      <div className="flex gap-2">
                        <input 
                          placeholder="City"
                          value={newAddress.city}
                          onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-green/20"
                          required
                        />
                        <input 
                          placeholder="State"
                          value={newAddress.state}
                          onChange={e => setNewAddress({...newAddress, state: e.target.value})}
                          className="w-24 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-green/20"
                          required
                        />
                      </div>
                      <button type="submit" className="w-full bg-brand-green text-white py-2 rounded-xl font-bold text-sm">
                        {editingAddressId ? 'Update Address' : 'Save Address'}
                      </button>
                    </motion.form>
                  )}

                  <div className="space-y-4">
                    {profile?.addresses.length === 0 && !showAddAddress ? (
                      <p className="text-center py-8 text-slate-400 italic text-sm">No addresses saved yet.</p>
                    ) : (
                      profile?.addresses.map(addr => (
                        <div key={addr.id} className={cn(
                          "p-4 rounded-2xl border-2 transition-all flex items-start gap-4",
                          addr.isDefault ? "border-brand-green bg-brand-green/5" : "border-slate-100 bg-white"
                        )}>
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            addr.isDefault ? "bg-brand-green text-white" : "bg-slate-100 text-slate-500"
                          )}>
                            {addr.label.toLowerCase() === 'home' ? <Home size={18} /> : 
                             addr.label.toLowerCase() === 'office' ? <Briefcase size={18} /> : 
                             <MapPin size={18} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-sm truncate">{addr.label}</p>
                              {addr.isDefault && <CheckCircle2 size={14} className="text-brand-green" />}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-2">{addr.street}, {addr.city}, {addr.state}</p>
                            <div className="flex items-center gap-3">
                              {!addr.isDefault && (
                                <button 
                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                  className="text-[10px] font-bold text-brand-green hover:underline"
                                >
                                  Set as Default
                                </button>
                              )}
                              <button 
                                onClick={() => handleEditAddress(addr)}
                                className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveAddress(addr.id)}
                            className="text-slate-300 hover:text-brand-red transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : activeTab === 'payments' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-lg">Payment Methods</h3>
                    <button 
                      onClick={() => setShowAddPayment(!showAddPayment)}
                      className="text-brand-green flex items-center gap-1 text-sm font-bold hover:underline"
                    >
                      <PlusCircle size={18} /> Add New
                    </button>
                  </div>

                  {showAddPayment && (
                    <motion.form 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleAddPayment}
                      className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3"
                    >
                      <select 
                        value={newCard.brand}
                        onChange={e => setNewCard({...newCard, brand: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-green/20"
                      >
                        <option>Visa</option>
                        <option>Mastercard</option>
                        <option>Verve</option>
                      </select>
                      <input 
                        placeholder="Last 4 Digits"
                        maxLength={4}
                        value={newCard.last4}
                        onChange={e => setNewCard({...newCard, last4: e.target.value.replace(/\D/g, '')})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-green/20"
                        required
                      />
                      <input 
                        placeholder="Expiry (MM/YY)"
                        value={newCard.expiry}
                        onChange={e => setNewCard({...newCard, expiry: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-green/20"
                        required
                      />
                      <p className="text-[10px] text-slate-400 italic">* This is a demo. We do not store full card details.</p>
                      <button type="submit" className="w-full bg-brand-green text-white py-2 rounded-xl font-bold text-sm">
                        Save Payment Method
                      </button>
                    </motion.form>
                  )}

                  <div className="space-y-4">
                    {profile?.paymentMethods.length === 0 && !showAddPayment ? (
                      <p className="text-center py-8 text-slate-400 italic text-sm">No payment methods saved.</p>
                    ) : (
                      profile?.paymentMethods.map(pm => (
                        <div key={pm.id} className={cn(
                          "p-4 rounded-2xl border-2 transition-all flex items-center gap-4",
                          pm.isDefault ? "border-brand-green bg-brand-green/5" : "border-slate-100 bg-white"
                        )}>
                          <div className={cn(
                            "w-12 h-8 rounded-lg flex items-center justify-center text-[10px] font-black italic",
                            pm.brand.toLowerCase() === 'visa' ? "bg-blue-600 text-white" : 
                            pm.brand.toLowerCase() === 'mastercard' ? "bg-orange-500 text-white" : 
                            "bg-brand-red text-white"
                          )}>
                            {pm.brand.toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm">•••• •••• •••• {pm.last4}</p>
                              {pm.isDefault && <CheckCircle2 size={14} className="text-brand-green" />}
                            </div>
                            <p className="text-xs text-slate-500">Expires {pm.expiry}</p>
                          </div>
                          <button 
                            onClick={() => handleRemovePayment(pm.id)}
                            className="text-slate-300 hover:text-brand-red transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-lg">Order History</h3>
                    <div className="bg-brand-green/10 p-1.5 rounded-lg">
                      <History size={16} className="text-brand-green" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                          <Package size={32} />
                        </div>
                        <p className="text-slate-400 italic text-sm">No orders found.</p>
                      </div>
                    ) : (
                      orders.map(order => (
                        <div key={order.id} className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-black text-xs text-slate-400 uppercase tracking-widest mb-1">{order.orderNumber || order.id}</p>
                              <p className="font-bold text-sm">{new Date(order.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                              getStatusColor(order.status)
                            )}>
                              {order.status}
                            </span>
                          </div>

                          <div className="flex items-end justify-between">
                            <div className="space-y-1">
                              <p className="text-xs text-slate-500">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
                              <p className="font-display font-bold text-brand-green">₦{order.total.toLocaleString()}</p>
                            </div>
                            <button 
                              onClick={() => setSelectedOrderId(order.id)}
                              className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-brand-green transition-colors"
                            >
                              Details <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Order Detail Modal Overlay */}
            <AnimatePresence>
              {selectedOrderId && selectedOrder && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white z-[120] flex flex-col"
                >
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <button onClick={() => setSelectedOrderId(null)} className="p-2 hover:bg-slate-100 rounded-full">
                      <ChevronRight className="rotate-180" size={24} />
                    </button>
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Order Details</p>
                      <h3 className="font-display font-bold">{selectedOrder.orderNumber || selectedOrder.id}</h3>
                    </div>
                    <button 
                      onClick={() => setIsReceiptOpen(true)}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-brand-green/10 text-brand-green hover:bg-brand-green/20 overflow-hidden"
                      title="View Official Receipt"
                    >
                      <ExternalLink size={20} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm">Status</span>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          getStatusColor(selectedOrder.status)
                        )}>
                          {selectedOrder.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm">Date</span>
                        <span className="font-bold text-sm">{new Date(selectedOrder.date).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm">Delivery</span>
                        <span className="font-bold text-sm capitalize">{selectedOrder.deliveryType}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400">Order Summary</h4>
                      <div className="space-y-3">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={`${selectedOrder.orderNumber || selectedOrder.id}-item-${item.productId}-${idx}`} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 group">
                            <div className="flex-1">
                              <p className="font-bold text-sm">{item.name}</p>
                              <p className="text-xs text-slate-500">x{item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="font-bold text-sm">₦{(item.price * item.quantity).toLocaleString()}</p>
                              <button 
                                onClick={() => handleReorderItem(item.productId)}
                                className="w-8 h-8 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-green hover:text-white"
                                title="Reorder this meal"
                              >
                                <RotateCw size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                       <button 
                        onClick={() => handleReorderAll(selectedOrder)}
                        className="w-full bg-brand-green/10 hover:bg-brand-green/20 text-brand-green py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                       >
                         <ShoppingCart size={16} />
                         Reorder All Items
                       </button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400">Delivery Address</h4>
                      <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <MapPin size={18} className="text-brand-green mt-0.5" />
                        <p className="text-sm text-slate-600 italic">"{selectedOrder.address}"</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6 space-y-3">
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span>₦{selectedOrder.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Delivery Fee</span>
                        <span>₦{selectedOrder.deliveryFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-display font-bold text-lg pt-2">
                        <span>Total Paid</span>
                        <span className="text-brand-green">₦{selectedOrder.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <button 
                      onClick={() => setSelectedOrderId(null)}
                      className="w-full bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold text-sm"
                    >
                      Back to History
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
               <button 
                onClick={onClose}
                className="flex-1 border-2 border-slate-200 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors"
               >
                 Close
               </button>
               <button 
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="px-6 border-2 border-brand-red/20 text-brand-red py-3 rounded-xl font-bold text-sm hover:bg-brand-red hover:text-white transition-all flex items-center justify-center gap-2"
               >
                 <LogOut size={16} />
                 Logout
               </button>
            </div>
          </motion.div>
        </>
      )}
      
      {selectedOrder && (
        <OrderReceipt 
          order={selectedOrder}
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}
    </AnimatePresence>
  );
}
