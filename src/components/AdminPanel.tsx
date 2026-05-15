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
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  MoreVertical,
  Printer,
  Download,
  Calendar as CalendarIcon,
  MessageSquare
} from 'lucide-react';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { collection, doc, onSnapshot, updateDoc, addDoc, deleteDoc, query, orderBy, collectionGroup, getDocs, writeBatch } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Product, Order, OrderStatus } from '../types';
import { cn } from '../lib/utils';
import { PRODUCTS } from '../constants';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminTab = 'dashboard' | 'menu' | 'orders' | 'users';

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
  const [profiles, setProfiles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notifications, setNotifications] = React.useState<AdminNotification[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<(Order & { userId: string }) | null>(null);
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const isInitialLoad = React.useRef(true);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Order Filter State
  const [orderStatusFilter, setOrderStatusFilter] = React.useState<OrderStatus | 'all'>('all');
  const [orderDateRange, setOrderDateRange] = React.useState<{ start: string; end: string }>({ start: '', end: '' });
  const [orderSearchQuery, setOrderSearchQuery] = React.useState('');

  // Stats Analytics
  const analyticsData = React.useMemo(() => {
    // Last 7 days revenue
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const revenueByDay = days.map(day => {
      const dayTotal = orders
        .filter(o => o.date.startsWith(day))
        .reduce((sum, o) => sum + o.total, 0);
      return { name: day.split('-').slice(1).join('/'), value: dayTotal };
    });

    // Category distribution
    const categories: Record<string, number> = {};
    orders.flatMap(o => o.items).forEach(item => {
      const cat = products.find(p => p.id === item.productId)?.category || 'Other';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const categoryData = Object.entries(categories).map(([name, value]) => ({ name, value }));

    return { revenueByDay, categoryData };
  }, [orders, products]);

  // Memoized Filtered Orders
  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
      const matchesSearch = (order.orderNumber || order.id).toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                            order.userId.toLowerCase().includes(orderSearchQuery.toLowerCase());
      
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
  const totalCustomers = profiles.length;

  React.useEffect(() => {
    if (!isOpen || !isConfirmedAdmin) return;

    setLoading(true);

    // Fetch Products
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
    }, (err) => {
      console.error(err);
      showToast('Connection to products failed', 'error');
    });

    // Fetch All Orders via Collection Group
    const ordersQuery = query(collectionGroup(db, 'orders'), orderBy('date', 'desc'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => {
        const data = doc.data() as Order;
        const userId = doc.ref.parent.parent?.id || 'unknown';
        return { ...data, id: doc.id, orderNumber: data.id || doc.id, userId } as Order & { userId: string };
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
              message: `New order ${data.id || change.doc.id} placed for ₦${data.total.toLocaleString()}`,
              timestamp: new Date(),
              read: false,
              orderId: change.doc.id,
              userId
            }, ...prev].slice(0, 50));
          } else if (change.type === 'modified') {
            const data = change.doc.data() as Order;
            const userId = change.doc.ref.parent.parent?.id || 'unknown';
            setNotifications(prev => [{
              id: Math.random().toString(36).substr(2, 9),
              type: 'status_update' as const,
              message: `Order ${data.id || change.doc.id} status updated to ${data.status.toUpperCase()}`,
              timestamp: new Date(),
              read: false,
              orderId: change.doc.id,
              userId
            }, ...prev].slice(0, 50));
          }
        });
      }

      setOrders(fetchedOrders);
      setLoading(false);
      isInitialLoad.current = false;
    }, (err) => {
      console.error(err);
      showToast('Order stream disconnected', 'info');
      setLoading(false);
    });

    // Fetch All Profiles
    const unsubscribeProfiles = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      const profs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProfiles(profs);
    }, (err) => {
      console.error(err);
      showToast('Profile stream sync failed', 'info');
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeProfiles();
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
      showToast('Menu seeded successfully!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
      showToast('Failed to seed menu', 'error');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      if (editingProduct.id) {
        // Update
        const { id, ...data } = editingProduct;
        const prodRef = doc(db, 'products', id);
        await updateDoc(prodRef, data);
        showToast('Product updated successfully');
      } else {
        // Create
        const { id, ...data } = editingProduct;
        await addDoc(collection(db, 'products'), {
          ...data,
          reviews: []
        });
        showToast('Product created successfully');
      }
      setShowProductModal(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Save product error:', err);
      handleFirestoreError(err, OperationType.WRITE, 'products');
      showToast('Error saving product', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      showToast('Product deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      showToast('Error deleting product', 'error');
    }
  };

  const handleUpdateOrderStatus = async (userId: string, orderId: string, status: OrderStatus) => {
    try {
      console.log(`Updating order ${orderId} for user ${userId} to status ${status}`);
      const orderRef = doc(db, 'profiles', userId, 'orders', orderId);
      await updateDoc(orderRef, { status });
      showToast(`Order status updated to ${status}`);
      
      // Update selected order if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      console.error('Order status update error:', err);
      showToast('Status update failed', 'error');
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
    <>
      <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="fixed inset-0 z-[250] flex flex-col bg-slate-50"
        >
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
                    unreadCount > 0 ? "bg-brand-green/10 text-brand-green" : "bg-slate-50 text-slate-400 hover:text-slate-600"
                  )}
                >
                  <motion.div
                    animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 0] } : {}}
                    transition={{ duration: 0.5, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
                  >
                    <Bell size={20} />
                  </motion.div>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-red text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-lg">
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
                        className="fixed inset-0 z-40 bg-transparent"
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed lg:absolute inset-x-4 lg:inset-x-auto top-20 lg:top-[calc(100%+0.5rem)] right-4 lg:right-0 w-auto lg:w-[400px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden"
                      >
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                          <h4 className="font-display font-bold text-lg">System Alerts</h4>
                          <div className="flex gap-4">
                            <button 
                              onClick={markAllAsRead}
                              className="text-[10px] font-black uppercase text-brand-green tracking-widest hover:underline"
                            >
                              Clear All
                            </button>
                            <button onClick={() => setShowNotifications(false)} className="lg:hidden text-slate-400">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="max-h-[70vh] lg:max-h-[500px] overflow-y-auto">
                          {notifications.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                              {notifications.map((n) => (
                                <div 
                                  key={n.id} 
                                  onClick={() => {
                                    if (n.orderId) {
                                      const order = orders.find(o => o.id === n.orderId);
                                      if (order) setSelectedOrder(order);
                                      markAsRead(n.id);
                                      setShowNotifications(false);
                                    }
                                  }}
                                  className={cn(
                                    "p-6 transition-all relative flex gap-4 cursor-pointer",
                                    !n.read ? "bg-brand-green/[0.03] border-l-4 border-l-brand-green" : "hover:bg-slate-50 border-l-4 border-l-transparent"
                                  )}
                                >
                                  <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                    n.type === 'new_order' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                                  )}>
                                    {n.type === 'new_order' ? <ShoppingBag size={20} /> : <Activity size={20} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        {n.type === 'new_order' ? 'New Placement' : 'Status Change'}
                                      </p>
                                      <p className="text-[9px] font-bold text-slate-400">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <p className="text-[13px] font-bold text-slate-900 leading-relaxed">{n.message}</p>
                                  </div>
                                  {!n.read && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(n.id);
                                      }}
                                      className="w-6 h-6 rounded-full bg-brand-green text-white flex items-center justify-center shadow-lg shadow-brand-green/20"
                                    >
                                      <Check size={12} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-16 text-center">
                              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Bell className="text-slate-200" size={32} />
                              </div>
                              <p className="text-xs font-bold text-slate-400">All systems operational.</p>
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
              <button 
                onClick={() => setActiveTab('users')}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                  activeTab === 'users' ? "bg-brand-green text-white shadow-lg shadow-brand-green/20" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <Users size={18} />
                Members
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
              <button 
                onClick={() => setActiveTab('users')}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
                  activeTab === 'users' ? "text-brand-green" : "text-slate-400"
                )}
              >
                <Users size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Users</span>
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
                    <div className="space-y-8 pb-20">
                      {/* Quick Approval Section (Floating Alert) */}
                      {orders.some(o => o.status === 'pending') && (
                        <motion.div 
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 text-amber-800">
                            <Clock size={20} className="animate-pulse" />
                            <span className="text-sm font-bold">You have {orders.filter(o => o.status === 'pending').length} pending orders awaiting approval.</span>
                          </div>
                          <button 
                            onClick={() => {
                              setOrderStatusFilter('pending');
                              setActiveTab('orders');
                            }}
                            className="bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase text-amber-600 border border-amber-200 hover:bg-amber-100 transition-all shadow-sm"
                          >
                            Go to Approvals
                          </button>
                        </motion.div>
                      )}

                      {/* Header Bento Section */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                        <div className="md:col-span-8 flex flex-col gap-6">
                           <div className="bento-card !p-8 !bg-brand-dark overflow-hidden relative group">
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_rgba(16,185,129,0.15),_transparent)]" />
                              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 h-full">
                                 <div className="max-w-md">
                                    <h2 className="text-3xl md:text-5xl font-display font-medium text-white mb-4 leading-none tracking-tight">
                                       Master your <br />
                                       <span className="text-brand-green italic font-light">Performance.</span>
                                    </h2>
                                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                       Revenue velocity is up 12% this week. Your top performing category is <span className="text-white">Healthy Bowls</span>.
                                    </p>
                                 </div>
                                 <div className="flex gap-10">
                                    <div className="flex flex-col">
                                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Weekly Gross</span>
                                       <span className="text-3xl font-display font-bold text-white">₦{(totalRevenue * 0.42).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-1">Growth</span>
                                       <span className="text-3xl font-display font-bold text-brand-green">+14%</span>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                              <div className="bento-card !p-6 flex flex-col gap-4">
                                 <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                    <TrendingUp size={20} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">LTD Revenue</p>
                                    <h3 className="text-2xl font-display font-bold">₦{totalRevenue.toLocaleString()}</h3>
                                 </div>
                              </div>
                              <div className="bento-card !p-6 flex flex-col gap-4">
                                 <div className="w-10 h-10 bg-brand-green/10 rounded-xl flex items-center justify-center text-brand-green">
                                    <Users size={20} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">New Users</p>
                                    <h3 className="text-2xl font-display font-bold">{totalCustomers}</h3>
                                 </div>
                              </div>
                              <div className="bento-card !p-6 flex flex-col gap-4">
                                 <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                    <Activity size={20} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Velocity</p>
                                    <h3 className="text-2xl font-display font-bold">4.2<span className="text-sm font-medium text-slate-400 ml-1">orders/hr</span></h3>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="md:col-span-4 bento-card !p-0 overflow-hidden flex flex-col h-full">
                           <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                              <h3 className="font-display font-bold text-lg">Category Pulse</h3>
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                 <Filter size={14} />
                              </div>
                           </div>
                           <div className="flex-1 min-h-[300px] py-4">
                              <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                    <Pie
                                       data={analyticsData.categoryData}
                                       cx="50%"
                                       cy="50%"
                                       innerRadius={60}
                                       outerRadius={100}
                                       paddingAngle={5}
                                       dataKey="value"
                                    >
                                       {analyticsData.categoryData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={[ '#10b981', '#0f172a', '#f59e0b', '#3b82f6'][index % 4]} />
                                       ))}
                                    </Pie>
                                    <Tooltip 
                                       contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    />
                                 </PieChart>
                              </ResponsiveContainer>
                           </div>
                           <div className="p-6 bg-slate-50 flex flex-wrap gap-4 items-center justify-center">
                              {analyticsData.categoryData.map((entry, index) => (
                                 <div key={`legend-${entry.name}`} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: [ '#10b981', '#0f172a', '#f59e0b', '#3b82f6'][index % 4] }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{entry.name}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                      </div>

                      {/* Revenue Velocity Chart */}
                      <div className="bento-card !p-8">
                        <div className="flex items-center justify-between mb-10">
                           <div>
                              <h3 className="font-display font-bold text-xl mb-1">Revenue Velocity</h3>
                              <p className="text-xs text-slate-400">Last 7 days performance metrics</p>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 rounded bg-brand-green" />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 rounded bg-brand-green/20" />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actual</span>
                              </div>
                           </div>
                        </div>
                        <div className="h-[300px]">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={analyticsData.revenueByDay}>
                                 <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                       <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                 <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                                    dy={10}
                                 />
                                 <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                                    tickFormatter={(val) => `₦${val/1000}k`}
                                 />
                                 <Tooltip 
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                 />
                                 <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#10b981" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorValue)" 
                                 />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Recent Orders Overview */}
                      <div className="bento-card !p-0 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                           <div>
                              <h3 className="font-display font-bold text-lg">Live Order Stream</h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Global activity monitoring</p>
                           </div>
                           <button onClick={() => setActiveTab('orders')} className="text-[10px] font-black uppercase text-brand-green tracking-[0.2em] border border-brand-green/20 px-4 py-2 rounded-full hover:bg-brand-green hover:text-white transition-all">View All Activity</button>
                        </div>
                        <div className="divide-y divide-slate-50">
                          {orders.slice(0, 5).map(order => (
                            <div key={order.id} className="p-8 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                              <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100 text-slate-400 group-hover:scale-110 transition-transform">
                                  <ShoppingBag size={24} />
                                </div>
                                <div>
                                  <p className="font-display font-bold text-slate-900">{order.orderNumber || order.id}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(order.date).toLocaleTimeString()}</span>
                                     <span className="w-1 h-1 rounded-full bg-slate-200" />
                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.items.length} items</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-12">
                                <div className="text-right hidden sm:block">
                                  <p className="font-display font-bold text-slate-900">₦{order.total.toLocaleString()}</p>
                                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5">Paid via Card</p>
                                </div>
                                <div className="flex items-center gap-4">
                                   <span className={cn(
                                     "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border",
                                     order.status === 'delivered' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                     order.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                     "bg-indigo-50 text-indigo-600 border-indigo-100"
                                   )}>
                                     {order.status}
                                   </span>
                                   <button className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 hover:text-brand-green hover:border-brand-green transition-all">
                                      <ChevronRight size={18} />
                                   </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'menu' && (
                    <div className="space-y-10 pb-20">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                          <h2 className="text-3xl font-display font-bold tracking-tight">Menu Ecosystem</h2>
                          <p className="text-sm text-slate-500 mt-1">Design, price, and monitor your culinary inventory</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <button className="p-3 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-600 transition-all shadow-sm">
                              <Download size={20} />
                           </button>
                           <button 
                             onClick={() => {
                               setEditingProduct({ category: 'Nigerian', isAvailable: true } as any);
                               setShowProductModal(true);
                             }}
                             className="bg-brand-green text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-brand-green/20 hover:scale-[1.02] active:scale-95 transition-all"
                           >
                             <Plus size={20} />
                             Launch New Item
                           </button>
                        </div>
                      </div>

                      {/* Category Quick Filter */}
                      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
                         {['All', 'Nigerian', 'Continental', 'Healthy', 'Drinks'].map((cat) => (
                            <button 
                              key={cat}
                              className="px-6 py-2.5 rounded-full bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-brand-green hover:text-brand-green transition-all shadow-sm whitespace-nowrap"
                            >
                               {cat}
                            </button>
                         ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {products.map(product => (
                          <div key={product.id} className="bento-card !p-0 overflow-hidden group">
                            <div className="relative h-56 overflow-hidden">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              
                              <div className="absolute top-6 right-6 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                <button 
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setShowProductModal(true);
                                  }}
                                  className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-600 hover:text-brand-green shadow-xl"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-600 hover:text-brand-red shadow-xl"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              
                              <div className="absolute bottom-6 left-6">
                                <span className={cn(
                                   "bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm",
                                   product.isAvailable ? "text-brand-green" : "text-amber-500"
                                )}>
                                  {product.isAvailable ? 'Active' : 'Unavailable'}
                                </span>
                              </div>
                            </div>
                            <div className="p-8">
                              <div className="flex items-start justify-between gap-4 mb-4">
                                 <div>
                                   <p className="text-[9px] font-black text-brand-green uppercase tracking-widest mb-1">{product.category}</p>
                                   <h3 className="font-display font-bold text-xl tracking-tight">{product.name}</h3>
                                 </div>
                                 <span className="font-display font-bold text-lg text-slate-900">₦{product.price.toLocaleString()}</span>
                              </div>
                              
                              <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-8">{product.description}</p>
                              
                              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-50">
                                 <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Calories</span>
                                    <span className="text-xs font-bold text-slate-700">{product.calories || '—'}</span>
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protein</span>
                                    <span className="text-xs font-bold text-slate-700">{product.protein || '—'}g</span>
                                 </div>
                                 <div className="flex flex-col text-right">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fiber</span>
                                    <span className="text-xs font-bold text-slate-700">{product.fiber || '—'}g</span>
                                 </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'orders' && (
                    <div className="space-y-8 pb-20">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                          <h2 className="text-3xl font-display font-bold tracking-tight">Global Orders</h2>
                          <p className="text-sm text-slate-500 mt-1">Real-time status management and logistics</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Filtered Results</p>
                              <p className="text-lg font-display font-bold text-slate-900">{filteredOrders.length}</p>
                           </div>
                        </div>
                      </div>

                      {/* Pro Filter Bar */}
                      <div className="bento-card !p-6 !bg-white sticky top-0 z-10 shadow-xl shadow-slate-200/40">
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="relative">
                               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                               <input 
                                 type="text"
                                 placeholder="Order ID or Customer..."
                                 value={orderSearchQuery}
                                 onChange={(e) => setOrderSearchQuery(e.target.value)}
                                 className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:bg-white focus:border-brand-green transition-all outline-none"
                               />
                            </div>
                            <select 
                              value={orderStatusFilter}
                              onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                              className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-brand-green transition-all outline-none"
                            >
                               <option value="all">All Lifecycles</option>
                               <option value="pending">Pending</option>
                               <option value="preparing">Preparing</option>
                               <option value="dispatched">Dispatched</option>
                               <option value="delivered">Delivered</option>
                            </select>
                            <input 
                              type="date"
                              value={orderDateRange.start}
                              onChange={(e) => setOrderDateRange(prev => ({ ...prev, start: e.target.value }))}
                              className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-brand-green transition-all outline-none"
                            />
                            <div className="flex gap-2">
                               <input 
                                 type="date"
                                 value={orderDateRange.end}
                                 onChange={(e) => setOrderDateRange(prev => ({ ...prev, end: e.target.value }))}
                                 className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-brand-green transition-all outline-none"
                               />
                               <button 
                                 onClick={() => {
                                   setOrderStatusFilter('all');
                                   setOrderDateRange({ start: '', end: '' });
                                   setOrderSearchQuery('');
                                 }}
                                 className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-brand-red transition-colors border border-slate-100"
                               >
                                  <RotateCw size={18} />
                               </button>
                            </div>
                         </div>
                      </div>

                      {/* Orders Layout - Table Style for Professionalism */}
                      <div className="bento-card !p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                           <table className="w-full border-collapse">
                              <thead>
                                 <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Order ID</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">User / Identity</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Revenue</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Actions</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                       <td className="px-8 py-6">
                                          <div className="flex items-center gap-3">
                                             <div className={cn(
                                               "w-2 h-2 rounded-full",
                                               order.status === 'pending' ? "bg-amber-400 animate-pulse" : "bg-brand-green"
                                             )} />
                                             <span className="font-display font-bold text-slate-900">#{(order.orderNumber || order.id || '').toUpperCase()}</span>
                                          </div>
                                          <span className="text-[10px] text-slate-400 font-bold block mt-1">{new Date(order.date).toLocaleDateString()}</span>
                                       </td>
                                       <td className="px-8 py-6">
                                          <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <Users size={14} />
                                             </div>
                                             <span className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{order.userId}</span>
                                          </div>
                                       </td>
                                       <td className="px-8 py-6">
                                          <span className="text-xs font-bold text-slate-500">{order.items.length} unique items</span>
                                       </td>
                                       <td className="px-8 py-6 text-sm font-display font-bold text-brand-green">
                                          ₦{order.total.toLocaleString()}
                                       </td>
                                       <td className="px-8 py-6">
                                          <span className={cn(
                                            "inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                            order.status === 'delivered' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            order.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                            "bg-indigo-50 text-indigo-600 border-indigo-100"
                                          )}>
                                            {order.status}
                                          </span>
                                       </td>
                                       <td className="px-8 py-6">
                                          <div className="flex items-center justify-center gap-2">
                                            {order.status === 'pending' && (
                                              <button 
                                                onClick={() => handleUpdateOrderStatus(order.userId, order.id, 'preparing')}
                                                className="px-3 py-1.5 bg-brand-green text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand-green/20"
                                              >
                                                Approve
                                              </button>
                                            )}
                                            {order.status === 'preparing' && (
                                              <button 
                                                onClick={() => handleUpdateOrderStatus(order.userId, order.id, 'dispatched')}
                                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                              >
                                                Ship
                                              </button>
                                            )}
                                            {order.status === 'dispatched' && (
                                              <button 
                                                onClick={() => handleUpdateOrderStatus(order.userId, order.id, 'delivered')}
                                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                              >
                                                Finish
                                              </button>
                                            )}
                                          </div>
                                       </td>
                                       <td className="px-8 py-6 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                            <button 
                                              onClick={() => setSelectedOrder(order)}
                                              className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand-green group-hover:border-brand-green transition-all hover:bg-white hover:shadow-lg"
                                            >
                                               <ChevronRight size={18} />
                                            </button>
                                            <button 
                                              onClick={async () => {
                                                if (confirm('Permanently delete this order record?')) {
                                                  try {
                                                    await deleteDoc(doc(db, 'profiles', order.userId, 'orders', order.id));
                                                    showToast('Order record removed');
                                                  } catch (e) {
                                                    showToast('Deletion failed', 'error');
                                                  }
                                                }
                                              }}
                                              className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 hover:text-brand-red hover:border-brand-red transition-all"
                                            >
                                               <Trash2 size={16} />
                                            </button>
                                          </div>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'users' && (
                    <div className="space-y-8 pb-20">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                          <h2 className="text-3xl font-display font-bold tracking-tight">Identity Intelligence</h2>
                          <p className="text-sm text-slate-500 mt-1">Manage elite member records and communication</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Members</p>
                              <p className="text-lg font-display font-bold text-slate-900">{profiles.length}</p>
                           </div>
                        </div>
                      </div>

                      <div className="bento-card !p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                           <table className="w-full border-collapse">
                              <thead>
                                 <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Portrait</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Identity</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Email Status</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Orders</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {profiles.map(profile => {
                                    const userOrders = orders.filter(o => o.userId === profile.id);
                                    return (
                                      <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors group">
                                         <td className="px-8 py-6">
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                                               {profile.photoURL ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Users size={20} /></div>}
                                            </div>
                                         </td>
                                         <td className="px-8 py-6">
                                            <p className="font-display font-bold text-slate-900">{profile.displayName || 'Anonymous Explorer'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{profile.role || 'Member'}</p>
                                         </td>
                                         <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                               <span className="text-xs font-bold text-slate-600">{profile.email || 'No Email Linked'}</span>
                                               <span className={cn(
                                                 "text-[8px] font-black uppercase tracking-[0.2em] self-start",
                                                 profile.emailVerified ? "text-brand-green" : "text-amber-500"
                                               )}>
                                                  {profile.emailVerified ? 'Verified Account' : 'Pending Verification'}
                                               </span>
                                            </div>
                                         </td>
                                         <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                               <span className="text-sm font-display font-bold text-slate-900">{userOrders.length}</span>
                                               <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                                            </div>
                                         </td>
                                         <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                              <button 
                                                onClick={async () => {
                                                  const newRole = profile.role === 'admin' ? 'member' : 'admin';
                                                  if (confirm(`Change ${profile.displayName}'s role to ${newRole}?`)) {
                                                    try {
                                                      await updateDoc(doc(db, 'profiles', profile.id), { role: newRole });
                                                      showToast(`Role updated to ${newRole}`);
                                                    } catch (e) {
                                                      showToast('Role update failed', 'error');
                                                    }
                                                  }
                                                }}
                                                className={cn(
                                                  "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                                                  profile.role === 'admin' ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                )}
                                              >
                                                 {profile.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                                              </button>
                                              <button 
                                                onClick={() => {
                                                  setOrderSearchQuery(profile.id);
                                                  setActiveTab('orders');
                                                }}
                                                className="px-4 py-2 rounded-xl border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-green group-hover:border-brand-green transition-all"
                                              >
                                                Inspect Activity
                                              </button>
                                            </div>
                                         </td>
                                      </tr>
                                    );
                                 })}
                              </tbody>
                           </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Detail Side Over */}
                  <AnimatePresence>
                     {selectedOrder && (
                        <>
                           <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={() => setSelectedOrder(null)}
                              className="fixed inset-0 z-[300] bg-brand-dark/40 backdrop-blur-sm"
                           />
                           <motion.div 
                              initial={{ x: '100%' }}
                              animate={{ x: 0 }}
                              exit={{ x: '100%' }}
                              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                              className="fixed top-0 right-0 h-full w-full max-w-xl bg-white z-[310] shadow-2xl flex flex-col"
                           >
                              <div className="p-8 bg-slate-900 text-white relative h-64 flex flex-col justify-end overflow-hidden shrink-0">
                                 <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                                 <button 
                                   onClick={() => setSelectedOrder(null)}
                                   className="absolute top-8 left-8 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                                 >
                                    <X size={20} />
                                 </button>
                                 <div className="absolute top-8 right-8 flex gap-3">
                                    <button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                                       <Printer size={18} />
                                    </button>
                                 </div>
                                 
                                 <div className="relative z-10">
                                    <p className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-2">Order Intelligence</p>
                                    <h2 className="text-4xl font-display font-bold tracking-tight mb-4">#{(selectedOrder.orderNumber || selectedOrder.id).toUpperCase()}</h2>
                                    <div className="flex items-center gap-6">
                                       <div className="flex items-center gap-2">
                                          <Clock size={14} className="text-slate-400" />
                                          <span className="text-xs font-bold text-slate-300">{new Date(selectedOrder.date).toLocaleString()}</span>
                                       </div>
                                       <div className="flex items-center gap-2">
                                          <Package size={14} className="text-brand-green" />
                                          <span className="text-xs font-bold text-brand-green uppercase tracking-widest">{selectedOrder.status}</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="flex-1 overflow-y-auto p-10 space-y-10">
                                 {/* Status Manager */}
                                 <section>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Workflow Status</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                       {(['pending', 'preparing', 'dispatched', 'delivered'] as OrderStatus[]).map(status => (
                                          <button 
                                            key={status}
                                            onClick={() => handleUpdateOrderStatus(selectedOrder.userId, selectedOrder.id, status)}
                                            className={cn(
                                              "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                              selectedOrder.status === status ? 
                                              "bg-brand-green text-white border-brand-green shadow-lg shadow-brand-green/20" : 
                                              "bg-slate-50 text-slate-400 border-slate-100 hover:bg-white hover:border-slate-300"
                                            )}
                                          >
                                             {status}
                                          </button>
                                       ))}
                                    </div>
                                 </section>

                                 {/* Item Manifest */}
                                 <section className="bg-slate-50 rounded-3xl p-8">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Order Manifest</h4>
                                    <div className="space-y-4">
                                       {selectedOrder.items.map((item, idx) => (
                                          <div key={`order-detail-item-${idx}`} className="flex items-center justify-between group">
                                             <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-slate-100 text-slate-400">
                                                   <Utensils size={18} />
                                                </div>
                                                <div>
                                                   <p className="text-sm font-bold text-slate-700">{item.name}</p>
                                                   <p className="text-xs font-medium text-slate-400">x{item.quantity}</p>
                                                </div>
                                             </div>
                                             <span className="font-display font-bold text-slate-900">₦{(item.price * item.quantity).toLocaleString()}</span>
                                          </div>
                                       ))}
                                       <div className="pt-6 mt-6 border-t border-slate-200 flex justify-between items-center">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                                          <span className="text-2xl font-display font-bold text-brand-green">₦{selectedOrder.total.toLocaleString()}</span>
                                       </div>
                                    </div>
                                 </section>

                                 {/* Logistics Identities */}
                                 <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Identity</h4>
                                       <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                                             <Users size={18} />
                                          </div>
                                          <span className="text-sm font-bold text-slate-700">{selectedOrder.userId}</span>
                                       </div>
                                    </div>
                                    <div className="space-y-4">
                                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategy</h4>
                                       <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                             <Truck size={18} />
                                          </div>
                                          <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">{selectedOrder.deliveryType}</span>
                                       </div>
                                    </div>
                                    <div className="col-span-1 sm:col-span-2 space-y-4">
                                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Coordinates</h4>
                                       <div className="p-6 bg-white border border-slate-100 rounded-2xl flex gap-4">
                                          <div className="shrink-0 text-slate-300">
                                             <Activity size={20} />
                                          </div>
                                          <p className="text-sm font-medium text-slate-600 leading-relaxed">{selectedOrder.address}</p>
                                       </div>
                                    </div>
                                 </section>
                              </div>
                              
                              <div className="p-10 border-t border-slate-100 bg-slate-50 flex gap-4">
                                 <button className="flex-1 py-5 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2 hover:bg-slate-100 transition-all">
                                    <MessageSquare size={16} />
                                    Contact Client
                                 </button>
                                 <button className="flex-1 py-5 rounded-2xl bg-brand-green text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-brand-green/20 hover:scale-[1.02] active:scale-95 transition-all">
                                    <CheckCircle2 size={16} />
                                    Review Completed
                                 </button>
                              </div>
                           </motion.div>
                        </>
                     )}
                  </AnimatePresence>
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
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Carbs (g)</label>
                        <input 
                          type="number" 
                          value={editingProduct?.carbs || ''}
                          onChange={e => setEditingProduct(prev => ({ ...prev, carbs: Number(e.target.value) }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-green"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fiber (g)</label>
                        <input 
                          type="number" 
                          value={editingProduct?.fiber || ''}
                          onChange={e => setEditingProduct(prev => ({ ...prev, fiber: Number(e.target.value) }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-green"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Product Availability</p>
                        <p className="text-[10px] text-slate-400 font-medium">Control item visibility on the main menu</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setEditingProduct(prev => ({ ...prev, isAvailable: !prev?.isAvailable }))}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative p-1",
                          editingProduct?.isAvailable ? "bg-brand-green" : "bg-slate-300"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-full bg-white transition-all",
                          editingProduct?.isAvailable ? "translate-x-6" : "translate-x-0"
                        )} />
                      </button>
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
        </motion.div>
      )}
    </AnimatePresence>

    {/* Global Admin Toast */}
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20 min-w-[300px]"
          style={{ 
            backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 
                           toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 
                           'rgba(15, 23, 42, 0.95)',
            color: 'white'
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : 
           toast.type === 'error' ? <X size={20} /> : <Activity size={20} />}
          <span className="text-sm font-bold tracking-tight">{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            className="ml-auto w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all opacity-60 hover:opacity-100"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
