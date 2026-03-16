import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('inkora.db');

// Helper for slug generation
const slugify = (text: string) => {
  return text
    .toString()
    .normalize('NFKD')
    // remove diacritical marks (accents)
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/['"“”‘’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const generateUniqueSlug = (title: string, excludeId?: string) => {
  const base = slugify(title) || 'item';
  const likePattern = `${base}%`;
  const params: any[] = [likePattern];
  let query = 'SELECT slug FROM books WHERE slug LIKE ?';
  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  const existing = db.prepare(query).all(...params).map((r: any) => r.slug).filter(Boolean) as string[];
  const used = new Set(existing);

  if (!used.has(base)) {
    return base;
  }

  let i = 2;
  while (true) {
    const candidate = `${base}-${i}`;
    if (!used.has(candidate)) return candidate;
    i += 1;
  }
};

const ensureSlugColumn = () => {
  const columns = db.prepare("PRAGMA table_info(books)").all() as any[];
  const hasSlug = columns.some(c => c.name === 'slug');
  if (!hasSlug) {
    db.exec('ALTER TABLE books ADD COLUMN slug TEXT;');
  }

  const books = db.prepare('SELECT id, title, slug FROM books').all() as any[];
  const used = new Set<string>();

  books.forEach((book) => {
    let slug = book.slug;
    if (!slug) {
      slug = generateUniqueSlug(book.title, book.id);
      db.prepare('UPDATE books SET slug = ? WHERE id = ?').run(slug, book.id);
    }

    if (used.has(slug)) {
      slug = generateUniqueSlug(book.title, book.id);
      db.prepare('UPDATE books SET slug = ? WHERE id = ?').run(slug, book.id);
    }

    used.add(slug);
  });

  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_books_slug ON books(slug);');
};

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    profilePic TEXT,
    isVerified INTEGER DEFAULT 1,
    verificationCode TEXT,
    isAdmin INTEGER DEFAULT 0,
    fullName TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    firstName TEXT,
    lastName TEXT,
    email TEXT,
    city TEXT,
    address TEXT,
    phone TEXT,
    notes TEXT,
    total REAL,
    items TEXT,
    paymentMethod TEXT,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT,
    author TEXT,
    price REAL,
    image TEXT,
    description TEXT,
    category TEXT,
    whoIsItFor TEXT,
    keyTakeaways TEXT,
    isBestSeller INTEGER DEFAULT 0,
    discount REAL DEFAULT 0,
    slug TEXT
  );

  CREATE TABLE IF NOT EXISTS bundles (
    id TEXT PRIMARY KEY,
    title TEXT,
    books TEXT,
    price REAL,
    originalPrice REAL,
    image TEXT,
    description TEXT,
    discount REAL DEFAULT 0
  );
