export interface CartItem {
  id: string;
  type: "product" | "quote";
  productId?: string;
  slug?: string;
  name: string;
  price: number;
  currency: string;
  imageUrl?: string;
  quantity: number;
  quoteOptionId?: string;
  quoteRequestId?: string;
  tier?: string;
  supplierName?: string;
}

export interface FavoriteItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  rating: number;
}

export interface WishlistList {
  id: string;
  name: string;
  createdAt: string;
}

export interface WishlistsState {
  lists: WishlistList[];
  items: Record<string, FavoriteItem>;
  membership: Record<string, string[]>;
  defaultListId: string;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  type: "product" | "quote";
  slug?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  createdAt: string;
  userId?: string;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "sourcing"
  | "purchased"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface CheckoutPayload {
  items: CartItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: "card" | "eft" | "demo";
  courierId?: string;
  courierName?: string;
  shippingInternalCost?: number;
  customerShippingCharge?: number;
}
