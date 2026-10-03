export type StoreProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  colors: string[];
  sizes: string[];
  image: string;
  badge?: string;
  rating?: number;
  reviewsCount?: number;
};

export const products: StoreProduct[] = [
  {
    id: "oversized-cotton-tee",
    name: "Oversized Cotton T-Shirt",
    category: "T-Shirts",
    price: 1499,
    description: "Soft heavyweight cotton with a relaxed, everyday fit. Dropped shoulders and durable ribbed collar.",
    colors: ["Cloud", "Forest", "Ink"],
    sizes: ["S", "M", "L", "XL"],
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop",
    badge: "Best seller",
    rating: 4.8,
    reviewsCount: 142,
  },
  {
    id: "tailored-poplin-shirt",
    name: "Tailored Poplin Shirt",
    category: "Shirts",
    price: 2199,
    description: "Crisp cotton poplin made for easy layering and clean silhouettes. Finished with mother-of-pearl buttons.",
    colors: ["White", "Sky"],
    sizes: ["S", "M", "L", "XL"],
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop",
    badge: "New Arrival",
    rating: 4.9,
    reviewsCount: 88,
  },
  {
    id: "classic-denim-jacket",
    name: "Classic Denim Jacket",
    category: "Jackets",
    price: 3299,
    description: "A structured mid-wash denim layer for every season. 100% rigid regenerative organic cotton.",
    colors: ["Mid wash"],
    sizes: ["S", "M", "L", "XL"],
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=800&auto=format&fit=crop",
    rating: 4.7,
    reviewsCount: 65,
  },
  {
    id: "wide-leg-trouser",
    name: "Wide Leg Pleated Trouser",
    category: "Trousers",
    price: 2699,
    description: "Fluid, high-rise trousers with a tailored wide leg, deep front pleats, and comfortable back elastic waistband.",
    colors: ["Stone", "Black"],
    sizes: ["S", "M", "L"],
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800&auto=format&fit=crop",
    rating: 4.6,
    reviewsCount: 47,
  },
  {
    id: "premium-running-shoes",
    name: "Velocity Runner Sneakers",
    category: "Shoes",
    price: 4999,
    description: "Cushioned daily trainers built for effortless movement. Breathable knit upper with responsive foam midsole.",
    colors: ["Sand", "Charcoal"],
    sizes: ["6", "7", "8", "9", "10"],
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
    badge: "Top Rated",
    rating: 4.9,
    reviewsCount: 219,
  },
  {
    id: "linen-day-dress",
    name: "Linen Day Midi Dress",
    category: "Dresses",
    price: 2899,
    description: "Breathable pure European linen with an easy, softly defined shape. Side slit and discreet side seam pockets.",
    colors: ["Ochre", "Natural"],
    sizes: ["S", "M", "L"],
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800&auto=format&fit=crop",
    rating: 4.8,
    reviewsCount: 94,
  },
];

export const getProduct = (id: string) => products.find((product) => product.id === id);
