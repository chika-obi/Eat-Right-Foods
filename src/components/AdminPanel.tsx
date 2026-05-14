import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LayoutDashboard, 
  Utensils, 
  ShoppingBag, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  Search,
  Filter,
  Save,
  Package,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Truck,
  RotateCw,
  Bell,
  Check
} from 'lucide-react';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { collection, doc, onSnapshot, updateDoc, addDoc, deleteDoc, query, orderBy, collectionGroup, getDocs, writeBatch } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Product, Order, OrderStatus } from '../types';
import { cn } from '../lib/utils';
import { PRODUCTS } from '../constants';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab = 'dashboard' | 'menu' | 'orders';

interface AdminNotification {
  id: string;
  type: 'new_order' | 'status_update';
  message: string;
  timestamp: Date;
  read: boolean;
  orderId?: string;
  userId?: string;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { isConfirmedAdmin } = useAuth();
  const [activeTab, setActiveTab] = React.useState<AdminTab>('dashboard');
  const [products, setProducts] = React.useState<Product[]>([]);
  const [orders, setOrders] = React.useState<(Order & { userId: string })[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notifications, setNotifications] = React.useState<AdminNotification[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const isInitialLoad = React.useRef(true);
  
  // Order Filter State
  const [orderStatusFilter, setOrderStatusFilter] = React.useState<OrderStatus | 'all'>('all');
  const [orderDateRange, setOrderDateRange] = React.useState<{ start: string; end: string }>({ start: '', end: '' });
  const [orderSearchQuery, setOrderSearchQuery] = React.useState('');

  // Memoized Filtered Orders
  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
      const matchesSearch = order.id.toLowerCase().includes(orderSearchQuery.toLowerCase());
      
      const orderDate = new Date(order.date);
      const matchesDateRange = (!orderDateRange.start || orderDate >= new Date(orderDateRange.start)) &&
                              (!orderDateRange.end || orderDate <= new Date(orderDateRange.end + 'T23:59:59'));
      
      return matchesStatus && matchesSearch && matchesDateRange;
    });
  }, [orders, orderStatusFilter, orderDateRange, orderSearchQuery]);

  // Product Edit State
  const [editingProduct, setEditingProduct] = React.useState<Partial<Product> | null>(null);
  const [showProductModal, setShowProductModal] = React.useState(false);

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const activeOrders = orders.filter(o => o.status !== 'delivered').length;
  const totalCustomers = new Set(orders.map(o => o.userId)).size;

  React.useEffect(() => {
    if (!isOpen || !isConfirmedAdmin) return;

    setLoading(true);

    // Fetch Products
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
    }, (err) => {
      // Products are public, but guard anyway
      if (auth.currentUser) {
        handleFirestoreError(err, OperationType.LIST, 'products');
      }
    });

    // Fetch All Orders via Collection Group
    const ordersQuery = query(collectionGroup(db, 'orders'), orderBy('date', 'desc'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => {
        const userId = doc.ref.parent.parent?.id || 'unknown';
        return { id: doc.id, ...doc.data(), userId } as Order & { userId: string };
      });

      // Handle Notifications for changes
      if (!isInitialLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as Order;
            const userId = change.doc.ref.parent.parent?.id || 'unknown';
            setNotifications(prev => [{
              id: Math.random().toString(36).substr(2, 9),
              type: 'new_order' as const,
              message: `New order ${data.id} placed for ₦${data.total.toLocaleString()}`,
              timestamp: new Date(),
              read: false,
              orderId: data.id,
              userId
            }, ...prev].slice(0, 50));
          } else if (change.type === 'modified') {
            const data = change.doc.data() as Order;
            const userId = change.doc.ref.parent.parent?.id || 'unknown';
            setNotifications(prev => [{
              id: Math.random().toString(36).substr(2, 9),
              type: 'status_update' as const,
              message: `Order ${data.id} status updated to ${data.status.toUpperCase()}`,
              timestamp: new Date(),
              read: false,
              orderId: data.id,
              userId
            }, ...prev].slice(0, 50));
          }
        });
      }

      setOrders(fetchedOrders);
      setLoading(false);
      isInitialLoad.current = false;
    }, (err) => {
      // Only report if we are still an admin and logged in
      if (isConfirmedAdmin && auth.currentUser) {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      }
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, [isOpen]);

  const handleSeedMenu = async () => {
    if (!confirm('This will import the initial menu into the database. Continue?')) return;
    
    try {
      const batch = writeBatch(db);
      PRODUCTS.forEach(p => {
        const newDocRef = doc(collection(db, 'products'));
        batch.set(newDocRef, { ...p, id: newDocRef.id });
      });
      await batch.commit();
      alert('Menu seeded successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      if (editingProduct.id) {
        // Update
        const prodRef = doc(db, 'products', editingProduct.id);
        await updateDoc(prodRef, editingProduct);
      } else {
        // Create
        await addDoc(collection(db, 'products'), {
          ...editingProduct,
          reviews: []
        });
      }
      setShowProductModal(false);
      setEditingProduct(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleUpdateOrderStatus = async (userId: string, orderId: string, status: OrderStatus) => {
    try {
      const orderRef = doc(db, 'profiles', userId, 'orders', orderId);
      await updateDoc(orderRef, { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${userId}/orders/${orderId}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex flex-col bg-slate-50">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3 md:gap-4 truncate">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 rounded-lg md:rounded-xl flex items-center justify-center text-white shrink-0">
                <LayoutDashboard size={18} />
              </div>
              <div className="truncate">
                <h1 className="font-display font-bold text-lg md:text-xl tracking-tight truncate">Admin Panel</h1>
                <p className="text-[8px] md:text-[10px] uppercase font-black text-slate-400 tracking-widest truncate">Eat Right • Management</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={cn(
                    "w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl transition-all relative",
                    unreadCount > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-red text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowNotifications(false)}
                        className="fixed inset-0 z-40 lg:absolute lg:inset-auto lg:top-full lg:right-0 lg:w-[400px] lg:h-auto"
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed inset-x-4 top-20 lg:absolute lg:top-full lg:right-0 mt-2 lg:w-[350px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                          <h4 className="font-display font-bold">Manage Alerts</h4>
                          <button 
                            onClick={markAllAsRead}
                            className="text-[10px] font-black uppercase text-brand-green tracking-widest hover:underline"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                          {notifications.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                              {notifications.map((n) => (
                                <div 
                                  key={n.id} 
                                  className={cn(
                                    "p-4 transition-colors relative flex gap-3",
                                    !n.read ? "bg-amber-50/50" : "hover:bg-slate-50"
                                  )}
                                >
                                  <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                    n.type === 'new_order' ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
                                  )}>
                                    <ShoppingBag size={16} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 leading-snug">{n.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{n.timestamp.toLocaleTimeString()}</p>
                                  </div>
                                  {!n.read && (
                                    <button 
                                      onClick={() => markAsRead(n.id)}
                                      className="w-6 h-6 rounded-full border border-amber-200 flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-white transition-all"
                                    >
                                      <Check size={12} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-12 text-center">
                              <Bell className="mx-auto text-slate-200 mb-4" size={32} />
                              <p className="text-xs font-bold text-slate-400">System clear.</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={onClose}
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
              >
                <X size={24} />
              </button>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden relative">
            {/* Sidebar Navigation - Hidden on Mobile */}
            <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 p-6 flex-col gap-2">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                  activeTab === 'dashboard' ? "bg-brand-green text-white shadow-lg shadow-brand-green/20" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <TrendingUp size={18} />
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('menu')}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                  activeTab === 'menu' ? "bg-brand-green text-white shadow-lg shadow-brand-green/20" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <Utensils size={18} />
                Menu Manager
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                  activeTab === 'orders' ? "bg-brand-green text-white shadow-lg shadow-brand-green/20" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <ShoppingBag size={18} />
                Global Orders
              </button>
              
              <div className="mt-auto pt-6 border-t border-slate-100">
                <button 
                  onClick={handleSeedMenu}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-slate-300 rounded-xl text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:border-brand-green hover:text-brand-green transition-all"
                >
                  <RotateCw size={14} />
                  Reset/Seed Menu
                </button>
              </div>
            </aside>

            {/* Mobile Tab Bar */}
            <div className="lg:hidden absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center z-30">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
                  activeTab === 'dashboard' ? "text-brand-green" : "text-slate-400"
                )}
              >
                <TrendingUp size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Stats</span>
              </button>
              <button 
                onClick={() => setActiveTab('menu')}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
                  activeTab === 'menu' ? "text-brand-green" : "text-slate-400"
                )}
              >
                <Utensils size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Menu</span>
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
                  activeTab === 'orders' ? "text-brand-green" : "text-slate-400"
                )}
              >
                <ShoppingBag size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Orders</span>
              </button>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                   <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                     <RotateCw className="text-brand-green" size={32} />
                   </motion.div>
                </div>
              ) : (
                <div className="max-w-6xl mx-auto">
                  {activeTab === 'dashboard' && (
                    <div className="space-y-6 md:space-y-8">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 md:mb-6">
                            <TrendingUp size={20} />
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                          <h3 className="text-2xl md:text-3xl font-display font-bold">₦{totalRevenue.toLocaleString()}</h3>
                        </div>
                        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4 md:mb-6">
                            <Package size={20} />
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1" >Active Orders</p>
                          <h3 className="text-2xl md:text-3xl font-display font-bold">{activeOrders}</h3>
                        </div>
                        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm sm:col-span-2 lg:col-span-1">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 md:mb-6">
                            <Users size={20} />
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Customers</p>
                          <h3 className="text-2xl md:text-3xl font-display font-bold">{totalCustomers}</h3>
                        </div>
                      </div>

                      {/* Recent Orders Overview */}
                      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="font-display font-bold text-lg">Recent Order Stream</h3>
                          <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-brand-green hover:underline">View All</button>
                        </div>
                        <div className="divide-y divide-slate-50">
                          {orders.slice(0, 5).map(order => (
                            <div key={order.id} className="p-6 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                  <ShoppingBag className="text-slate-400" size={20} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{order.id}</p>
                                  <p className="text-xs text-slate-400">{new Date(order.date).toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-8">
                                <div className="text-right">
                                  <p className="font-bold text-slate-900">₦{order.total.toLocaleString()}</p>
                                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{order.items.length} items</p>
                                </div>
                                <span className={cn(
                                  "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                                  order.status === 'delivered' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                  order.status === 'pending' ? "bg-amber-100 text-amber-700 border-amber-200" :
                                  "bg-indigo-100 text-indigo-700 border-indigo-200"
                                )}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'menu' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-display font-bold">Menu Manager</h2>
                          <p className="text-sm text-slate-500">Update pricing, items, and availability</p>
                        </div>
                        <button 
                          onClick={() => {
                            setEditingProduct({ category: 'Nigerian', isAvailable: true } as any);
                            setShowProductModal(true);
                          }}
                          className="bg-brand-green text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-brand-green/20"
                        >
                          <Plus size={20} />
                          Add New Item
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map(product => (
                          <div key={product.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden group shadow-sm hover:shadow-md transition-all">
                            <div className="relative h-48 overflow-hidden">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              <div className="absolute top-4 right-4 flex gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setShowProductModal(true);
                                  }}
                                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-600 hover:text-brand-green shadow-lg"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-600 hover:text-brand-red shadow-lg"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div className="absolute top-4 left-4">
                                <span className="bg-brand-green text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                  {product.category}
                                </span>
                              </div>
                            </div>
                            <div className="p-6">
                              <h3 className="font-display font-bold text-lg mb-1">{product.name}</h3>
                              <p className="text-sm text-slate-500 line-clamp-2 mb-4">{product.description}</p>
                              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <span className="font-bold text-slate-900">₦{product.price.toLocaleString()}</span>
                                <div className="flex gap-4">
                                   <div className="text-center">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Cal</p>
                                      <p className="text-xs font-bold">{product.calories || '—'}</p>
                                   </div>
                                   <div className="text-center">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Prot</p>
                                      <p className="text-xs font-bold">{product.protein || '—'}g</p>
                                   </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'orders' && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                          <h2 className="text-2xl font-display font-bold">Global Order Stream</h2>
                          <p className="text-sm text-slate-500">Live monitoring of all restaurant activity</p>
                        </div>
                        <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Found Orders</p>
                          <p className="text-lg font-display font-bold text-emerald-900">{filteredOrders.length}</p>
                        </div>
                      </div>

                      {/* Filter Controls */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                            <Search size={12} /> Search Order ID
                          </label>
                          <input 
                            type="text"
                            placeholder="Search..."
                            value={orderSearchQuery}
                            onChange={(e) => setOrderSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-brand-green"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                            <Filter size={12} /> Status
                          </label>
                          <select 
                            value={orderStatusFilter}
                            onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-brand-green"
                          >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="preparing">Preparing</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                            <Clock size={12} /> Start Date
                          </label>
                          <input 
                            type="date"
                            value={orderDateRange.start}
                            onChange={(e) => setOrderDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-brand-green"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                            <Clock size={12} /> End Date
                          </label>
                          <input 
                            type="date"
                            value={orderDateRange.end}
                            onChange={(e) => setOrderDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-brand-green"
                          />
                        </div>

                        <div className="md:col-span-4 flex justify-end">
                            <button 
                              onClick={() => {
                                setOrderStatusFilter('all');
                                setOrderDateRange({ start: '', end: '' });
                                setOrderSearchQuery('');
                              }}
                              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-red transition-colors"
                            >
                              Reset Filters
                            </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {filteredOrders.length > 0 ? filteredOrders.map(order => (
                          <div key={order.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                              <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-4">
                                  <h3 className="font-display font-black text-xl tracking-tight uppercase">{order.id}</h3>
                                  <span className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                                    order.status === 'delivered' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                    order.status === 'pending' ? "bg-amber-100 text-amber-700 border-amber-200" :
                                    "bg-indigo-100 text-indigo-700 border-indigo-200"
                                  )}>
                                    {order.status}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-[13px]">
                                   <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Clock size={12}/> Time Placed</p>
                                      <p className="font-bold text-slate-900">{new Date(order.date).toLocaleString()}</p>
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Truck size={12}/> Delivery</p>
                                      <p className="font-bold text-slate-900 uppercase">{order.deliveryType}</p>
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
                                      <p className="font-bold text-brand-green">₦{order.total.toLocaleString()}</p>
                                   </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Search size={12}/> Address</p>
                                  <p className="text-sm font-bold text-slate-700">{order.address}</p>
                                </div>
                              </div>

                              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 flex flex-col gap-6">
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Items</p>
                                  <div className="space-y-2">
                                    {order.items.map((item, idx) => (
                                      <div key={`${order.id}-admin-item-${item.productId}-${idx}`} className="flex justify-between text-xs">
                                        <span className="font-bold text-slate-600 truncate max-w-[150px]">{item.name}</span>
                                        <span className="text-slate-400">x{item.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-100">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Update Status</p>
                                  <div className="flex flex-wrap gap-2">
                                    {(['pending', 'preparing', 'dispatched', 'delivered'] as OrderStatus[]).map(status => (
                                      <button 
                                        key={status}
                                        onClick={() => handleUpdateOrderStatus(order.userId, order.id, status)}
                                        className={cn(
                                          "px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all",
                                          order.status === status ? "bg-brand-green text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                        )}
                                      >
                                        {status}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="bg-white p-12 rounded-[2rem] border border-slate-200 text-center">
                            <p className="text-slate-400 font-bold">No orders found matching your filters.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>

          {/* Product Edit Modal */}
          <AnimatePresence>
            {showProductModal && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowProductModal(false)}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />
                <motion.form 
                  onSubmit={handleSaveProduct}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
                >
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-display font-bold text-xl">{editingProduct?.id ? 'Edit Product' : 'Add New Product'}</h3>
                    <button type="button" onClick={() => setShowProductModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Name</label>
                        <input 
                          type="text" 
                          required
                          value={editingProduct?.name || ''}
                          onChange={e => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-green"
                          placeholder="e.g., Party Jollof Rice"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Price (₦)</label>
                        <input 
                          type="number" 
                          required
                          value={editingProduct?.price || ''}
                          onChange={e => setEditingProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-green"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</label>
                        <select 
                          required
                          value={editingProduct?.category || 'Nigerian'}
                          onChange={e => setEditingProduct(prev => ({ ...prev, category: e.target.value as any }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-green"
                        >
                          <option value="Nigerian">Nigerian</option>
                          <option value="Continental">Continental</option>
                          <option value="Healthy">Healthy</option>
                          <option value="Drinks">Drinks</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</label>
                      <textarea 
                        required
                        value={editingProduct?.description || ''}
                        onChange={e => setEditingProduct(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-green min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Image URL</label>
                      <input 
                        type="url" 
                        required
                        value={editingProduct?.image || ''}
                        onChange={e => setEditingProduct(prev => ({ ...prev, image: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-green"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Calories</label>
                        <input 
                          type="number" 
                          value={editingProduct?.calories || ''}
                          onChange={e => setEditingProduct(prev => ({ ...prev, calories: Number(e.target.value) }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-green"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Protein (g)</label>
                        <input 
                          type="number" 
                          value={editingProduct?.protein || ''}
                          onChange={e => setEditingProduct(prev => ({ ...prev, protein: Number(e.target.value) }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-green"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                    <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                    <button type="submit" className="flex-1 bg-brand-green text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-brand-green/20">
                      <Save size={20} />
                      Save Product
                    </button>
                  </div>
                </motion.form>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
