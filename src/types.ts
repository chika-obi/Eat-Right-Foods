export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand: string;
  expiry: string;
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
}

export interface Order {
  id: string;
  date: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  address: string;
  deliveryType: DeliveryType;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Nigerian' | 'Continental' | 'Healthy' | 'Drinks';
  image: string;
  reviews: Review[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fiber?: number;
  isAvailable?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'dispatched' | 'delivered';

export type DeliveryType = 'standard' | 'express' | 'scheduled';

export interface DeliveryOption {
  id: DeliveryType;
  label: string;
  price: number;
  description: string;
}

export interface OrderTrackingInfo {
  id: string;
  status: OrderStatus;
  estimatedDelivery: string;
  items: string[];
  timestamp: string;
}
