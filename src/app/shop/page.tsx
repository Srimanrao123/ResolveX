import Link from "next/link";
import { products } from "@/lib/products";
import { formatPrice } from "@/lib/demo-data";

export default async function ShopPage() {
  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <p className="eyebrow">RESOLVEX COLLECTION</p>
          <h1>Everyday pieces, thoughtfully made.</h1>
          <p>Explore our newest staples and quiet best sellers.</p>
        </div>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <Link className="product-card" href={`/shop/${product.id}`} key={product.id}>
            <div className="store-art">
              {product.badge && <span className="badge">{product.badge}</span>}
              <img src={product.image} alt={product.name} className="product-image-cover" />
            </div>
            <p className="cat-label">{product.category}</p>
            <h2>{product.name}</h2>
            {product.rating && (
              <p className="product-rating">
                <span className="stars">★★★★★</span>
                <span className="score">{product.rating}</span>
                <span className="count">({product.reviewsCount})</span>
              </p>
            )}
            <strong>{formatPrice(product.price)}</strong>
          </Link>
        ))}
      </div>
    </div>
  );
}