`);

ensureSlugColumn();

// Seed Initial Data
const bookCount = db.prepare('SELECT COUNT(*) as count FROM books').get() as any;
if (bookCount.count === 0) {
  const initialBooks = [
    { id: '1', title: 'Atomic Habits', author: 'James Clear', price: 3500, image: 'https://m.media-amazon.com/images/I/91bYsX41DVL._AC_UF1000,1000_QL80_.jpg', description: 'An easy and proven way to build good habits and break bad ones.', category: 'Productivity', whoIsItFor: ['Entrepreneurs', 'Students', 'Anyone looking to improve'], keyTakeaways: ['Small changes lead to big results', 'Focus on systems, not goals', 'Identity-based habits'], isBestSeller: 1 },
    { id: '2', title: 'Essentialism', author: 'Greg McKeown', price: 3800, image: 'https://m.media-amazon.com/images/I/71X8X8-S3UL._AC_UF1000,1000_QL80_.jpg', description: 'The disciplined pursuit of less.', category: 'Productivity', whoIsItFor: ['Busy professionals', 'Leaders', 'Overwhelmed individuals'], keyTakeaways: ['Less but better', 'The power of choice', 'The discipline of elimination'], isBestSeller: 1 },
    { id: '3', title: 'Feel Good Productivity', author: 'Ali Abdaal', price: 4200, image: 'https://m.media-amazon.com/images/I/71u9S+X9X+L._AC_UF1000,1000_QL80_.jpg', description: 'How to do more of what matters to you.', category: 'Productivity', whoIsItFor: ['Knowledge workers', 'Creatives', 'Ambitious professionals'], keyTakeaways: ['Play is the ultimate productivity hack', 'Power of small wins', 'Focus on the process'], isBestSeller: 1 },
    { id: '4', title: 'Can\'t Hurt Me', author: 'David Goggins', price: 4500, image: 'https://m.media-amazon.com/images/I/81g8T-0D+9L._AC_UF1000,1000_QL80_.jpg', description: 'Master your mind and defy the odds.', category: 'Mindset', whoIsItFor: ['Athletes', 'Entrepreneurs', 'Anyone facing adversity'], keyTakeaways: ['The 40% rule', 'Callous your mind', 'Taking souls'], isBestSeller: 1 },
    { id: '5', title: 'Dopamine Detox', author: 'Thibaut Meurisse', price: 2800, image: 'https://m.media-amazon.com/images/I/61S8vV+Q+SL._AC_UF1000,1000_QL80_.jpg', description: 'A simple guide to eliminate distractions and train your brain to do hard things.', category: 'Productivity', whoIsItFor: ['Distracted individuals', 'Students', 'Focus seekers'], keyTakeaways: ['Identify dopamine triggers', 'The power of boredom', 'Deep work habits'], isBestSeller: 0 },
    { id: '6', title: 'The Diary of a CEO', author: 'Steven Bartlett', price: 4800, image: 'https://m.media-amazon.com/images/I/71p+8v+8+SL._AC_UF1000,1000_QL80_.jpg', description: 'The 33 laws of business and life.', category: 'Business', whoIsItFor: ['Founders', 'Leaders', 'Aspiring entrepreneurs'], keyTakeaways: ['The law of the first 5 minutes', 'The power of story', 'The importance of culture'], isBestSeller: 1 },
    { id: '7', title: 'Million Dollar Weekend', author: 'Noah Kagan', price: 3900, image: 'https://m.media-amazon.com/images/I/71p+8v+8+SL._AC_UF1000,1000_QL80_.jpg', description: 'The surprisingly simple way to launch a 7-figure business in 48 hours.', category: 'Business', whoIsItFor: ['Aspiring founders', 'Side hustlers', 'Action takers'], keyTakeaways: ['The "Now" habit', 'Ask for what you want', 'Validate before building'], isBestSeller: 0 }
  ];
  const insertBook = db.prepare('INSERT INTO books (id, title, author, price, image, description, category, whoIsItFor, keyTakeaways, isBestSeller, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  initialBooks.forEach(b => {
    const slug = generateUniqueSlug(b.title, b.id);
    insertBook.run(b.id, b.title, b.author, b.price, b.image, b.description, b.category, JSON.stringify(b.whoIsItFor), JSON.stringify(b.keyTakeaways), b.isBestSeller, slug);
  });
}

const bundleCount = db.prepare('SELECT COUNT(*) as count FROM bundles').get() as any;
if (bundleCount.count === 0) {
  const initialBundles = [
    { id: 'b1', title: 'The Founder Starter Pack', books: ['6', '7'], price: 7500, originalPrice: 8700, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000', description: 'Everything you need to start your journey from zero to one with a lean mindset.' },
    { id: 'b2', title: 'The Productivity Masterclass', books: ['1', '3'], price: 6500, originalPrice: 7700, image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=1000', description: 'Master your habits and your focus to achieve deep work every single day.' },
    { id: 'b3', title: 'The Mindset Shift', books: ['4', '5'], price: 6200, originalPrice: 7300, image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1000', description: 'Build mental toughness and eliminate distractions to reach your full potential.' }
  ];
  const insertBundle = db.prepare('INSERT INTO bundles (id, title, books, price, originalPrice, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
  initialBundles.forEach(b => insertBundle.run(b.id, b.title, JSON.stringify(b.books), b.price, b.originalPrice, b.image, b.description));
}

// Migration: Lowercase all existing user emails
db.exec("UPDATE users SET email = LOWER(email)");

async function findFreePort(startPort: number): Promise<number> {
  const maxPort = startPort + 50;
  for (let port = startPort; port <= maxPort; port += 1) {
    const server = net.createServer();
    let cleanup = () => {
      try {
        server.close();
      } catch {
        /* no-op */
      }
    };

    try {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.once('listening', () => {
          server.close(() => resolve());
        });
        server.listen(port, '0.0.0.0');
      });
      return port;
    } catch {
      cleanup();
      // Port is in use, try next
    }
  }
  throw new Error(`Unable to find a free port between ${startPort} and ${maxPort}`);
}

async function startServer() {
  const app = express();
  const requestedPort = Number(process.env.PORT) || 3000;
  const PORT = await findFreePort(requestedPort);

  if (PORT !== requestedPort) {
    console.warn(`Port ${requestedPort} is in use, using ${PORT} instead.`);
  }

  const requestedHmrPort = Number(process.env.HMR_PORT) || 24678;
  const HMR_PORT = await findFreePort(requestedHmrPort);

  if (HMR_PORT !== requestedHmrPort) {
    console.warn(`HMR port ${requestedHmrPort} is in use, using ${HMR_PORT} instead.`);
  }

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- API Routes ---

  // Middleware
  const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader === 'Bearer mock-admin-token') {
      next();
    } else {
      res.status(401).json({ success: false, message: 'Unauthorized admin access' });
    }
  };

  // Auth
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, profilePic, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const lowerEmail = email.toLowerCase().trim();
    
    try {
      const stmt = db.prepare('INSERT INTO users (email, password, profilePic, isVerified, fullName) VALUES (?, ?, ?, 1, ?)');
      const info = stmt.run(lowerEmail, password, profilePic, fullName || '');
      
      const user = db.prepare('SELECT id, email, profilePic, fullName, isAdmin FROM users WHERE id = ?').get(info.lastInsertRowid) as any;
      
      res.json({ success: true, user });
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const lowerEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(lowerEmail, password) as any;
    
    if (user) {
      res.json({ success: true, user: { id: user.id, email: user.email, profilePic: user.profilePic, fullName: user.fullName, isAdmin: user.isAdmin } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });

  // Admin Auth
  app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    // Hardcoded admin for demo or check DB
    if (email === 'inkoraOfficial@gmail.com' && password === 'inkorabooks@2024') {
      res.json({ success: true, token: 'mock-admin-token' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
  });

  // Orders
  app.post('/api/orders', (req, res) => {
    const { 
      userId, firstName, lastName, email, city, address, 
      phone, retypePhone, notes, total, items, paymentMethod 
    } = req.body;
    
    if (phone !== retypePhone) {
      return res.status(400).json({ success: false, message: 'Phone numbers do not match' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO orders (
          userId, firstName, lastName, email, city, address, 
          phone, notes, total, items, paymentMethod
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        userId, firstName, lastName, email, city, address, 
        phone, notes, total, JSON.stringify(items), paymentMethod
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  // Admin Dashboard
  app.get('/api/admin/orders', adminAuth, (req, res) => {
    const orders = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
    res.json(orders);
  });

  app.patch('/api/admin/orders/:id/status', adminAuth, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/admin/orders/:id', adminAuth, (req, res) => {
    const { id } = req.params;
    try {
      const result = db.prepare('DELETE FROM orders WHERE id = ?').run(id);
      if (result.changes === 0) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  // User Profile
  app.get('/api/user/orders/:userId', (req, res) => {
    const { userId } = req.params;
    const orders = db.prepare('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC').all(userId);
    res.json(orders);
  });

  app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;
    try {
      const result = db.prepare('DELETE FROM orders WHERE id = ? AND userId = ?').run(id, userId);
      if (result.changes === 0) {
        return res.status(404).json({ success: false, message: 'Order not found or not authorized' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.patch('/api/user/profile', (req, res) => {
    const { userId, fullName, profilePic } = req.body;
    try {
      db.prepare('UPDATE users SET fullName = ?, profilePic = ? WHERE id = ?').run(fullName, profilePic, userId);
      const user = db.prepare('SELECT id, email, fullName, profilePic, isAdmin FROM users WHERE id = ?').get(userId);
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.get('/api/admin/analytics', adminAuth, (req, res) => {
    const orders = db.prepare("SELECT items FROM orders WHERE status != 'cancelled'").all() as any[];
    const itemCounts: Record<string, { title: string, count: number, type: string, image: string }> = {};

    orders.forEach(order => {
      const items = JSON.parse(order.items);
      items.forEach((item: any) => {
        const id = item.id;
        if (!itemCounts[id]) {
          itemCounts[id] = { 
            title: item.item.title, 
            count: 0, 
            type: item.type,
            image: item.item.image
          };
        }
        itemCounts[id].count += item.quantity;
      });
    });

    const bestSellers = Object.values(itemCounts).sort((a, b) => b.count - a.count);
    res.json({ bestSellers });
  });

  // Admin Users
  app.get('/api/admin/users', adminAuth, (req, res) => {
    const users = db.prepare('SELECT id, email, fullName, profilePic, isAdmin, isVerified FROM users ORDER BY id DESC').all();
    res.json(users);
  });

  // Books Management
  app.get('/api/books', (req, res) => {
    const books = db.prepare('SELECT * FROM books').all();
    res.json(books.map((b: any) => ({
      ...b,
      whoIsItFor: JSON.parse(b.whoIsItFor || '[]'),
      keyTakeaways: JSON.parse(b.keyTakeaways || '[]'),
      isBestSeller: !!b.isBestSeller
    })));
  });

  app.get('/api/books/slug/:slug', (req, res) => {
    const { slug } = req.params;
    const book = db.prepare('SELECT * FROM books WHERE slug = ?').get(slug) as any;
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({
      ...book,
      whoIsItFor: JSON.parse(book.whoIsItFor || '[]'),
      keyTakeaways: JSON.parse(book.keyTakeaways || '[]'),
      isBestSeller: !!book.isBestSeller
    });
  });

  // Redirect old product URLs to SEO-friendly slugs
  app.get('/product/:id', (req, res) => {
    const { id } = req.params;
    const book = db.prepare('SELECT slug FROM books WHERE id = ?').get(id) as any;
    if (!book || !book.slug) {
      return res.status(404).send('Not found');
    }
    return res.redirect(301, `/books/${book.slug}`);
  });

  app.post('/api/admin/books', adminAuth, (req, res) => {
    const { id, title, author, price, image, description, category, whoIsItFor, keyTakeaways, isBestSeller, discount } = req.body;
    try {
      const slug = generateUniqueSlug(title, id);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO books (id, title, author, price, image, description, category, whoIsItFor, keyTakeaways, isBestSeller, discount, slug)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        title,
        author,
        price,
        image,
        description,
        category,
        JSON.stringify(whoIsItFor),
        JSON.stringify(keyTakeaways),
        isBestSeller ? 1 : 0,
        discount || 0,
        slug
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/admin/books/:id', adminAuth, (req, res) => {
    const { id } = req.params;
    const trimmedId = id.trim();
    console.log(`[ADMIN] Deleting book. Original ID: "${id}", Trimmed ID: "${trimmedId}"`);
    try {
      const result = db.prepare('DELETE FROM books WHERE id = ?').run(trimmedId);
      console.log('[ADMIN] Delete result:', result);
      if (result.changes === 0) {
        console.warn(`[ADMIN] No book found with ID: "${trimmedId}"`);
        return res.status(404).json({ success: false, message: 'Book not found' });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('[ADMIN] Delete error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  });

  // Bundles Management
  app.get('/api/bundles', (req, res) => {
    const bundles = db.prepare('SELECT * FROM bundles').all();
    res.json(bundles.map((b: any) => ({
      ...b,
      books: JSON.parse(b.books || '[]')
    })));
  });

  app.post('/api/admin/bundles', adminAuth, (req, res) => {
    const { id, title, books, price, originalPrice, image, description, discount } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO bundles (id, title, books, price, originalPrice, image, description, discount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, title, JSON.stringify(books), price, originalPrice, image, description, discount || 0);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/admin/bundles/:id', adminAuth, (req, res) => {
    const { id } = req.params;
    const trimmedId = id.trim();
    console.log(`[ADMIN] Deleting bundle. Original ID: "${id}", Trimmed ID: "${trimmedId}"`);
    try {
      const result = db.prepare('DELETE FROM bundles WHERE id = ?').run(trimmedId);
      console.log('[ADMIN] Delete result:', result);
      if (result.changes === 0) {
        console.warn(`[ADMIN] No bundle found with ID: "${trimmedId}"`);
        return res.status(404).json({ success: false, message: 'Bundle not found' });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('[ADMIN] Delete error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          port: HMR_PORT,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Vite HMR websocket running on port ${HMR_PORT}`);
  });
}

startServer();
