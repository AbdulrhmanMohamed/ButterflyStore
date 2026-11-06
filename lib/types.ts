export interface Company {
  id: string;
  name: string;
  nameEn: string;
  logo: string;
  description: string;
  descriptionEn: string;
  active: boolean;
  createdAt: any;
}

export interface Category {
  id: string;
  companyId: string;
  name: string;
  nameEn: string;
  parentId: string | null;
  createdAt: any;
}

export interface Product {
  id: string;
  companyId: string;
  categoryId: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  price: number;
  images: string[];
  discountPercentage: number;
  variantAttrs: string[];
  active: boolean;
  createdAt: any;
}

export interface Variant {
  id: string;
  productId: string;
  attrs: Record<string, string>;
  sku: string;
  price: number;
  stock: number;
  showStock: boolean;
  image: string;
  images: string[];
  active: boolean;
  createdAt: any;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address?: string;
  paymentMethod?: string;
  items: any[];
  total: number;
  finalTotal: number;
  status: string;
  createdAt: any;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: "owner" | "merchant" | "admin" | "client";
  createdAt: any;
}

export interface DiscountCode {
  id: string;
  code: string;
  percentage: number;
  active: boolean;
  [key: string]: any;
}

export interface PaymentMethod {
  id: string;
  name: string;
  nameEn: string;
  active: boolean;
  [key: string]: any;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  [key: string]: any;
}
