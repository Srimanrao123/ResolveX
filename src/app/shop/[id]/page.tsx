import { notFound } from "next/navigation";
import Link from "next/link";
import { AddToCart } from "@/components/add-to-cart";
import { formatPrice } from "@/lib/demo-data";
import { getProduct } from "@/lib/products";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = getProduct((await params).id);
  if (!product) notFound();

  return (
    <div className="page-shell">
      <Link href="/shop" className="back-link">
        ← Back to collection
      </Link>
      <div className="product-detail">
        <div className="store-art detail-art">
          {product.badge && <span className="badge">{product.badge}</span>}
          <img src={product.image} alt={product.name} className="product-image-cover" />
        </div>
        <section>
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          {product.rating && (
            <p className="product-rating" style={{ margin: "4px 0 16px" }}>
              <span className="stars">★★★★★</span>
              <span className="score">{product.rating}</span>
              <span className="count">({product.reviewsCount} customer reviews)</span>
            </p>
          )}
          <strong className="product-price">{formatPrice(product.price)}</strong>
          <p className="product-description">{product.description}</p>

          <div className="colour-list">
            <span>Available colours</span>
            <p>{product.colors.join(" · ")}</p>
          </div>

          <AddToCart product={product} />

          <div className="size-note">
            <strong>Size guide &amp; Return Policy</strong>
            <p>Our pieces are designed for a relaxed, true-to-size fit.</p>
            <p>
              Protected by <strong>ReturnGuard AI</strong>: 14-day hassle-free returns with instant approval for unworn items.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
