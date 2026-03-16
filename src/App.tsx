import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import Cropper, { Area, Point } from 'react-easy-crop';
import {
  ShoppingBag,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  Truck,
  ShieldCheck,
  MessageCircle,
  Search,
  Plus,
  Minus,
  Trash2,
  Upload,
  CreditCard,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Lock,
  Mail,
  Camera,
  TrendingUp,
  MapPin,
  Package,
  Calendar,
  ChevronRight,
  Phone,
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  AlertCircle,
  Facebook
} from 'lucide-react';
import { Book, Bundle, CartItem, Page, User } from './types';
import { BOOKS, BUNDLES } from './constants';

// --- Components ---

// --- Helper Functions ---

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return canvas.toDataURL('image/jpeg');
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled error in React app:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-ink p-6">
          <div className="max-w-lg w-full rounded-2xl border border-ink/10 shadow-lg p-8">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="mb-4">An unexpected error occurred while rendering the app.</p>
            <pre className="text-xs bg-ink/5 rounded-lg p-4 overflow-x-auto">
              {this.state.error?.stack || this.state.error?.message}
            </pre>
            <p className="mt-4 text-sm text-ink/60">Check the browser console for more details.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ImageCropperModal = ({
  image,
  onCropComplete,
  onCancel,
  aspect = 3 / 4
}: {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspect?: number;
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDone = async () => {
    if (croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels);
        onCropComplete(croppedImage);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[80vh]"
      >
        <div className="p-6 border-b border-ink/5 flex justify-between items-center">
          <h3 className="text-xl font-serif font-bold">Crop Image</h3>
          <button onClick={onCancel} className="p-2 hover:bg-ink/5 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>
        
        <div className="relative flex-1 bg-ink/5">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="p-6 space-y-6 bg-white">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-ink/40 uppercase tracking-widest">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1.5 bg-ink/5 rounded-lg appearance-none cursor-pointer accent-teal"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 bg-ink/5 py-3 rounded-xl font-bold hover:bg-ink/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDone}
              className="flex-1 bg-teal text-white py-3 rounded-xl font-bold hover:bg-teal/90 transition-all shadow-lg shadow-teal/20"
            >
              Apply Crop
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const Navbar = ({
  currentPage,
  setPage,
  cartCount,
  toggleCart,
  user,
  onLogout,
  onOpenAuth,
  onOpenSearch
}: {
  currentPage: Page;
  setPage: (p: Page) => void;
  cartCount: number;
  toggleCart: () => void;
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenSearch: () => void;
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { width } = useWindowSize();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: { label: string; path: string }[] = [
    { label: 'Home', path: '/' },
    { label: 'Shop', path: '/shop' },
    { label: 'Bundles', path: '/bundles' },
    { label: 'About', path: '/about' },
    { label: 'FAQ', path: '/faq' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-white/70 backdrop-blur-xl py-4 shadow-sm' : 'bg-transparent py-8'}`}
    >
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
              <img src="/logo.png" alt="INKORA Logo" className="w-full h-full object-contain" />
            </div>
          </motion.div>
          <span className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-ink hidden xs:block logo_color">INKORA</span>
        </Link>

        {/* Desktop Nav */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:flex items-center gap-2 bg-ink/5 p-1.5 rounded-full backdrop-blur-md border border-ink/5 relative"
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all relative z-10 ${isActive(link.path) ? 'text-ink' : 'text-ink/50 hover:text-ink'}`}
            >
              {link.label}
              {isActive(link.path) && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-white rounded-full shadow-sm -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-4"
        >
          <button
            onClick={onOpenSearch}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-ink/5 flex items-center justify-center text-ink/70 hover:text-teal hover:border-teal transition-all"
          >
            <Search size={18} className="sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={toggleCart}
            className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-ink text-white flex items-center justify-center hover:bg-teal transition-all shadow-lg shadow-ink/10"
          >
            <ShoppingBag size={18} className="sm:w-5 sm:h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-bronze text-white text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

          <div className="relative">
            {user ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-ink/5 overflow-hidden hover:border-teal transition-all"
              >
                <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-bronze text-white flex items-center justify-center hover:bg-bronze/90 transition-all shadow-lg shadow-bronze/10"
              >
                <UserIcon size={18} className="sm:w-5 sm:h-5" />
              </button>
            )}

            <AnimatePresence>
              {isUserMenuOpen && user && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-56 bg-white rounded-2xl shadow-2xl border border-ink/5 p-2 z-[60]"
                >
                  <div className="p-4 border-b border-ink/5 mb-2">
                    <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">Logged in as</p>
                    <p className="font-bold truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-ink/5 transition-colors text-sm font-bold"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <UserIcon size={18} className="text-teal" />
                    My Profile
                  </Link>
                  <button
                    onClick={() => { onLogout(); setIsUserMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-500 transition-colors text-sm font-bold"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Liquid Crystal Hamburger Icon */}
          <button
            className="md:hidden relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-ink overflow-hidden group transition-all hover:bg-white/20 active:scale-95"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal/20 to-bronze/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col gap-1 sm:gap-1.5 items-center justify-center w-5 h-5 sm:w-6 sm:h-6">
              <motion.span
                animate={isMobileMenuOpen ? { rotate: 45, y: width < 640 ? 5 : 7, width: '100%' } : { rotate: 0, y: 0, width: '70%' }}
                className="h-0.5 bg-ink rounded-full origin-center transition-all duration-300"
              />
              <motion.span
                animate={isMobileMenuOpen ? { opacity: 0, x: 20 } : { opacity: 1, x: 0, width: '100%' }}
                className="h-0.5 bg-ink rounded-full transition-all duration-300"
              />
              <motion.span
                animate={isMobileMenuOpen ? { rotate: -45, y: width < 640 ? -5 : -7, width: '100%' } : { rotate: 0, y: 0, width: '40%' }}
                className="h-0.5 bg-ink rounded-full origin-center transition-all duration-300"
              />
            </div>
          </button>
        </motion.div>
      </div>

      {/* Mobile Menu - Liquid Crystal Style */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, y: 0, backdropFilter: 'blur(24px)' }}
            exit={{ opacity: 0, y: -20, backdropFilter: 'blur(0px)' }}
            className="md:hidden fixed inset-x-0 top-[72px] sm:top-[88px] mx-4 sm:mx-6 bg-white/80 border border-white/40 rounded-[2.5rem] overflow-hidden shadow-2xl z-50"
          >
            <div className="flex flex-col p-6 gap-2">
              {navLinks.map((link, idx) => (
                <motion.button
                  key={link.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    navigate(link.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-xl font-serif font-bold p-4 rounded-2xl transition-all text-left flex items-center justify-between group ${isActive(link.path) ? 'bg-teal/10 text-teal' : 'text-ink/70 hover:bg-ink/5'}`}
                >
                  {link.label}
                  <ArrowRight size={18} className={`transition-transform ${isActive(link.path) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                </motion.button>
              ))}
              {!user && (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => { onOpenAuth(); setIsMobileMenuOpen(false); }}
                  className="mt-4 bg-ink text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-ink/20 active:scale-95 transition-transform"
                >
                  <UserIcon size={20} />
                  Login / Register
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

const CartDrawer = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  updateQuantity, 
  removeItem,
  onCheckout
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  cartItems: CartItem[];
  updateQuantity: (id: string, type: 'book' | 'bundle', delta: number) => void;
  removeItem: (id: string, type: 'book' | 'bundle') => void;
  onCheckout: () => void;
}) => {
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.type === 'book' 
      ? (item.item as Book).price - ((item.item as Book).discount || 0)
      : item.item.price;
    return acc + (price * item.quantity);
  }, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-ink/5 flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold">Your Library</h2>
              <button onClick={onClose} className="p-2 hover:bg-ink/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <ShoppingBag size={48} className="text-ink/10" />
                  <p className="text-ink/50">Your cart is empty. Start building your knowledge.</p>
                  <button 
                    onClick={onClose}
                    className="text-teal font-medium hover:underline"
                  >
                    Browse Books
                  </button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {cartItems.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-4 group"
                    >
                      <div className="w-20 h-28 bg-ink/5 rounded overflow-hidden flex-shrink-0">
                        <img src={item.item.image} alt={item.item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-bold text-sm line-clamp-1 group-hover:text-teal transition-colors">{item.item.title}</h3>
                          <p className="text-[10px] text-ink/40 uppercase tracking-widest font-bold">
                            {item.type === 'bundle' ? 'Bundle' : (item.item as Book).author}
                          </p>
                          {item.type === 'bundle' && (
                            <div className="mt-1 space-y-0.5">
                              {(item.item as Bundle).books.map((b, i) => (
                                <p key={i} className="text-[9px] text-ink/40 leading-tight flex items-center gap-1">
                                  <CheckCircle2 size={8} className="text-teal/40" />
                                  {typeof b === 'string' ? b : b.title}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center bg-ink/5 rounded-lg overflow-hidden">
                            <button 
                              onClick={() => updateQuantity(item.id, item.type, -1)}
                              className="p-1.5 hover:bg-teal hover:text-white transition-all"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-3 text-xs font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.type, 1)}
                              className="p-1.5 hover:bg-teal hover:text-white transition-all"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end gap-0.5">
                              {item.type === 'book' && (item.item as Book).discount ? (item.item as Book).discount! > 0 && (
                                <span className="text-[10px] text-ink/30 line-through">Rs. {item.item.price.toLocaleString()}</span>
                              ) : null}
                              <span className="text-sm font-bold text-teal">
                                Rs. {item.type === 'book' 
                                  ? ((item.item as Book).price - ((item.item as Book).discount || 0)).toLocaleString() 
                                  : item.item.price.toLocaleString()}
                              </span>
                            </div>
                            <button 
                              onClick={() => removeItem(item.id, item.type)}
                              className="text-ink/20 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 border-t border-ink/5 bg-paper/50 space-y-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <p className="text-xs text-ink/50">Shipping and taxes calculated at checkout.</p>
                <button 
                  onClick={onCheckout}
                  className="w-full bg-teal text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal/90 transition-all shadow-lg shadow-teal/20"
                >
                  Proceed to Checkout
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const SearchOverlay = ({ 
  isOpen, 
  onClose, 
  setPage, 
  setSelectedBook,
  books
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  setPage: (p: Page) => void; 
  setSelectedBook: (b: Book) => void;
  books: Book[];
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const categories = ['All', ...new Set(books.map(b => b.category))];

  const results = books.filter(b => {
    const matchesQuery = query.length > 1 
      ? b.title.toLowerCase().includes(query.toLowerCase()) || 
        b.author.toLowerCase().includes(query.toLowerCase()) ||
        b.description.toLowerCase().includes(query.toLowerCase())
      : true;
    
    const matchesCategory = activeCategory === 'All' || b.category === activeCategory;
    
    return matchesQuery && matchesCategory && (query.length > 1 || activeCategory !== 'All');
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-2xl p-6 md:p-20 overflow-y-auto"
        >
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-teal uppercase tracking-[0.3em]">Search the Library</p>
              <button 
                onClick={onClose}
                className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center hover:bg-ink/10 transition-all hover:rotate-90"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              <div className="relative">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-ink/20" size={40} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search by title, author, or keywords..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-ink/10 py-8 pl-14 text-4xl md:text-7xl font-serif focus:outline-none focus:border-teal transition-colors placeholder:text-ink/10"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-teal text-white shadow-lg shadow-teal/20' : 'bg-ink/5 text-ink/40 hover:bg-ink/10'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {results.map((book) => (
                  <motion.div 
                    key={book.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => {
                      setSelectedBook(book);
                      onClose();
                    }}
                    className="flex gap-6 p-6 rounded-[2rem] bg-white border border-ink/5 hover:border-teal/20 hover:shadow-2xl hover:shadow-teal/5 cursor-pointer transition-all group"
                  >
                    <div className="w-24 h-32 rounded-xl overflow-hidden shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                      <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 py-1 space-y-2 min-w-0">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-teal uppercase tracking-widest">{book.category}</p>
                        <h4 className="font-serif font-bold text-lg group-hover:text-teal transition-colors truncate">{book.title}</h4>
                        <p className="text-sm text-ink/40 truncate">by {book.author}</p>
                      </div>
                      <p className="font-bold text-ink">Rs. {book.price.toLocaleString()}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {(query.length > 1 || activeCategory !== 'All') && results.length === 0 && (
                <div className="col-span-full py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-ink/5 rounded-full flex items-center justify-center mx-auto text-ink/20">
                    <Search size={40} />
                  </div>
                  <p className="text-ink/40 italic text-xl font-serif">No books found matching your criteria</p>
                  <button 
                    onClick={() => { setQuery(''); setActiveCategory('All'); }}
                    className="text-teal font-bold uppercase tracking-widest text-sm hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AuthModals = ({ 
  isOpen, 
  onClose, 
  onLogin 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onLogin: (u: User) => void;
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, profilePic, fullName })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
        onClose();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
        onClose();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 md:p-12 space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-serif font-bold">
                  {mode === 'login' ? 'Welcome Back' : 'Join INKORA'}
                </h2>
                <p className="text-ink/50 text-sm">
                  {mode === 'login' ? 'Enter your credentials to continue' : 'Create an account to start building'}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold flex items-center gap-2">
                  <X size={16} /> {error}
                </div>
              )}

              <form className="space-y-4" onSubmit={mode === 'login' ? handleLogin : handleRegister}>
                {mode === 'register' && (
                  <>
                    <div className="flex flex-col items-center gap-4 mb-6">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full border-4 border-teal/20 overflow-hidden bg-teal/5">
                          <img src={profilePic} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <button 
                          type="button"
                          onClick={() => setProfilePic(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`)}
                          className="absolute bottom-0 right-0 w-8 h-8 bg-teal text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        >
                          <Camera size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] font-bold text-teal uppercase tracking-widest">Choose your avatar</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-ink/40 uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" size={18} />
                        <input 
                          required
                          type="text" 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-ink/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-teal/20 transition-all font-medium"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink/40 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" size={18} />
                    <input 
                      required
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-ink/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-teal/20 transition-all font-medium"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink/40 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" size={18} />
                    <input 
                      required
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-ink/5 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-teal/20 transition-all font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button 
                  disabled={loading}
                  className="w-full bg-ink text-white py-4 rounded-2xl font-bold hover:bg-teal transition-all shadow-xl shadow-ink/10 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="text-center pt-4 border-t border-ink/5 mt-4">
                {mode === 'login' ? (
                  <p className="text-sm text-ink/50">
                    Don't have an account? <button onClick={() => setMode('register')} className="text-teal font-bold hover:underline ml-1">Register here</button>
                  </p>
                ) : (
                  <p className="text-sm text-ink/50">
                    Already have an account? <button onClick={() => setMode('login')} className="text-teal font-bold hover:underline ml-1">Login here</button>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = "Delete",
  confirmColor = "bg-red-500"
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string;
  confirmText?: string;
  confirmColor?: string;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 text-center space-y-6"
          >
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-bold">{title}</h3>
              <p className="text-ink/50 text-sm">{message}</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 bg-ink/5 py-3 rounded-xl font-bold hover:bg-ink/10 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => { onConfirm(); onClose(); }}
                className={`flex-1 ${confirmColor} text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ManageBooks = ({ books, onUpdate }: { books: Book[], onUpdate: () => void }) => {
  const [editingBook, setEditingBook] = useState<Partial<Book> | null>(null);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'book' | 'bundle') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'book') {
          setImageToCrop(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setEditingBook(prev => prev ? { ...prev, image: croppedImage } : null);
    setImageToCrop(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(editingBook)
      });
      if (res.ok) {
        onUpdate();
        setEditingBook(null);
      }
    } catch (err) {
      alert('Failed to save book');
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (id: string) => {
    try {
      console.log('Attempting to delete book with ID:', id);
      const res = await fetch(`/api/admin/books/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      const data = await res.json();
      console.log('Delete response:', data);

      if (res.ok && data.success) {
        onUpdate();
      } else {
        alert(`Failed to delete book: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete book. Please check your connection.');
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <ConfirmationModal 
        isOpen={!!deletingBookId}
        onClose={() => setDeletingBookId(null)}
        onConfirm={() => deletingBookId && deleteBook(deletingBookId)}
        title="Delete Book"
        message="Are you sure you want to delete this book? This action cannot be undone and will remove it from the library."
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-serif font-bold">Manage Books</h2>
        <button 
          onClick={() => setEditingBook({ id: Date.now().toString(), title: '', author: '', price: undefined, image: '', description: '', category: 'Business', whoIsItFor: [], keyTakeaways: [], isBestSeller: false, discount: undefined })}
          className="w-full sm:w-auto bg-teal text-white px-6 py-3 rounded-xl font-bold hover:bg-teal/90 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add New Book
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {books.map(book => (
          <div key={book.id} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-ink/5 shadow-sm flex gap-4 md:gap-6">
            <div className="w-20 h-28 md:w-24 md:h-32 rounded-xl overflow-hidden bg-ink/5 flex-shrink-0 shadow-md">
              <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 space-y-1 md:space-y-2 min-w-0">
              <h3 className="font-bold text-sm md:text-base truncate">{book.title}</h3>
              <p className="text-xs text-ink/40 truncate">{book.author}</p>
              <p className="text-teal font-bold text-sm md:text-base">Rs. {book.price.toLocaleString()}</p>
              <div className="flex gap-2 pt-1 md:pt-2">
                <button onClick={() => setEditingBook(book)} className="flex-1 bg-ink/5 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold hover:bg-ink/10 transition-all">Edit</button>
                <button onClick={() => setDeletingBookId(book.id)} className="flex-1 bg-red-50 text-red-500 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold hover:bg-red-100 transition-all">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {imageToCrop && (
          <ImageCropperModal 
            image={imageToCrop}
            onCropComplete={handleCropComplete}
            onCancel={() => setImageToCrop(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingBook && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingBook(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl p-6 md:p-10 overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-xl md:text-2xl font-serif font-bold mb-6 md:mb-8">{editingBook.id ? 'Edit Book' : 'Add Book'}</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Title</label>
                  <input required value={editingBook.title} onChange={e => setEditingBook({...editingBook, title: e.target.value})} className="w-full bg-ink/5 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-teal/20 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Author</label>
                  <input required value={editingBook.author} onChange={e => setEditingBook({...editingBook, author: e.target.value})} className="w-full bg-ink/5 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-teal/20 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Price (Rs.)</label>
                  <input required type="number" value={editingBook.price || ''} onChange={e => setEditingBook({...editingBook, price: e.target.value === '' ? undefined : Number(e.target.value)})} placeholder="0" className="w-full bg-ink/5 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-teal/20 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Discount (Rs.)</label>
                  <input type="number" value={editingBook.discount || ''} onChange={e => setEditingBook({...editingBook, discount: e.target.value === '' ? undefined : Number(e.target.value)})} placeholder="0" className="w-full bg-ink/5 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-teal/20 text-sm" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Book Cover</label>
                  <div className="flex flex-col gap-4">
                    <div 
                      className="w-full h-24 md:h-32 border-2 border-dashed border-ink/10 rounded-2xl flex flex-col items-center justify-center bg-ink/5 hover:bg-ink/10 transition-all cursor-pointer relative group"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setImageToCrop(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    >
                      <Upload size={20} className="text-ink/20 group-hover:text-teal transition-colors" />
                      <p className="text-[8px] md:text-[10px] font-bold text-ink/40 mt-2 uppercase tracking-widest">Drop cover image here</p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, 'book')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    {editingBook.image && (
                      <div className="flex items-center gap-4 p-3 md:p-4 bg-teal/5 rounded-xl border border-teal/10">
                        <div className="w-10 h-14 md:w-12 md:h-16 rounded-lg overflow-hidden shadow-md">
                          <img src={editingBook.image} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] md:text-[10px] font-bold text-teal uppercase tracking-widest">Image Selected</p>
                          <p className="text-[10px] md:text-xs text-ink/40 truncate">{editingBook.image.startsWith('data:') ? 'Base64 Image Data' : editingBook.image}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setEditingBook({ ...editingBook, image: '' })}
                          className="text-red-500 hover:text-red-600 p-2"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Description</label>
                  <textarea required value={editingBook.description} onChange={e => setEditingBook({...editingBook, description: e.target.value})} className="w-full bg-ink/5 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-teal/20 h-20 md:h-24 text-sm" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Who is it for (comma separated)</label>
                  <input value={editingBook.whoIsItFor?.join(', ')} onChange={e => setEditingBook({...editingBook, whoIsItFor: e.target.value.split(',').map(s => s.trim()).filter(s => s)})} className="w-full bg-ink/5 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-teal/20 text-sm" placeholder="Entrepreneurs, Students, etc." />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Key Takeaways (comma separated)</label>
                  <input value={editingBook.keyTakeaways?.join(', ')} onChange={e => setEditingBook({...editingBook, keyTakeaways: e.target.value.split(',').map(s => s.trim()).filter(s => s)})} className="w-full bg-ink/5 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-teal/20 text-sm" placeholder="Small changes lead to big results, etc." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Category</label>
                  <select value={editingBook.category} onChange={e => setEditingBook({...editingBook, category: e.target.value})} className="w-full bg-ink/5 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-teal/20 text-sm">
                    <option value="Business">Business</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Mindset">Mindset</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-4 md:pt-6">
                  <input type="checkbox" checked={editingBook.isBestSeller} onChange={e => setEditingBook({...editingBook, isBestSeller: e.target.checked})} className="w-5 h-5 rounded border-ink/10 text-teal focus:ring-teal" />
                  <label className="text-sm font-bold">Best Seller</label>
                </div>
                <div className="md:col-span-2 flex gap-3 md:gap-4 pt-4">
                  <button type="button" onClick={() => setEditingBook(null)} className="flex-1 bg-ink/5 py-3 md:py-4 rounded-xl font-bold hover:bg-ink/10 transition-all text-sm">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 bg-teal text-white py-3 md:py-4 rounded-xl font-bold hover:bg-teal/90 transition-all shadow-lg shadow-teal/20 text-sm">
                    {loading ? 'Saving...' : 'Save Book'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ManageBundles = ({ bundles, books, onUpdate }: { bundles: Bundle[], books: Book[], onUpdate: () => void }) => {
  const [editingBundle, setEditingBundle] = useState<Partial<Bundle> | null>(null);
  const [deletingBundleId, setDeletingBundleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setEditingBundle(prev => prev ? { ...prev, image: croppedImage } : null);
    setImageToCrop(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bundles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(editingBundle)
      });
      if (res.ok) {
        onUpdate();
        setEditingBundle(null);
      }
    } catch (err) {
      alert('Failed to save bundle');
    } finally {
      setLoading(false);
    }
  };

  const deleteBundle = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/bundles/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUpdate();
      } else {
        alert(`Failed to delete bundle: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to delete bundle. Please check your connection.');
    }
  };

  const toggleBookInBundle = (bookId: string) => {
    const currentBooks = (editingBundle?.books as any as string[]) || [];
    const newBooks = currentBooks.includes(bookId) 
      ? currentBooks.filter(id => id !== bookId)
      : [...currentBooks, bookId];
    setEditingBundle({ ...editingBundle, books: newBooks as any });
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <ConfirmationModal 
        isOpen={!!deletingBundleId}
        onClose={() => setDeletingBundleId(null)}
        onConfirm={() => deletingBundleId && deleteBundle(deletingBundleId)}
        title="Delete Bundle"
        message="Are you sure you want to delete this bundle? This action cannot be undone."
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-serif font-bold">Manage Bundles</h2>
        <button 
          onClick={() => setEditingBundle({ id: 'b' + Date.now().toString(), title: '', books: [], price: undefined, originalPrice: undefined, image: '', description: '', discount: undefined })}
          className="w-full sm:w-auto bg-teal text-white px-6 py-3 rounded-xl font-bold hover:bg-teal/90 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add New Bundle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {bundles.map(bundle => (
          <div key={bundle.id} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-ink/5 shadow-sm flex flex-col sm:flex-row gap-4 md:gap-6">
            <div className="w-full sm:w-32 h-40 sm:h-32 rounded-2xl overflow-hidden bg-ink/5 flex-shrink-0 shadow-md">
              <img src={bundle.image} alt={bundle.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 space-y-1 md:space-y-2 min-w-0">
              <h3 className="font-bold text-sm md:text-base truncate">{bundle.title}</h3>
              <p className="text-xs text-ink/40 line-clamp-2">{bundle.description}</p>
              <div className="flex items-center gap-3">
                <p className="text-teal font-bold text-sm md:text-base">Rs. {bundle.price.toLocaleString()}</p>
                <p className="text-[10px] md:text-xs text-ink/30 line-through">Rs. {bundle.originalPrice.toLocaleString()}</p>
              </div>
              <div className="flex gap-2 pt-1 md:pt-2">
                <button onClick={() => setEditingBundle(bundle)} className="flex-1 bg-ink/5 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold hover:bg-ink/10 transition-all">Edit</button>
                <button onClick={() => setDeletingBundleId(bundle.id)} className="flex-1 bg-red-50 text-red-500 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold hover:bg-red-100 transition-all">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {imageToCrop && (
          <ImageCropperModal 
            image={imageToCrop}
            onCropComplete={handleCropComplete}
            onCancel={() => setImageToCrop(null)}
            aspect={16 / 9}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingBundle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingBundle(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl p-6 md:p-10 overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-xl md:text-2xl font-serif font-bold mb-6 md:mb-8">{editingBundle.id ? 'Edit Bundle' : 'Add Bundle'}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Title</label>
                    <input required value={editingBundle.title} onChange={e => setEditingBundle({...editingBundle, title: e.target.value})} className="w-full bg-ink/5 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-teal/20 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Bundle Cover</label>
                    <div className="flex flex-col gap-4">
                      <div 
                        className="w-full h-24 md:h-32 border-2 border-dashed border-ink/10 rounded-2xl flex flex-col items-center justify-center bg-ink/5 hover:bg-ink/10 transition-all cursor-pointer relative group"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setImageToCrop(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      >
                        <Upload size={20} className="text-ink/20 group-hover:text-teal transition-colors" />
                        <p className="text-[8px] md:text-[10px] font-bold text-ink/40 mt-2 uppercase tracking-widest">Drop bundle image here</p>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      {editingBundle.image && (
                        <div className="flex items-center gap-4 p-3 md:p-4 bg-teal/5 rounded-xl border border-teal/10">
                          <div className="w-10 h-14 md:w-12 md:h-16 rounded-lg overflow-hidden shadow-md">
                            <img src={editingBundle.image} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[8px] md:text-[10px] font-bold text-teal uppercase tracking-widest">Image Selected</p>
                            <p className="text-[10px] md:text-xs text-ink/40 truncate">{editingBundle.image.startsWith('data:') ? 'Base64 Image Data' : editingBundle.image}</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setEditingBundle({ ...editingBundle, image: '' })}
                            className="text-red-500 hover:text-red-600 p-2"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Bundle Price (Rs.)</label>
                    <input required type="number" value={editingBundle.price || ''} onChange={e => setEditingBundle({...editingBundle, price: e.target.value === '' ? undefined : Number(e.target.value)})} placeholder="0" className="w-full bg-ink/5 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-teal/20 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Original Price (Rs.)</label>
                    <input required type="number" value={editingBundle.originalPrice || ''} onChange={e => setEditingBundle({...editingBundle, originalPrice: e.target.value === '' ? undefined : Number(e.target.value)})} placeholder="0" className="w-full bg-ink/5 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-teal/20 text-sm" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Description</label>
                  <textarea required value={editingBundle.description} onChange={e => setEditingBundle({...editingBundle, description: e.target.value})} className="w-full bg-ink/5 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-teal/20 h-20 md:h-24 text-sm" />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Select Books in Bundle</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 max-h-48 overflow-y-auto p-2 bg-ink/5 rounded-2xl">
                    {books.map(book => (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => toggleBookInBundle(book.id)}
                        className={`p-2 rounded-xl border-2 transition-all text-left space-y-2 ${((editingBundle.books as any) || []).includes(book.id) ? 'border-teal bg-teal/5' : 'border-transparent bg-white'}`}
                      >
                        <div className="aspect-[3/4] rounded-lg overflow-hidden">
                          <img src={book.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[8px] md:text-[10px] font-bold truncate">{book.title}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 md:gap-4 pt-4">
                  <button type="button" onClick={() => setEditingBundle(null)} className="flex-1 bg-ink/5 py-3 md:py-4 rounded-xl font-bold hover:bg-ink/10 transition-all text-sm">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 bg-teal text-white py-3 md:py-4 rounded-xl font-bold hover:bg-teal/90 transition-all shadow-lg shadow-teal/20 text-sm">
                    {loading ? 'Saving...' : 'Save Bundle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        onLogin();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-12 space-y-8 border border-ink/5"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-ink text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-serif font-bold">Admin Portal</h1>
          <p className="text-ink/50 text-sm">Secure access for INKORA administrators only.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold flex items-center gap-2">
            <X size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-ink/40 uppercase tracking-widest ml-1">Admin Email</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink/5 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-teal/20 transition-all font-medium"
              placeholder="admin@inkora.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-ink/40 uppercase tracking-widest ml-1">Password</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink/5 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-teal/20 transition-all font-medium"
              placeholder="••••••••"
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-ink text-white py-5 rounded-2xl font-bold hover:bg-teal transition-all shadow-xl shadow-ink/10 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const AdminPage = ({ onLogout, books, bundles, fetchBooks, fetchBundles }: { 
  onLogout: () => void, 
  books: Book[], 
  bundles: Bundle[], 
  fetchBooks: () => void, 
  fetchBundles: () => void 
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'books' | 'bundles' | 'users'>('orders');
  const [users, setUsers] = useState<any[]>([]);

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    })
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  const fetchAnalytics = () => {
    fetch('/api/admin/analytics', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    })
      .then(res => res.json())
      .then(data => setAnalytics(data));
  };

  const fetchUsers = () => {
    fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    })
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    fetchOrders();
    fetchAnalytics();
    fetchBooks();
    fetchBundles();
    fetchUsers();
  }, []);

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null);
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to delete order');
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  
  const stats = {
    total: orders.length,
    revenue: orders.reduce((acc, o) => acc + o.total, 0),
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length
  };

  return (
    <div className="pt-24 md:pt-32 pb-20 max-w-7xl mx-auto px-4 md:px-6 space-y-8 md:space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Admin Dashboard</h1>
          <p className="text-ink/50 text-sm md:text-base">Manage and track all customer orders.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <button 
            onClick={onLogout}
            className="bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2 order-2 sm:order-1"
          >
            <LogOut size={18} />
            Logout
          </button>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 order-1 sm:order-2">
            {[
              { label: 'Orders', value: stats.total, color: 'teal', icon: <Package size={16} />, bg: 'bg-teal-50', text: 'text-teal-600' },
              { label: 'Revenue', value: `Rs. ${stats.revenue.toLocaleString()}`, color: 'bronze', icon: <TrendingUp size={16} />, bg: 'bg-orange-50', text: 'text-orange-600' },
              { label: 'Pending', value: stats.pending, color: 'orange', icon: <Calendar size={16} />, bg: 'bg-orange-50', text: 'text-orange-600' },
              { label: 'Delivered', value: stats.delivered, color: 'green', icon: <CheckCircle2 size={16} />, bg: 'bg-green-50', text: 'text-green-600' }
            ].map((stat, i) => (
              <div key={i} className={`bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl border border-ink/5 shadow-sm`}>
                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg ${stat.bg} ${stat.text} flex items-center justify-center mb-2 md:mb-4`}>
                  {stat.icon}
                </div>
                <p className="text-[8px] md:text-[10px] font-bold text-ink/30 uppercase tracking-widest">{stat.label}</p>
                <p className="text-lg md:text-2xl font-bold truncate">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-8 border-b border-ink/5 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`pb-4 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'orders' ? 'text-teal' : 'text-ink/40 hover:text-ink'}`}
        >
          Orders
          {activeTab === 'orders' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal" />}
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`pb-4 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'analytics' ? 'text-teal' : 'text-ink/40 hover:text-ink'}`}
        >
          Best Sellers
          {activeTab === 'analytics' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal" />}
        </button>
        <button 
          onClick={() => setActiveTab('books')}
          className={`pb-4 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'books' ? 'text-teal' : 'text-ink/40 hover:text-ink'}`}
        >
          Manage Books
          {activeTab === 'books' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal" />}
        </button>
        <button 
          onClick={() => setActiveTab('bundles')}
          className={`pb-4 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'bundles' ? 'text-teal' : 'text-ink/40 hover:text-ink'}`}
        >
          Manage Bundles
          {activeTab === 'bundles' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal" />}
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-4 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'users' ? 'text-teal' : 'text-ink/40 hover:text-ink'}`}
        >
          Users
          {activeTab === 'users' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal" />}
        </button>
      </div>

      {activeTab === 'books' && (
        <ManageBooks books={books} onUpdate={fetchBooks} />
      )}

      {activeTab === 'bundles' && (
        <ManageBundles bundles={bundles} books={books} onUpdate={fetchBundles} />
      )}

      {activeTab === 'users' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold">Registered Users</h2>
            <div className="text-sm text-ink/40">Total: {users.length}</div>
          </div>
          <div className="bg-white border border-ink/5 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-ink/5 text-[10px] font-bold text-ink/40 uppercase tracking-widest">
                  <th className="px-8 py-4">ID</th>
                  <th className="px-8 py-4">Name</th>
                  <th className="px-8 py-4">Email</th>
                  <th className="px-8 py-4">Verified</th>
                  <th className="px-8 py-4">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-ink/5 transition-colors">
                    <td className="px-8 py-6 font-mono text-xs text-ink/40">#{user.id.toString().padStart(5, '0')}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-ink/5">
                          <img src={user.profilePic} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold">{user.fullName || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm">{user.email}</td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                        user.isVerified ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                        user.isAdmin ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {user.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {['all', 'pending', 'shipped', 'delivered', 'cancelled'].map(s => (
              <button 
                key={s}
                onClick={() => setFilter(s)}
                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filter === s ? 'bg-ink text-white shadow-lg' : 'bg-ink/5 text-ink/40 hover:bg-ink/10'}`}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white border border-ink/5 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-ink/5 text-[10px] font-bold text-ink/40 uppercase tracking-widest">
                    <th className="px-8 py-4">Order ID</th>
                    <th className="px-8 py-4">Customer</th>
                    <th className="px-8 py-4">Items</th>
                    <th className="px-8 py-4">Total</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {filteredOrders.map((order) => {
                    const items = JSON.parse(order.items);
                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-ink/5 transition-colors group cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="px-8 py-6 font-mono text-xs text-ink/40">#{order.id.toString().padStart(5, '0')}</td>
                        <td className="px-8 py-6">
                          <p className="font-bold">{order.firstName} {order.lastName}</p>
                          <p className="text-xs text-ink/40">{order.email}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex -space-x-2">
                            {items.slice(0, 3).map((item: any, i: number) => (
                              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-ink/5 overflow-hidden shadow-sm">
                                <img src={item.item.image} alt="" className="w-full h-full object-cover" />
                              </div>
                            ))}
                            {items.length > 3 && (
                              <div className="w-8 h-8 rounded-full border-2 border-white bg-ink/10 flex items-center justify-center text-[8px] font-bold text-ink/40">
                                +{items.length - 3}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 font-bold text-teal">Rs. {order.total.toLocaleString()}</td>
                        <td className="px-8 py-6">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                            order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-600' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <select 
                              value={order.status}
                              onChange={(e) => updateStatus(order.id, e.target.value)}
                              className="bg-ink/5 border-none rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-teal/20 transition-all cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {analytics?.bestSellers.map((item: any, i: number) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-8 rounded-[2.5rem] border border-ink/5 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex gap-6">
                <div className="w-24 h-32 rounded-xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-teal uppercase tracking-widest">{item.type}</span>
                    <h3 className="font-serif font-bold text-lg leading-tight">{item.title}</h3>
                  </div>
                  <div className="pt-4 border-t border-ink/5">
                    <p className="text-3xl font-bold text-ink">{item.count}</p>
                    <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Units Sold</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-6 md:inset-20 bg-white z-[110] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-ink/5 flex items-center justify-between bg-paper/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-ink text-white flex items-center justify-center">
                    <Package size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold">Order #{selectedOrder.id.toString().padStart(5, '0')}</h2>
                    <p className="text-xs text-ink/40 uppercase tracking-widest font-bold">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 rounded-full bg-ink/5 flex items-center justify-center hover:bg-ink/10 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-12">
                    <div className="space-y-6">
                      <h3 className="text-xl font-serif font-bold flex items-center gap-3">
                        <ShoppingBag size={20} className="text-teal" />
                        Order Items
                      </h3>
                      <div className="space-y-4">
                        {JSON.parse(selectedOrder.items).map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-6 p-4 rounded-2xl bg-paper/50 border border-ink/5">
                            <div className="w-16 h-24 rounded-lg overflow-hidden shadow-md bg-white">
                              <img src={item.item.image} alt={item.item.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-teal uppercase tracking-widest mb-1">{item.type}</p>
                              <h4 className="font-bold text-lg">{item.item.title}</h4>
                              <p className="text-sm text-ink/40">Quantity: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">Rs. {(item.item.price * item.quantity).toLocaleString()}</p>
                              <p className="text-xs text-ink/30">Rs. {item.item.price.toLocaleString()} each</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-8 rounded-3xl bg-ink text-white space-y-6">
                      <h3 className="text-xl font-serif font-bold">Order Summary</h3>
                      <div className="space-y-4 text-sm">
                        <div className="flex justify-between text-white/60">
                          <span>Subtotal</span>
                          <span>Rs. {selectedOrder.total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-white/60">
                          <span>Shipping</span>
                          <span className="text-teal font-bold uppercase tracking-widest text-[10px]">Free</span>
                        </div>
                        <div className="pt-4 border-t border-white/10 flex justify-between text-2xl font-bold">
                          <span>Total</span>
                          <span className="text-teal">Rs. {selectedOrder.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="p-8 rounded-3xl border border-ink/5 bg-paper/30 space-y-6">
                      <h3 className="text-xl font-serif font-bold flex items-center gap-3">
                        <UserIcon size={20} className="text-teal" />
                        Customer Info
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Name</p>
                          <p className="font-bold">{selectedOrder.firstName} {selectedOrder.lastName}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Contact</p>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail size={14} className="text-ink/30" />
                            {selectedOrder.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone size={14} className="text-ink/30" />
                            {selectedOrder.phone}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 rounded-3xl border border-ink/5 bg-paper/30 space-y-6">
                      <h3 className="text-xl font-serif font-bold flex items-center gap-3">
                        <MapPin size={20} className="text-teal" />
                        Shipping Address
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">City</p>
                          <p className="font-bold">{selectedOrder.city}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Address</p>
                          <p className="text-sm leading-relaxed">{selectedOrder.address}</p>
                        </div>
                        {selectedOrder.notes && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Order Notes</p>
                            <p className="text-sm italic text-ink/60">"{selectedOrder.notes}"</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-8 rounded-3xl border border-ink/5 bg-paper/30 space-y-6">
                      <h3 className="text-xl font-serif font-bold flex items-center gap-3">
                        <ShieldCheck size={20} className="text-teal" />
                        Status & Payment
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Current Status</p>
                          <select 
                            value={selectedOrder.status}
                            onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                            className="w-full bg-white border border-ink/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-teal/20 transition-all"
                          >
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Payment Method</p>
                          <p className="font-bold uppercase tracking-widest text-xs">{selectedOrder.paymentMethod}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProfilePage = ({ user, onUpdate }: { user: User; onUpdate: (u: User) => void }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName || '');
  const [profilePic, setProfilePic] = useState(user.profilePic);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const avatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe'
  ];

  useEffect(() => {
    fetch(`/api/user/orders/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      });
  }, [user.id]);

  const handleUpdate = async () => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, fullName, profilePic })
      });
      const data = await res.json();
      if (data.success) {
        onUpdate(data.user);
        setIsEditing(false);
      }
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const handleRemoveOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to remove this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/orders/${orderId}?userId=${user.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.filter(order => order.id !== orderId));
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to remove order');
    }
  };

  return (
    <div className="pt-24 md:pt-32 pb-20 md:pb-32 max-w-7xl mx-auto px-4 md:px-6 space-y-12 md:space-y-16">
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-ink/5 shadow-2xl shadow-ink/5">
        <div className="relative group">
          <div className="w-24 h-24 md:w-40 md:h-40 rounded-full border-4 md:border-8 border-teal/10 overflow-hidden bg-teal/5 relative">
            <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            {isEditing && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="w-8 h-8 md:w-12 md:h-12 bg-white text-ink rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                >
                  <Camera size={16} md:size={24} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
          <div className="space-y-1 md:space-y-2">
            {isEditing ? (
              <div className="space-y-2 md:space-y-4">
                <p className="text-[8px] md:text-[10px] font-bold text-teal uppercase tracking-widest">Full Name</p>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="text-xl md:text-4xl font-serif font-bold bg-ink/5 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-teal/20 w-full max-w-md"
                />
              </div>
            ) : (
              <h1 className="text-2xl md:text-6xl font-serif font-bold">{user.fullName || 'Member'}</h1>
            )}
            <p className="text-sm md:text-xl text-ink/40">{user.email}</p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4">
            {isEditing ? (
              <>
                <button onClick={handleUpdate} className="bg-teal text-white px-6 py-2 md:px-8 md:py-3 rounded-full font-bold shadow-lg shadow-teal/20 text-xs md:text-base">Save Changes</button>
                <button onClick={() => setIsEditing(false)} className="bg-ink/5 text-ink/60 px-6 py-2 md:px-8 md:py-3 rounded-full font-bold text-xs md:text-base">Cancel</button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="bg-ink text-white px-6 py-2 md:px-8 md:py-3 rounded-full font-bold shadow-lg shadow-ink/10 text-xs md:text-base">Edit Profile</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 w-full md:w-auto">
          <div className="bg-paper p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] text-center border border-ink/5">
            <p className="text-[8px] md:text-[10px] font-bold text-ink/30 uppercase tracking-widest mb-1 md:mb-2">Books Bought</p>
            <p className="text-2xl md:text-4xl font-bold text-teal">{orders.length}</p>
          </div>
          <div className="bg-paper p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] text-center border border-ink/5">
            <p className="text-[8px] md:text-[10px] font-bold text-ink/30 uppercase tracking-widest mb-1 md:mb-2">Member Since</p>
            <p className="text-lg md:text-2xl font-bold text-bronze">2024</p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-serif font-bold">Order History</h2>
          <div className="h-px flex-1 bg-ink/5 mx-8" />
        </div>

        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-20 bg-paper rounded-[3rem] text-center border border-dashed border-ink/10">
            <ShoppingBag size={48} className="mx-auto text-ink/10 mb-6" />
            <p className="text-xl text-ink/40 font-serif italic">"A room without books is like a body without a soul."</p>
            <p className="text-ink/30 mt-4">You haven't placed any orders yet.</p>
            <button className="bg-teal text-white px-8 py-3 rounded-full font-bold mt-8 shadow-lg shadow-teal/20">Start Your Collection</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {orders.map(order => {
              const items = JSON.parse(order.items);
              return (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white border border-ink/5 rounded-[3rem] p-8 md:p-12 flex flex-col lg:flex-row gap-12 hover:shadow-2xl transition-all group"
                >
                  <div className="flex-1 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-teal uppercase tracking-[0.3em]">Order #{order.id.toString().padStart(5, '0')}</p>
                        <p className="text-sm text-ink/40 flex items-center gap-2">
                          <Calendar size={14} />
                          {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest ${
                          order.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                          order.status === 'shipped' ? 'bg-blue-50 text-blue-600' :
                          order.status === 'delivered' ? 'bg-green-50 text-green-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {order.status}
                        </span>
                        <button
                          onClick={() => handleRemoveOrder(order.id)}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-100 hover:border-red-200"
                          title="Remove Order"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {items.map((item: any, i: number) => (
                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-paper/50 border border-ink/5 group-hover:bg-white transition-colors">
                          <div className="w-16 h-24 rounded-lg overflow-hidden shadow-md bg-white flex-shrink-0">
                            <img src={item.item.image} alt={item.item.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 py-1">
                            <p className="text-[8px] font-bold text-teal uppercase tracking-widest mb-1">{item.type}</p>
                            <h4 className="font-bold text-sm line-clamp-1">{item.item.title}</h4>
                            <p className="text-xs text-ink/40 mt-1">Qty: {item.quantity}</p>
                            <p className="text-sm font-bold mt-2">Rs. {item.item.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:w-72 flex flex-col justify-between p-8 bg-paper rounded-[2.5rem] border border-ink/5">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Shipping To</p>
                        <div className="flex items-start gap-3 text-sm">
                          <MapPin size={16} className="text-teal mt-0.5" />
                          <p className="text-ink/70 leading-relaxed">{order.address}, {order.city}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Payment</p>
                        <div className="flex items-center gap-3 text-sm">
                          <CreditCard size={16} className="text-teal" />
                          <p className="text-ink/70 font-bold uppercase tracking-widest text-[10px]">{order.paymentMethod}</p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-8 border-t border-ink/10 mt-8">
                      <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest mb-1">Total Paid</p>
                      <p className="text-3xl font-bold text-ink">Rs. {order.total.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Avatar Selection Modal */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAvatarModalOpen(false)}
              className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white z-[110] rounded-[3rem] shadow-2xl p-10 space-y-8"
            >
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-serif font-bold">Choose Your Avatar</h3>
                <p className="text-ink/50 text-sm">Select a character that represents you.</p>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {avatars.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setProfilePic(url);
                      setIsAvatarModalOpen(false);
                    }}
                    className={`w-16 h-16 rounded-full border-4 transition-all overflow-hidden ${profilePic === url ? 'border-teal scale-110' : 'border-transparent hover:border-teal/30'}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="w-full bg-ink text-white py-4 rounded-xl font-bold hover:bg-teal transition-all"
              >
                Done
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const Footer = ({ setPage }: { setPage: (p: Page) => void }) => {
  const navigate = useNavigate();
  return (
    <footer className="bg-ink text-white pt-32 pb-12 relative overflow-hidden">
      {/* Newsletter Floating Box */}
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 mb-16 md:mb-24">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-teal p-8 md:p-16 rounded-[2.5rem] md:rounded-[3rem] flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 relative overflow-hidden shadow-2xl shadow-teal/20"
        >
          <div className="relative z-10 space-y-4 text-center lg:text-left">
            <h3 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold leading-tight">Join the Inner Circle</h3>
            <p className="text-white/80 text-base md:text-lg max-w-md">Get curated reading lists and exclusive bundle offers delivered to your inbox.</p>
          </div>
          <div className="relative z-10 w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.input 
                whileFocus={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.3)' }}
                type="email" 
                placeholder="Enter your email" 
                className="bg-white/20 border-white/20 border rounded-2xl px-6 py-4 md:px-8 md:py-5 text-base md:text-lg flex-1 min-w-0 sm:min-w-[300px] focus:ring-4 focus:ring-white/10 placeholder:text-white/50 outline-none transition-all"
              />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-teal px-8 py-4 md:px-10 md:py-5 rounded-2xl font-bold text-base md:text-lg hover:bg-ink hover:text-white transition-all shadow-xl"
              >
                Subscribe
              </motion.button>
            </div>
            <p className="text-[10px] uppercase tracking-widest font-bold mt-4 opacity-50 text-center lg:text-left">No spam. Just knowledge. Unsubscribe anytime.</p>
          </div>
          
          {/* Decorative Icon Background */}
          <div className="absolute -right-20 -bottom-20 opacity-10 rotate-12 pointer-events-none">
            <Globe size={400} />
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <img src="/logo.png" alt="INKORA Logo" className="w-full h-full object-contain" />
          </div>       
          <span className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-ink hidden xs:block logo_color">INKORA</span>
            </div>
            <p className="text-white/40 text-lg leading-relaxed font-medium italic">
              "Curating the world's most impactful knowledge for the modern builder."
            </p>
            <div className="flex gap-6">
              {[
                { icon: <Twitter size={20} />, label: 'Twitter', href: "#" },
                { icon: <Instagram size={20} />, label: 'Instagram', href: "https://instagram.com/inkora_books" },
                { icon: <Facebook size={20} />, label: 'Facebook', href: "https://web.facebook.com/people/Inkora-Books/61584088526260/" }
              ].map((social, i) => (
                <motion.a 
                  key={i}
                  href={social.href}
                  whileHover={{ y: -5, color: '#008080' }}
                  className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all border border-white/5"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-teal">The Library</h4>
            <ul className="space-y-4">
              {['All Books', 'Featured Bundles', 'Best Sellers', 'New Arrivals'].map(item => (
                <li key={item}>
                  <button 
                    onClick={() => navigate('/shop')}
                    className="text-white/40 hover:text-white transition-all text-lg font-medium hover:translate-x-2 flex items-center gap-2 group"
                  >
                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all -ml-6 group-hover:ml-0" />
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-teal">Company</h4>
            <ul className="space-y-4">
              {[
                { label: 'Our Mission', path: '/about' },
                { label: 'FAQ', path: '/faq' },
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Terms of Service', path: '/terms' },
                { label: 'Shipping Policy', path: '/shipping' },
                { label: 'Refund Policy', path: '/refund' }
              ].map(item => (
                <li key={item.label}>
                  <button 
                    onClick={() => navigate(item.path)}
                    className="text-white/40 hover:text-white transition-all text-lg font-medium hover:translate-x-2 flex items-center gap-2 group"
                  >
                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all -ml-6 group-hover:ml-0" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-teal">Contact Us</h4>
            <div className="space-y-6">
              <a href="mailto:hello@inkora.com" className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-teal group-hover:bg-teal group-hover:text-white transition-all">
                  <Mail size={18} />
                </div>
                <span className="text-white/60 group-hover:text-white transition-colors">laizerxofficial@gmail.com</span>
              </a>
              <a href="tel:+94743333932" className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-teal group-hover:bg-teal group-hover:text-white transition-all">
                  <Phone size={18} />
                </div>
                <span className="text-white/60 group-hover:text-white transition-colors">+94 74 333 3932</span>
              </a>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-teal">
                  <MapPin size={18} />
                </div>
                <span className="text-white/60">Colombo, Sri Lanka</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-white/20 text-sm">© 2024 INKORA. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('/admin-login')} className="text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-teal transition-colors">Admin Portal</button>
            <div className="flex items-center gap-2 text-white/20">
              <Globe size={14} />
              <span className="text-xs font-bold uppercase tracking-widest">English (US)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Background Glows */}
      <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-teal/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-bronze/5 rounded-full blur-[120px] pointer-events-none" />
    </footer>
  );
};

// --- Pages ---

const BookStack = ({ 
  books, 
  onBookClick 
}: { 
  books: Book[]; 
  onBookClick: (book: Book) => void 
}) => {
  return (
    <div className="relative w-full max-w-6xl mx-auto h-[300px] sm:h-[350px] md:h-[450px] lg:h-[550px] flex items-center justify-center mt-8 md:mt-12 mb-12 md:mb-20">
      <div className="relative flex items-center justify-center w-full h-full">
        <div className="flex items-center justify-center -space-x-12 sm:-space-x-12 md:-space-x-16 lg:-space-x-20">
          {books.map((book, index) => {
            return (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  zIndex: index,
                }}
                whileHover={{ 
                  y: -40,
                  scale: 1.05,
                  zIndex: 50,
                  transition: { type: 'spring', stiffness: 400, damping: 25 }
                }}
                onClick={() => onBookClick(book)}
                className="relative w-24 h-36 sm:w-36 h-52 md:w-48 md:h-64 lg:w-56 lg:h-80 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-xl overflow-hidden border border-white/20 bg-white flex-shrink-0 transition-shadow hover:shadow-teal/20"
              >
                <img 
                  src={book.image} 
                  alt={book.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 transition-opacity" />
              </motion.div>
            );
          })}
        </div>

        {/* Speech Bubbles - Closer to books */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute top-10 left-[5%] sm:left-[10%] z-50"
        >
          <div className="bg-[#4A90E2] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold shadow-xl relative">
            @growth_mindset
            <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-[#4A90E2] rotate-45" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="absolute top-24 right-[5%] sm:right-[10%] z-50"
        >
          <div className="bg-[#50C878] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold shadow-xl relative">
            @ambitious_builder
            <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-[#50C878] rotate-45" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const Marquee = ({ text }: { text: string }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="relative flex overflow-x-hidden bg-ink py-10 border-y border-white/10"
    >
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="flex whitespace-nowrap"
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-10 px-5">
            <span className="text-6xl md:text-8xl font-serif font-bold text-white/20 uppercase tracking-tighter italic">
              {text}
            </span>
            <div className="w-4 h-4 rounded-full bg-teal" />
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
};

const CategorySection = ({ 
  setPage, 
  onCategoryClick 
}: { 
  setPage: (p: Page) => void;
  onCategoryClick: (cat: string) => void;
}) => {
  const { width } = useWindowSize();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const categories = [
    { name: 'Entrepreneurship', color: 'bg-[#008080d5]', image: './C1.png', filter: 'Business' },
    { name: 'Productivity', color: 'bg-[#ce8a46e3]', image: './C2.png', filter: 'Productivity' },
    { name: 'Mindset', color: 'bg-[#b7a957cd]', image: './C3.png', filter: 'Mindset' },
    { name: 'Money', color: 'bg-[#5eb77be1]', image: './C4.png', filter: 'Finance' },
    { name: 'Bundles', color: 'bg-[#b465afd5]', image: './C5.png', filter: 'Bundles' },
  ];

  // Default active is Entrepreneurship (idx 0) if not hovering anything
  const activeIdx = hoveredIdx !== null ? hoveredIdx : 0;

  return (
    <section className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 space-y-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl 2xl:text-8xl font-serif font-bold"
          >
            Shop By <br />
            <span className="italic text-teal">Categories</span>
          </motion.h2>
        </div>
      </div>
      
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row gap-4 md:h-[600px]"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {categories.map((cat, idx) => {
          const isActive = activeIdx === idx;
          
          return (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              onMouseEnter={() => setHoveredIdx(idx)}
              animate={width >= 768 ? { 
                flex: isActive ? 2.5 : 0.8,
              } : {}}
              viewport={{ once: true }}
              transition={{ 
                flex: { type: 'spring', stiffness: 300, damping: 30, mass: 1 },
                opacity: { duration: 0.5, delay: idx * 0.05 }
              }}
              onClick={() => {
                if (cat.name === 'Bundles') {
                  setPage('bundles');
                } else {
                  onCategoryClick(cat.filter);
                }
              }}
              className={`relative h-[250px] md:h-full md:flex-1 rounded-[2.5rem] overflow-hidden cursor-pointer group ${cat.color} shadow-xl shadow-ink/5 transition-all duration-500 ease-out`}
            >
              <motion.img 
                src={cat.image} 
                alt={cat.name} 
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={{ duration: 0.6 }}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity mix-blend-overlay ${isActive ? 'opacity-80' : 'opacity-40'}`}
                referrerPolicy="no-referrer"
              />
              <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-60'}`} />
              
              <div className="absolute top-6 right-6">
                <motion.div 
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30"
                >
                  <ArrowRight size={18} className={`transition-transform duration-500 ${isActive ? 'rotate-0' : '-rotate-45'}`} />
                </motion.div>
              </div>

              <div className="absolute bottom-10 left-8 right-8 space-y-2">
                <h3 className={`font-serif font-bold text-white leading-tight whitespace-nowrap transition-all duration-500 ${isActive ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl opacity-70'}`}>
                  {cat.name}
                </h3>
                <div className={`flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-widest transition-all duration-500 transform ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  Explore
                  <ArrowRight size={12} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

const HomePage = ({ 
  setPage, 
  setSelectedBook, 
  addToCart,
  onCategoryClick,
  books,
  bundles,
  navigate
}: { 
  setPage: (p: Page) => void; 
  setSelectedBook: (b: Book) => void;
  addToCart: (item: Book | Bundle, type: 'book' | 'bundle') => void;
  onCategoryClick: (cat: string) => void;
  books: Book[];
  bundles: Bundle[];
  navigate: (path: string) => void;
}) => {
  return (
    <div className="space-y-32 pb-32">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-[#F9F9F9]" />
        
        {/* Decorative Background Elements */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-teal/10 rounded-full blur-[120px] pointer-events-none" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-bronze/5 rounded-full blur-[100px] pointer-events-none" 
        />
        
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="text-left space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <h1 className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl 2xl:text-9xl font-serif font-bold tracking-tight text-ink leading-[1.1]">
                Scale Your <br />
                <span className="italic text-teal">Mindset.</span>
              </h1>
              <p className="text-lg md:text-xl 2xl:text-2xl text-ink/50 max-w-xl leading-relaxed font-medium">
                The ultimate library for high-performers. We curate the world's most impactful books on business, productivity, and wealth creation.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <button 
                onClick={() => setPage('shop')}
                className="w-full sm:w-auto bg-ink text-white px-10 py-4 rounded-full font-bold hover:bg-teal transition-all shadow-xl shadow-ink/10"
              >
                Shop Now
              </button>
              <button 
                onClick={() => setPage('about')}
                className="w-full sm:w-auto bg-white border border-ink/5 text-ink/70 px-10 py-4 rounded-full font-bold hover:bg-ink/5 transition-all shadow-sm"
              >
                Read more
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="hidden lg:block"
          >
            <BookStack 
              books={books.slice(0, 5)} 
              onBookClick={(book) => {
                navigate(`/books/${book.slug}`);
              }} 
            />
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-ink text-white rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-24 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-teal/10 blur-[100px]" />
          <div className="max-w-3xl space-y-8 relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-6xl 2xl:text-7xl font-serif font-bold leading-tight">
              Knowledge is the only <br />
              <span className="text-teal italic">infinite leverage.</span>
            </h2>
            <p className="text-lg md:text-xl 2xl:text-2xl text-white/60 leading-relaxed">
              In the age of AI and automation, your ability to synthesize high-level concepts is your greatest asset. We provide the blueprints for your next breakthrough.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 pt-8 border-t border-white/10">
              <div>
                <p className="text-3xl font-bold text-teal">100+</p>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">Book Titles</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-teal">5</p>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">Core Pillars</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-teal">100%</p>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">Practicality</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Category Section - Moved above Mission */}
      <CategorySection setPage={setPage} onCategoryClick={onCategoryClick} />

      {/* Featured Bundles */}
      <section className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-serif font-bold">Curated Bundles</h2>
            <p className="text-ink/60">Save up to 20% with our hand-picked collections.</p>
          </div>
          <button 
            onClick={() => setPage('bundles')}
            className="text-teal font-bold flex items-center gap-2 hover:gap-3 transition-all text-sm sm:text-base"
          >
            View All Bundles <ArrowRight size={18} />
          </button>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {bundles.map((bundle, idx) => (
            <motion.div 
              key={bundle.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white rounded-2xl overflow-hidden border border-ink/5 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="aspect-[16/10] overflow-hidden relative">
                <img src={bundle.image} alt={bundle.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 right-4 bg-bronze text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Save Rs. {(bundle.originalPrice - bundle.price).toLocaleString()}
                </div>
              </div>
              <div className="p-8 space-y-4">
                <h3 className="text-xl font-serif font-bold">{bundle.title}</h3>
                <p className="text-sm text-ink/60 line-clamp-2">{bundle.description}</p>
                <div className="flex items-center justify-between pt-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-ink/40 line-through">Rs. {bundle.originalPrice.toLocaleString()}</span>
                    <span className="text-xl font-bold text-teal">Rs. {bundle.price.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={() => addToCart(bundle, 'bundle')}
                    className="bg-ink text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-teal transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Best Sellers Grid */}
      <section className="bg-ink py-20 md:py-32 text-white overflow-hidden">
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-serif font-bold">The Best Sellers</h2>
            <p className="text-white/60 max-w-xl mx-auto text-sm md:text-base">The books that have shaped the minds of today's most successful entrepreneurs.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {books.filter(b => b.isBestSeller).map((book, idx) => (
              <motion.div 
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -12 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: idx * 0.1,
                  y: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                }}
                className="space-y-6 group"
              >
                <div 
                  className="aspect-[3/4] rounded-xl overflow-hidden cursor-pointer relative shadow-sm group-hover:shadow-2xl group-hover:shadow-teal/10 transition-all duration-500"
                  onClick={() => {
                    navigate(`/books/${book.slug}`);
                  }}
                >
                  <img src={book.image} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-serif font-bold">{book.title}</h3>
                      <p className="text-sm text-white/50">{book.author}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      {book.discount ? book.discount > 0 && (
                        <span className="text-xs text-white/40 line-through">Rs. {book.price.toLocaleString()}</span>
                      ) : null}
                      <span className="font-bold text-bronze">Rs. {(book.price - (book.discount || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button 
                      onClick={() => addToCart(book, 'book')}
                      className="flex-1 bg-white text-ink py-3 rounded-lg text-sm font-bold hover:bg-teal hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={16} />
                      Add to Cart
                    </button>
                    <a 
                      href={`https://wa.me/94743333932?text=I'm interested in ordering: ${book.title}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 border border-white/20 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-green-400"
                    >
                      <MessageCircle size={20} />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Buy From Us */}
      <section className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <Truck />, title: 'Fast Delivery', desc: '3–5 working days islandwide.' },
            { icon: <ShieldCheck />, title: 'Secure Payment', desc: 'COD or Bank Transfer options.' },
            { icon: <CheckCircle2 />, title: 'Curated Quality', desc: 'Only the best titles selected.' },
            { icon: <MessageCircle />, title: 'Expert Support', desc: 'WhatsApp order assistance.' },
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-10 bg-white border border-ink/5 rounded-[3rem] space-y-6 hover:shadow-2xl transition-all group text-center md:text-left hover:-translate-y-2 duration-500"
            >
              <div className="w-14 h-14 bg-teal/5 rounded-2xl flex items-center justify-center mx-auto md:mx-0 group-hover:bg-teal text-teal group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-teal/20">
                {React.cloneElement(item.icon as React.ReactElement, { size: 24 })}
              </div>
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-xl group-hover:text-teal transition-colors">{item.title}</h4>
                <p className="text-sm text-ink/60 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission Section - Moved after Why Buy From Us */}
      <section className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-paper border border-ink/5 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl shadow-ink/5"
        >
          <div className="flex-1 p-8 md:p-20 space-y-8">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold leading-tight"
            >
              The INKORA <span className="italic text-teal">Mission</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-base md:text-lg text-ink/70 leading-relaxed"
            >
              We believe that the right idea, encountered at the right time, can change the trajectory of a life. INKORA was founded to bridge the gap between ambitious builders and the timeless wisdom they need to succeed. We don't just sell books; we empower the next generation of leaders.
            </motion.p>
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              onClick={() => setPage('about')}
              className="group bg-ink text-white px-6 py-3 sm:px-8 sm:py-4 rounded-full font-bold flex items-center gap-2 hover:bg-teal transition-all text-sm sm:text-base"
            >
              Learn Our Story 
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ArrowRight size={16} />
              </div>
            </motion.button>
          </div>
          <div className="flex-1 min-h-[300px] md:min-h-[500px] overflow-hidden">
            <motion.img 
              initial={{ scale: 1.2 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5 }}
              src="https://picsum.photos/seed/mission/800/800" 
              alt="Mission" 
              className="w-full h-full object-cover" 
            />
          </div>
        </motion.div>
      </section>
    </div>
  );
};

const ShopPage = ({ 
  addToCart, 
  setSelectedBook, 
  setPage,
  activeCategory,
  setActiveCategory,
  books,
  navigate
}: { 
  addToCart: (item: Book | Bundle, type: 'book' | 'bundle') => void;
  setSelectedBook: (b: Book) => void;
  setPage: (p: Page) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  books: Book[];
  navigate: (path: string) => void;
}) => {
  const categories = ['All', 'Business', 'Productivity', 'Mindset', 'Finance', 'Biography'];

  const filteredBooks = activeCategory === 'All' 
    ? books 
    : books.filter(b => b.category === activeCategory);

  return (
    <div className="pt-32 pb-32 max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 space-y-12">
      <div className="space-y-4">
        <h1 className="text-5xl font-serif font-bold">The Library</h1>
        <p className="text-ink/60">Curated wisdom for every stage of your journey.</p>
      </div>

      <div className="flex flex-nowrap overflow-x-auto pb-4 -mx-6 px-6 gap-3 scrollbar-hide md:flex-wrap md:overflow-visible md:pb-0 md:mx-0 md:px-0 md:gap-4 border-b border-ink/5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-teal text-white shadow-lg shadow-teal/20' : 'bg-ink/5 text-ink/40 hover:bg-ink/10'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredBooks.map((book, idx) => (
            <motion.div 
              key={book.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ 
                delay: idx * 0.05,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="group space-y-4"
            >
              <div 
                className="aspect-[3/4] rounded-[2rem] overflow-hidden cursor-pointer relative shadow-sm hover:shadow-2xl transition-all duration-500"
                onClick={() => {
                  navigate(`/books/${book.slug}`);
                }}
              >
                <motion.img 
                  src={book.image} 
                  alt={book.title} 
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.8 }}
                  className="w-full h-full object-cover" 
                />
                {book.isBestSeller && (
                  <div className="absolute top-4 left-4 bg-bronze text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    Best Seller
                  </div>
                )}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="space-y-1 px-2">
                <h3 className="font-serif font-bold text-lg leading-tight group-hover:text-teal transition-colors">{book.title}</h3>
                <p className="text-sm text-ink/50">{book.author}</p>
                <div className="flex items-center gap-2 pt-2">
                  <p className="font-bold text-teal">Rs. {(book.price - (book.discount || 0)).toLocaleString()}</p>
                  {book.discount ? book.discount > 0 && (
                    <p className="text-xs text-ink/30 line-through">Rs. {book.price.toLocaleString()}</p>
                  ) : null}
                </div>
              </div>
              <button 
                onClick={() => addToCart(book, 'book')}
                className="w-full bg-ink text-white py-4 rounded-full text-sm font-bold hover:bg-teal transition-all flex items-center justify-center gap-2 shadow-lg shadow-ink/5"
              >
                <ShoppingBag size={16} />
                Add to Cart
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const BundlePage = ({ addToCart, bundles, books }: { addToCart: (item: Book | Bundle, type: 'book' | 'bundle') => void, bundles: Bundle[], books: Book[] }) => {
  return (
    <div className="pt-32 pb-32 max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 space-y-24">
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-block px-4 py-1.5 bg-teal/10 text-teal text-xs font-bold rounded-full uppercase tracking-[0.2em]"
        >
          Curated Value Packs
        </motion.div>
        <h1 className="text-6xl md:text-7xl font-serif font-bold tracking-tight">Knowledge <span className="italic text-teal">Bundles</span></h1>
        <p className="text-xl text-ink/60 leading-relaxed">Thematic collections designed to give you a comprehensive understanding of critical subjects while saving you up to 20%.</p>
      </div>

      <div className="grid grid-cols-1 gap-32">
        {bundles.map((bundle, idx) => (
          <motion.div 
            key={bundle.id}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`flex flex-col ${idx % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-16 items-center`}
          >
            <div className="flex-1 relative group w-full">
              <div className="aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl relative z-10">
                <motion.img 
                  src={bundle.image} 
                  alt={bundle.title} 
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 1 }}
                  className="w-full h-full object-cover" 
                />
              </div>
              {/* Decorative Background Elements */}
              <div className="absolute -inset-4 bg-teal/5 rounded-[3.5rem] -z-10 blur-2xl group-hover:bg-teal/10 transition-all duration-700" />
              <div className="absolute top-8 -right-8 w-32 h-32 bg-bronze/10 rounded-full blur-3xl -z-10" />
            </div>

            <div className="flex-1 space-y-10 w-full">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="px-4 py-1.5 bg-bronze text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg shadow-bronze/20">
                    Save Rs. {(bundle.originalPrice - bundle.price).toLocaleString()}
                  </div>
                  <div className="h-px flex-1 bg-ink/5" />
                </div>
                <h2 className="text-5xl font-serif font-bold leading-tight">{bundle.title}</h2>
                <p className="text-xl text-ink/60 leading-relaxed">{bundle.description}</p>
              </div>
              
              <div className="space-y-6">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-ink/30">What's Inside</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {bundle.books.map((bookItem) => {
                    const bookId = typeof bookItem === 'string' ? bookItem : bookItem.id;
                    const book = books.find(b => b.id === bookId);
                    return book ? (
                      <div key={bookId} className="flex items-center gap-4 p-4 bg-white border border-ink/5 rounded-2xl hover:shadow-xl transition-all duration-500 group/item">
                        <div className="w-12 h-16 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                          <img src={book.image} alt={book.title} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{book.title}</p>
                          <p className="text-[10px] text-ink/40 uppercase tracking-widest">{book.author}</p>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="pt-8 border-t border-ink/5 flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="space-y-1">
                  <p className="text-sm text-ink/40 line-through">Rs. {bundle.originalPrice.toLocaleString()}</p>
                  <p className="text-4xl font-bold text-teal">Rs. {bundle.price.toLocaleString()}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <button 
                    onClick={() => addToCart(bundle, 'bundle')}
                    className="flex-1 bg-ink text-white px-12 py-5 rounded-full font-bold hover:bg-teal transition-all shadow-2xl shadow-ink/20 flex items-center justify-center gap-3"
                  >
                    <ShoppingBag size={20} />
                    Get the Bundle
                  </button>
                  <a 
                    href={`https://wa.me/94743333932?text=I'm interested in ordering the bundle: ${bundle.title}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-green-500 text-white px-8 py-5 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-green-600 transition-all shadow-xl shadow-green-500/20"
                  >
                    <MessageCircle size={20} />
                    WhatsApp Order
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
const ProductPage = ({ 
  book, 
  addToCart,
  setPage,
  setSelectedBook,
  books
}: { 
  book: Book; 
  addToCart: (item: Book | Bundle, type: 'book' | 'bundle') => void;
  setPage: (p: Page) => void;
  setSelectedBook: (b: Book) => void;
  books: Book[];
}) => {
  if (!book) return null;

  const relatedBooks = books.filter(b => b.category === book.category && b.id !== book.id).slice(0, 3);

  return (
    <div className="pt-32 pb-32 max-w-7xl 2xl:max-w-[1600px] mx-auto px-6 space-y-24">
      <button 
        onClick={() => setPage('home')}
        className="flex items-center gap-2 text-ink/40 hover:text-teal transition-colors font-bold text-sm uppercase tracking-widest"
      >
        <ArrowRight size={16} className="rotate-180" />
        Back to Library
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left: Image */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl lg:sticky lg:top-32"
        >
          <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
        </motion.div>

        {/* Right: Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10"
        >
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 text-sm font-bold text-bronze uppercase tracking-widest"
            >
              <span className="px-3 py-1 bg-bronze/10 rounded-full">{book.category}</span>
              {book.isBestSeller && <span className="px-3 py-1 bg-teal text-white rounded-full">Best Seller</span>}
              {book.discount ? book.discount > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white rounded-full">Save Rs. {book.discount.toLocaleString()}</span>
              ) : null}
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-6xl font-serif font-bold leading-tight"
            >
              {book.title}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-ink/50 italic"
            >
              by {book.author}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-baseline gap-4"
            >
              <span className="text-4xl font-bold text-teal">Rs. {(book.price - (book.discount || 0)).toLocaleString()}</span>
              {book.discount ? book.discount > 0 && (
                <span className="text-xl text-ink/30 line-through">Rs. {book.price.toLocaleString()}</span>
              ) : null}
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            <p className="text-lg text-ink/70 leading-relaxed">{book.description}</p>
            
            <div className="p-8 bg-paper border border-ink/5 rounded-[2rem] space-y-4 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-medium">
                <Truck size={18} className="text-teal" />
                <span>Delivery: 3–5 working days islandwide</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium">
                <CreditCard size={18} className="text-teal" />
                <span>Payment: Cash on Delivery or Bank Transfer</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button 
              onClick={() => addToCart(book, 'book')}
              className="flex-1 bg-ink text-white py-5 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-teal transition-all shadow-xl shadow-ink/10"
            >
              <ShoppingBag size={20} />
              Add to Cart
            </button>
            <a 
              href={`https://wa.me/94743333932?text=I'm interested in ordering: ${book.title}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-500 text-white py-5 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-green-600 transition-all shadow-xl shadow-green-500/20"
            >
              <MessageCircle size={20} />
              WhatsApp Quick Order
            </a>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-ink/5">
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-xl">Who this is for</h3>
              <ul className="space-y-2">
                {book.whoIsItFor.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink/60">
                    <CheckCircle2 size={16} className="text-teal mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-xl">Key Takeaways</h3>
              <ul className="space-y-2">
                {book.keyTakeaways.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink/60">
                    <ArrowRight size={16} className="text-bronze mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Related Books */}
      <section className="space-y-12">
        <h2 className="text-3xl font-serif font-bold">You might also like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {books.filter(b => b.id !== book.id).slice(0, 4).map(related => (
            <div 
              key={related.id} 
              className="group cursor-pointer space-y-4"
              onClick={() => {
                setSelectedBook(related);
                window.scrollTo(0, 0);
              }}
            >
              <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-sm group-hover:shadow-xl transition-all">
                <img src={related.image} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div>
                <h4 className="font-serif font-bold group-hover:text-teal transition-colors">{related.title}</h4>
                <p className="text-xs text-ink/50">{related.author}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const CheckoutPage = ({ 
  cartItems, 
  setPage,
  user,
  onOpenAuth,
  navigate,
  clearCart
}: { 
  cartItems: CartItem[]; 
  setPage: (p: Page) => void;
  user: User | null;
  onOpenAuth: () => void;
  navigate: (path: string) => void;
  clearCart: () => void;
}) => {
  const [step, setStep] = useState(1);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    city: '',
    address: '',
    phone: '',
    retypePhone: '',
    notes: '',
    paymentMethod: 'cod'
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.type === 'book' 
      ? (item.item as Book).price - ((item.item as Book).discount || 0)
      : item.item.price;
    return acc + (price * item.quantity);
  }, 0);
  const shipping = 300;
  const total = subtotal + shipping;

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    if (formData.phone !== formData.retypePhone) {
      alert('Phone numbers do not match!');
      return;
    }
    setStep(2);
  };

  const handleComplete = async () => {
    if (!user) return;
    
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
          total,
          items: cartItems
        })
      });
      const data = await res.json();
      if (data.success) {
        setOrderPlaced(true);
        clearCart();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to place order');
    }
  };

  if (cartItems.length === 0) {
    if (orderPlaced) {
      return (
        <div className="pt-40 pb-40 text-center space-y-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-bold">Order Placed Successfully!</h1>
            <p className="text-ink/60">Thank you for your purchase. We'll contact you shortly with the next steps.</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="bg-teal text-white px-8 py-3 rounded-xl font-bold hover:bg-teal/90 transition-all"
          >
            Continue Shopping
          </button>
        </div>
      );
    }
    return (
      <div className="pt-40 pb-40 text-center space-y-6">
        <ShoppingBag size={64} className="mx-auto text-ink/10" />
        <h1 className="text-3xl font-serif font-bold">Your cart is empty</h1>
        <button onClick={() => setPage('shop')} className="bg-teal text-white px-8 py-3 rounded-xl font-bold">Browse Books</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-40 pb-40 text-center space-y-8 max-w-md mx-auto px-6">
        <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mx-auto text-teal">
          <Lock size={32} />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-serif font-bold">Authentication Required</h1>
          <p className="text-ink/60">Please login or create an account to proceed with your order. We need this to track your purchases and provide a better experience.</p>
        </div>
        <button 
          onClick={onOpenAuth}
          className="w-full bg-ink text-white py-4 rounded-2xl font-bold hover:bg-teal transition-all shadow-xl shadow-ink/10"
        >
          Login / Register
        </button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-32 max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-12">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all ${step >= 1 ? 'bg-teal text-white shadow-lg shadow-teal/20' : 'bg-ink/5 text-ink/40'}`}>1</div>
            <div className="h-px flex-1 bg-ink/5" />
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all ${step >= 2 ? 'bg-teal text-white shadow-lg shadow-teal/20' : 'bg-ink/5 text-ink/40'}`}>2</div>
          </div>

          {step === 1 ? (
            <form onSubmit={handleNext} className="space-y-10">
              <div className="space-y-2">
                <h2 className="text-4xl font-serif font-bold">Shipping Details</h2>
                <p className="text-ink/50">Where should we send your intellectual leverage?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-ink/40 uppercase tracking-widest ml-1">First Name <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-ink/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-teal/20 transition-all font-medium"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-ink/40 uppercase tracking-widest ml-1">Last Name <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-ink/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-teal/20 transition-all font-medium"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-ink/40 uppercase tracking-widest ml-1">Email Address <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="email" 
                    className="w-full bg-ink/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-teal/20 transition-all font-medium"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-ink/40 uppercase tracking-widest ml-1">Delivery Address <span className="text-red-500">*</span></label>
                  <textarea 
                    required
                    rows={3}
                    className="w-full bg-ink/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-teal/20 transition-all font-medium"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-ink/40 uppercase tracking-widest ml-1">City <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-ink/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-teal/20 transition-all font-medium"
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-ink/40 uppercase tracking-widest ml-1">Phone Number <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="tel" 
                    className="w-full bg-ink/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-teal/20 transition-all font-medium"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-ink/40 uppercase tracking-widest ml-1">Retype Phone Number <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="tel" 
                    className="w-full bg-ink/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-teal/20 transition-all font-medium"
                    value={formData.retypePhone}
                    onChange={e => setFormData({...formData, retypePhone: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-ink/40 uppercase tracking-widest ml-1">Order Notes (Optional)</label>
                  <textarea 
                    rows={2}
                    className="w-full bg-ink/5 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-teal/20 transition-all font-medium"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Special instructions for delivery..."
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-ink text-white py-5 rounded-2xl font-bold text-lg hover:bg-teal transition-all shadow-xl shadow-ink/10"
              >
                Continue to Payment
              </button>
            </form>
          ) : (
            <div className="space-y-10">
              <div className="space-y-2">
                <h2 className="text-4xl font-serif font-bold">Payment Method</h2>
                <p className="text-ink/50">Select how you'd like to complete your purchase.</p>
              </div>

              <div className="space-y-4">
                <div className="w-full flex items-center justify-between p-8 rounded-[2.5rem] border-2 border-teal bg-teal/5 shadow-lg shadow-teal/5">
                  <div className="flex items-center gap-6">
                    <div className="w-6 h-6 rounded-full border-2 border-teal flex items-center justify-center">
                      <div className="w-3 h-3 bg-teal rounded-full" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg">Cash on Delivery</p>
                      <p className="text-sm text-ink/50">Pay Rs. 300 delivery fee + book price on arrival.</p>
                    </div>
                  </div>
                  <Truck className="text-teal" size={32} />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 border border-ink/10 py-5 rounded-2xl font-bold hover:bg-ink/5 transition-all"
                >
                  Back to Shipping
                </button>
                <button 
                  onClick={handleComplete}
                  className="flex-[2] bg-teal text-white py-5 rounded-2xl font-bold text-lg hover:bg-teal/90 transition-all shadow-xl shadow-teal/20"
                >
                  Complete Order
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-8">
          <div className="bg-white border border-ink/5 rounded-[2.5rem] p-8 sticky top-32 space-y-8 shadow-sm">
            <h3 className="text-2xl font-serif font-bold">Order Summary</h3>
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-20 bg-ink/5 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                      <img src={item.item.image} alt={item.item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="py-1">
                      <p className="text-sm font-bold line-clamp-2 leading-tight">{item.item.title}</p>
                      <p className="text-xs text-ink/40 mt-1">Quantity: {item.quantity}</p>
                      {item.type === 'bundle' && (
                        <div className="mt-2 space-y-1">
                          {(item.item as Bundle).books.map((b, i) => (
                            <p key={i} className="text-[10px] text-ink/40 leading-tight flex items-center gap-1.5">
                              <CheckCircle2 size={10} className="text-teal/40" />
                              {typeof b === 'string' ? b : b.title}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-ink/80">
                    Rs. {(item.type === 'book' 
                      ? ((item.item as Book).price - ((item.item as Book).discount || 0)) * item.quantity 
                      : item.item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-8 border-t border-ink/5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-ink/40 font-bold uppercase tracking-widest">Subtotal</span>
                <span className="font-bold">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink/40 font-bold uppercase tracking-widest">Shipping</span>
                <span className="font-bold">{shipping > 0 ? `Rs. ${shipping.toLocaleString()}` : 'FREE'}</span>
              </div>
              <div className="flex justify-between text-2xl pt-4 border-t border-ink/5">
                <span className="font-serif font-bold">Total</span>
                <span className="font-bold text-teal">Rs. {total.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="p-4 bg-teal/5 rounded-2xl border border-teal/10 flex items-start gap-3">
              <ShieldCheck className="text-teal mt-0.5" size={18} />
              <p className="text-[10px] text-teal/70 font-bold uppercase tracking-widest leading-relaxed">
                Your transaction is secured with 256-bit encryption.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AboutPage = () => {
  return (
    <div className="pt-20 pb-32 overflow-hidden">
      {/* Hero Section - Text Behind User */}
      <section className="relative h-screen flex items-center justify-center bg-[#F9F9F9]">
        {/* Background Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.05, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="text-[25vw] font-serif font-black tracking-tighter leading-none select-none"
          >
            ABOUT US
          </motion.h1>
        </div>

        {/* User Image Layer */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-12 max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative w-80 h-80 md:w-[500px] md:h-[500px]"
          >
            {/* Decorative Circle */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border-2 border-dashed border-teal/20 rounded-full"
            />
            <div className="w-full h-full rounded-full overflow-hidden shadow-2xl border-8 border-white">
              <img 
                src="/logo_background.png" 
                alt="Founder" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1507000683863-de74855a7785?q=80&w=2000&auto=format&fit=crop";
                }}
              />
            </div>
            
            {/* Floating Badges */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-4 -right-4 bg-white p-4 rounded-2xl shadow-xl border border-ink/5"
            >
              <div className="w-10 h-10 bg-teal text-white rounded-xl flex items-center justify-center mb-2">
                <Globe size={20} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Global Reach</p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tight">
              Curating Wisdom for <span className="text-teal italic">Founders</span>
            </h2>
            <p className="text-lg md:text-xl text-ink/60 leading-relaxed max-w-2xl mx-auto">
              INKORA is a filter for the ambitious not a generic bookstore;We handpick each book to ensure it delivers practical insights and powerful strategies that can help you grow intellectually and personally. 
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="max-w-7xl mx-auto px-6 py-32 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-8">
          <div className="inline-block px-4 py-1.5 bg-teal/10 text-teal text-xs font-bold rounded-full uppercase tracking-widest">
            Our Mission
          </div>
          <h2 className="text-5xl font-serif font-bold leading-tight">We believe in <span className="italic text-teal">Strategic Knowledge</span>.</h2>
          <p className="text-xl text-ink/60 leading-relaxed">
Knowledge has the power to transform lives when the right ideas reach the right people at the right time. Through a carefully curated collection of books, the goal is to provide readers with practical insights, powerful strategies, and timeless wisdom that help them grow intellectually and personally. By making impactful books accessible, the company aims to inspire disciplined thinking, continuous learning, and meaningful action among individuals who strive to improve their lives and create a better future.          </p>
          <div className="grid grid-cols-2 gap-8 pt-8">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-ink">100+</p>
              <p className="text-xs font-bold uppercase tracking-widest text-ink/40">Books Vetted</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-ink">50+</p>
              <p className="text-xs font-bold uppercase tracking-widest text-ink/40">Readers Empowered</p>
            </div>
          </div>
        </div>
        <div className="relative group">
          <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl">
            <img 
              src="/CEO1.jpeg" 
              alt="Founder Lifestyle" 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1000&auto=format&fit=crop";
              }}
            />
          </div>
          <div className="absolute -bottom-10 -left-10 bg-ink text-white p-10 rounded-[2.5rem] shadow-2xl max-w-xs hidden md:block">
            <p className="text-lg italic font-serif leading-relaxed">
              "Every day you either build your future or delay it."
            </p>
            <p className="mt-4 font-bold text-teal">— Thumira Munasinghe <br/> <span className="text-sm positionTXT">Founder of Inkora | Youtuber</span></p>
          </div>
        </div>
      </section>
    </div>
  );
};

const PolicyPage = ({ type }: { type: 'privacy' | 'terms' | 'shipping' | 'refund' }) => {
  const policies = {
    privacy: {
      title: 'Privacy Policy',
      content: `
Last Updated: March 2026

Welcome to Inkorabooks. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our website.

1. Information We Collect
When you use our website, we may collect the following information:
Personal Information: Name, Email address, Phone number, Shipping address.
Account Information: Username, Login details.
Order Information: Books purchased, Order history, Delivery details.
Technical Information: IP address, Browser type, Device information.

2. How We Use Your Information
We use your information to:
- Process and deliver your book orders
- Communicate about orders and deliveries
- Manage user accounts
- Improve our website and services
- Prevent fraud or misuse of the platform

3. Sharing Your Information
We do not sell your personal information. We may share your information with:
- Delivery services (to ship your books)
- Payment providers (to process payments)
- Legal authorities if required by law

4. Data Storage
Your information is stored securely in our database. We take reasonable steps to protect it from unauthorized access. However, no online system is completely secure.

5. Your Rights
You may request to: Access your personal data, Correct incorrect information, Delete your account.
You can contact us at: Email: inkorabooks@gmail.com

6. Cookies
Our website may use cookies to improve user experience and website performance.

7. Changes to This Policy
We may update this Privacy Policy from time to time. Updates will be posted on this page.

8. Contact
If you have questions about this Privacy Policy, contact us at: Email: inkorabooks@gmail.com
      `
    },
    terms: {
      title: 'Terms of Service',
      content: `
Last Updated: March 2026

By accessing or using the Inkorabooks website, you agree to the following Terms of Service.

1. Use of the Website
You agree to use this website only for lawful purposes. You must not:
- Attempt to hack or damage the website
- Use false information when creating an account
- Abuse or misuse our services

2. User Accounts
To place orders, users may create an account. Users are responsible for:
- Maintaining account security
- Keeping login information confidential
- All activities under their account

3. Orders
When placing an order:
- All information must be accurate
- Orders are subject to availability
- We reserve the right to cancel orders if necessary

4. Pricing
All prices are listed in Sri Lankan Rupees (LKR). Prices may change at any time without notice.

5. Delivery
Delivery times may vary depending on location and courier services. We are not responsible for delays caused by: Courier services, Weather, External factors beyond our control.

6. Returns and Refunds
If a book arrives damaged or incorrect, please contact us within 3 days of delivery. Refunds or replacements will be handled on a case-by-case basis.

7. Intellectual Property
All website content including logos, designs, and text belongs to Inkorabooks and may not be copied without permission.

8. Limitation of Liability
Inkorabooks is not liable for any indirect damages resulting from the use of this website.

9. Changes to Terms
We may update these Terms of Service at any time. Continued use of the website means you accept the updated terms.

10. Contact
For questions about these Terms, contact: Email: inkorabooks@gmail.com
      `
    },
    shipping: {
      title: 'Shipping Policy',
      content: `
Last Updated: March 2026

At Inkorabooks, we aim to deliver your knowledge assets as quickly and safely as possible.

1. Delivery Areas
We deliver to all locations across Sri Lanka.

2. Delivery Times
- Colombo & Suburbs: 2–3 working days.
- Outstation: 3–5 working days.
Please note that delivery times may be affected by public holidays or extreme weather conditions.

3. Shipping Rates
Shipping rates are calculated based on the weight of your order and your delivery location. The final shipping cost will be displayed at checkout.

4. Order Tracking
Once your order is dispatched, you will receive a tracking number via SMS or Email to monitor your delivery.

5. Delivery Partners
We work with reliable third-party courier services to ensure your books reach you in perfect condition.

6. Contact
For shipping inquiries, contact: Email: inkorabooks@gmail.com
      `
    },
    refund: {
      title: 'Return & Refund Policy',
      content: `
Last Updated: March 2026

At Inkorabooks, we want customers to receive their books in good condition. This Return & Refund Policy explains when returns or refunds are allowed.

1. Return Eligibility
You may request a return or replacement if:
- The book arrived damaged
- You received the wrong book
- The book has major printing defects
Return requests must be made within 3 days of receiving the order.

2. Non-Returnable Items
Returns are not accepted for:
- Change of mind
- Books that have been used, damaged, or marked by the customer
- Requests made after 3 days of delivery

3. How to Request a Return
To request a return or replacement, contact us with:
- Your order number
- Your name
- Photos of the damaged or incorrect item
Send the request to: Email: inkorabooks@gmail.com

4. Replacement Process
If your request is approved:
- We may send a replacement copy, or
- Offer a refund, depending on the situation.
Customers may be required to return the book before a replacement or refund is issued.

5. Refunds
If a refund is approved:
- The refund will be processed using the original payment method where possible.
- Refund processing may take 3–7 business days.

6. Shipping Costs
- If the return is due to our mistake (wrong or damaged book), we will cover the return shipping cost.
- If the return is due to customer reasons, shipping costs are not refundable.

7. Contact
For return-related questions, contact: Email: inkorabooks@gmail.com
      `
    }
  };

  const policy = policies[type];

  return (
    <div className="pt-32 pb-32 max-w-4xl mx-auto px-6">
      <div className="bg-white p-8 md:p-16 rounded-[3rem] border border-ink/5 shadow-2xl space-y-8">
        <h1 className="text-4xl md:text-5xl font-serif font-bold">{policy.title}</h1>
        <div className="h-1 w-20 bg-teal rounded-full" />
        <div className="prose prose-lg text-ink/70 whitespace-pre-line leading-relaxed">
          {policy.content}
        </div>
      </div>
    </div>
  );
};

const FAQPage = ({ setPage }: { setPage: (p: Page) => void }) => {
  const faqs = [
    { q: "How long does delivery take?", a: "We deliver islandwide within 3–5 working days. You will receive a tracking number once your order is dispatched." },
    { q: "What are the payment options?", a: "We currently offer only Cash on Delivery (COD). Any other Payment methods may be available upon request." },
    { q: "Can I request a specific book?", a: "Yes! If there's a specific title you're looking for that isn't in our current collection, message us on WhatsApp and we'll try to source it for you." },
    { q: "Do you offer bulk discounts?", a: "Yes, for corporate orders or bulk purchases (10+ books), please contact us directly for special pricing." },
    { q: "What is your return policy?", a: "We accept returns within 3 days if the book is damaged or incorrect. Please refer to our Refund Policy for more details." },
  ];

  return (
    <div className="pt-32 pb-32 max-w-3xl mx-auto px-6 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-serif font-bold">Frequently Asked Questions</h1>
        <p className="text-ink/60">Everything you need to know about building your library with INKORA.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details key={i} className="group bg-white border border-ink/5 rounded-2xl overflow-hidden transition-all">
            <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-bold text-lg">
              {faq.q}
              <Plus size={20} className="group-open:rotate-45 transition-transform text-teal" />
            </summary>
            <div className="px-6 pb-6 text-ink/70 leading-relaxed">
              {faq.a}
            </div>
          </details>
        ))}
        
        {/* Policy Links in FAQ */}
        <div className="pt-8 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-ink/30 px-6">Legal & Policies</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Privacy Policy', page: 'privacy' as Page },
              { label: 'Terms of Service', page: 'terms' as Page },
              { label: 'Shipping Policy', page: 'shipping' as Page },
              { label: 'Refund Policy', page: 'refund' as Page }
            ].map((policy) => (
              <button 
                key={policy.page}
                onClick={() => setPage(policy.page)}
                className="flex items-center justify-between p-6 bg-white border border-ink/5 rounded-2xl hover:border-teal/30 hover:shadow-xl transition-all group"
              >
                <span className="font-bold">{policy.label}</span>
                <ChevronRight size={20} className="text-teal group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8 bg-paper border border-ink/5 rounded-3xl text-center space-y-4">
        <h3 className="font-serif font-bold text-xl">Still have questions?</h3>
        <p className="text-ink/60">Our team is ready to help you on WhatsApp.</p>
        <a 
          href="https://wa.me/94743333932"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mx-auto hover:bg-green-600 transition-colors w-fit"
        >
          <MessageCircle size={20} />
          Chat with Us
        </a>
      </div>
    </div>
  );
};

// --- Page Components for Routing ---

const HomePageWrapper = ({ books, bundles, addToCart, setSelectedBook }: { books: Book[], bundles: Bundle[], addToCart: (item: Book | Bundle, type: 'book' | 'bundle') => void, setSelectedBook: (book: Book) => void }) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');

  return (
    <HomePage
      setPage={(page: string) => navigate(`/${page === 'home' ? '' : page}`)}
      setSelectedBook={setSelectedBook}
      addToCart={addToCart}
      onCategoryClick={(cat: string) => {
        setActiveCategory(cat);
        navigate('/shop');
      }}
      books={books}
      bundles={bundles}
      navigate={navigate}
    />
  );
};

const ShopPageWrapper = ({ books, addToCart, setSelectedBook }: { books: Book[], addToCart: (item: Book | Bundle, type: 'book' | 'bundle') => void, setSelectedBook: (book: Book) => void }) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');

  return (
    <ShopPage
      setPage={(page: string) => navigate(`/${page === 'home' ? '' : page}`)}
      setSelectedBook={setSelectedBook}
      addToCart={addToCart}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      books={books}
      navigate={navigate}
    />
  );
};

const BundlePageWrapper = ({ bundles, books, addToCart }: { bundles: Bundle[], books: Book[], addToCart: (item: Book | Bundle, type: 'book' | 'bundle') => void }) => {
  return <BundlePage addToCart={addToCart} bundles={bundles} books={books} />;
};

const ProductPageWrapper = ({ books, addToCart }: { books: Book[], addToCart: (item: Book | Bundle, type: 'book' | 'bundle') => void }) => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [fetchedBook, setFetchedBook] = useState<Book | null>(null);
  const bookFromStore = books.find(b => b.slug === slug);
  const book = bookFromStore || fetchedBook;

  useEffect(() => {
    if (!slug) return;
    if (bookFromStore) return; // already have it

    fetch(`/api/books/slug/${encodeURIComponent(slug)}`)
      .then(res => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setFetchedBook(data as Book);
        }
      })
      .catch(() => {
        // ignore
      });
  }, [slug, bookFromStore]);

  if (!slug) {
    return <div>Invalid book URL</div>;
  }

  if (!book) {
    return <div>Loading...</div>;
  }

  return (
    <ProductPage
      book={book}
      addToCart={addToCart}
      setPage={(page: string) => navigate(`/${page === 'home' ? '' : page}`)}
      setSelectedBook={() => {}}
      books={books}
    />
  );
};

const LegacyProductRedirect = ({ books }: { books: Book[] }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (!id) return;
    const book = books.find(b => b.id === id);
    if (book) {
      navigate(`/books/${book.slug}`, { replace: true });
    }
  }, [id, books, navigate]);

  return <div>Redirecting...</div>;
};

const CheckoutPageWrapper = ({ cartItems, user, clearCart }: { cartItems: CartItem[], user: User | null, clearCart: () => void }) => {
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <CheckoutPage
        cartItems={cartItems}
        setPage={(page: string) => navigate(`/${page === 'home' ? '' : page}`)}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        navigate={navigate}
        clearCart={clearCart}
      />
      <AuthModals
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={() => {}}
      />
    </>
  );
};

const AboutPageWrapper = () => <AboutPage />;

const FAQPageWrapper = () => {
  const navigate = useNavigate();
  return <FAQPage setPage={(page: string) => navigate(`/${page === 'home' ? '' : page}`)} />;
};

const PolicyPageWrapper = ({ type }: { type: 'privacy' | 'terms' | 'shipping' | 'refund' }) => <PolicyPage type={type} />;

const AdminLoginWrapper = () => {
  const navigate = useNavigate();
  return <AdminLogin onLogin={() => navigate('/admin')} />;
};

const AdminPageWrapper = ({ books, bundles, fetchBooks, fetchBundles }: { books: Book[], bundles: Bundle[], fetchBooks: () => void, fetchBundles: () => void }) => {
  const navigate = useNavigate();
  return (
    <AdminPage
      onLogout={() => navigate('/')}
      books={books}
      bundles={bundles}
      fetchBooks={fetchBooks}
      fetchBundles={fetchBundles}
    />
  );
};

const ProfilePageWrapper = ({ user, onUpdate }: { user: User | null, onUpdate: (user: User) => void }) => {
  const navigate = useNavigate();
  if (!user) {
    navigate('/');
    return null;
  }
  return <ProfilePage user={user} onUpdate={onUpdate} />;
};

// --- Main App Component ---

function AppContent() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const location = useLocation();

  const handleSetUser = (u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('user');
    }
  };

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(!!localStorage.getItem('adminToken'));
  const [books, setBooks] = useState<Book[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const navigate = useNavigate();

  const fetchBooks = () => {
    fetch('/api/books')
      .then(res => res.json())
      .then(data => setBooks(data));
  };

  const fetchBundles = () => {
    fetch('/api/bundles')
      .then(res => res.json())
      .then(data => setBundles(data));
  };

  useEffect(() => {
    fetchBooks();
    fetchBundles();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const clearCart = () => setCartItems([]);

  const addToCart = (item: Book | Bundle, type: 'book' | 'bundle') => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id && i.type === type);
      if (existing) {
        return prev.map(i => (i.id === item.id && i.type === type) ? { ...i, quantity: i.quantity + 1 } : i);
      }

      let finalItem = item;
      if (type === 'bundle') {
        const bundle = item as Bundle;
        const populatedBooks = bundle.books.map(b => {
          const bookId = typeof b === 'string' ? b : b.id;
          return books.find(book => book.id === bookId) || b;
        });
        finalItem = { ...bundle, books: populatedBooks as Book[] };
      }

      return [...prev, { id: item.id, type, item: finalItem, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, type: 'book' | 'bundle', delta: number) => {
    setCartItems(prev => prev.map(i => {
      if (i.id === id && i.type === type) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const removeItem = (id: string, type: 'book' | 'bundle') => {
    setCartItems(prev => prev.filter(i => !(i.id === id && i.type === type)));
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col selection:bg-teal selection:text-white">
      <Navbar
        currentPage="home" // This will be handled by the router
        setPage={() => {}} // Not used anymore
        cartCount={cartCount}
        toggleCart={() => setIsCartOpen(true)}
        user={user}
        onLogout={() => handleSetUser(null)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <main className="flex-1 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<HomePageWrapper books={books} bundles={bundles} addToCart={addToCart} setSelectedBook={setSelectedBook} />} />
          <Route path="/shop" element={<ShopPageWrapper books={books} addToCart={addToCart} setSelectedBook={setSelectedBook} />} />
          <Route path="/bundles" element={<BundlePageWrapper bundles={bundles} books={books} addToCart={addToCart} />} />
          <Route path="/product/:id" element={<LegacyProductRedirect books={books} />} />
          <Route path="/books/:slug" element={<ProductPageWrapper books={books} addToCart={addToCart} />} />
          <Route path="/checkout" element={<CheckoutPageWrapper cartItems={cartItems} user={user} clearCart={clearCart} />} />
          <Route path="/about" element={<AboutPageWrapper />} />
          <Route path="/faq" element={<FAQPageWrapper />} />
          <Route path="/privacy" element={<PolicyPageWrapper type="privacy" />} />
          <Route path="/terms" element={<PolicyPageWrapper type="terms" />} />
          <Route path="/shipping" element={<PolicyPageWrapper type="shipping" />} />
          <Route path="/refund" element={<PolicyPageWrapper type="refund" />} />
          <Route path="/admin-login" element={<AdminLoginWrapper />} />
          <Route path="/admin" element={<AdminPageWrapper books={books} bundles={bundles} fetchBooks={fetchBooks} fetchBundles={fetchBundles} />} />
          <Route path="/profile" element={<ProfilePageWrapper user={user} onUpdate={setUser} />} />
        </Routes>
      </main>

      <Footer setPage={() => {}} /> {/* Footer navigation updated to use navigate */}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        updateQuantity={updateQuantity}
        removeItem={removeItem}
        onCheckout={() => {
          setIsCartOpen(false);
          navigate('/checkout');
        }}
      />

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        setPage={() => {}} // Not used anymore
        setSelectedBook={(book) => {
          setSelectedBook(book);
          navigate(`/books/${book.slug}`);
          setIsSearchOpen(false);
        }}
        books={books}
      />

      <AuthModals
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleSetUser}
      />

      {/* WhatsApp Floating Button */}
      <motion.a
        href="https://wa.me/94743333932"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl transition-all z-40 group"
      >
        <MessageCircle size={32} />
        <span className="absolute -top-1 -left-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
        </span>
        <span className="absolute right-full mr-4 bg-white text-ink px-4 py-2 rounded-lg text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Order via WhatsApp
        </span>
      </motion.a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
