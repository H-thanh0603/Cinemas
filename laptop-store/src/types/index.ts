export type BrandId =
  | "apple"
  | "dell"
  | "asus"
  | "lenovo"
  | "hp"
  | "msi"
  | "acer";

export type CategoryId = "gaming" | "office" | "ultralight" | "creator";

export interface ProductSpecs {
  cpu: string;
  ram: string;
  storage: string;
  gpu: string;
  display: string;
  battery: string;
  weight: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: BrandId;
  category: CategoryId;
  price: number;
  salePrice?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  tags: string[];
  description: string;
  specs: ProductSpecs;
  images: string[];
  featured?: boolean;
  deal?: boolean;
}

export interface Brand {
  id: BrandId;
  name: string;
}

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  date: string;
  author: string;
  content: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  code: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  shippingAddress: string;
  customerName: string;
  phone: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
}
