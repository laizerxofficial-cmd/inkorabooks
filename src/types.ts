export type Book = {
  id: string;
  title: string;
  slug: string;
  author: string;
  price: number;
  image: string;
  description: string;
  category: string;
  whoIsItFor: string[];
  keyTakeaways: string[];
  isBestSeller?: boolean;
  discount?: number;
};

export type Bundle = {
  id: string;
  title: string;
  books: Book[];
  price: number;
  originalPrice: number;
  image: string;
  description: string;
  discount?: number;
};

export type CartItem = {
  id: string;
  type: 'book' | 'bundle';
  item: Book | Bundle;
  quantity: number;
};

export type Page = 'home' | 'shop' | 'bundles' | 'product' | 'checkout' | 'about' | 'faq' | 'admin' | 'admin-login' | 'profile' | 'privacy' | 'terms' | 'shipping' | 'refund';

export type User = {
  id: number;
  email: string;
  profilePic: string;
  fullName?: string;
  isAdmin?: number;
};
