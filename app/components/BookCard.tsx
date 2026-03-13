"use client";

import type { Currency } from "../page";

export type BookCardProps = {
  id?: string;
  title: string;
  author?: string;
  genre: string;
  rating: number;
  reviewCount: string;
  /** Raw price string from API, always in £ (e.g. "£14.99"). Displayed after currency conversion. */
  price: string;
  coverSrc?: string;
  coverAlt?: string;
  url?: string;
  /** Shop identifier for cart grouping (e.g. shop1, shop2). */
  shop?: string;
  currency?: Currency;
  onAddToCart?: (book: BookCardProps) => void;
};

const RATES: Record<Currency, number> = { GBP: 1, EUR: 1.17, USD: 1.27 };
const SYMBOLS: Record<Currency, string> = { GBP: "£", EUR: "€", USD: "$" };

function displayPrice(price: string, currency: Currency = "GBP"): string {
  const num = parseFloat(price.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return price;
  return `${SYMBOLS[currency]}${(num * RATES[currency]).toFixed(2)}`;
}

function StarRating({ filled, total = 5 }: { filled: number; total?: number }) {
  return (
    <span className="bookbot-stars" aria-label={`${filled} out of ${total} stars`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`bookbot-star ${i < filled ? "filled" : "empty"}`} aria-hidden>★</span>
      ))}
    </span>
  );
}

export default function BookCard({
  id, title, author = "—", genre, rating, reviewCount, price,
  coverSrc, coverAlt = "", url, shop, currency = "GBP", onAddToCart,
}: BookCardProps) {
  return (
    <article className="bookbot-book-card">
      <div className="bookbot-book-cover-wrap">
        {coverSrc ? (
          <img src={coverSrc} alt={coverAlt || title} className="bookbot-book-cover" />
        ) : (
          <div className="bookbot-book-cover bookbot-book-cover-placeholder" />
        )}
      </div>
      <div className="bookbot-book-info">
        <h3 className="bookbot-book-title">
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" className="bookbot-book-title-link">{title}</a>
          ) : title}
        </h3>
        <p className="bookbot-book-author">{author}</p>
        <span className="bookbot-book-genre">{genre}</span>
        <div className="bookbot-book-meta">
          <StarRating filled={rating} />
          <span className="bookbot-book-reviews">({reviewCount})</span>
        </div>
        {shop && <span className="bookbot-book-shop">📍 {shop.toUpperCase()}</span>}
        <div className="bookbot-book-actions">
          <span className="bookbot-book-price">{displayPrice(price, currency)}</span>
          <button
            type="button"
            className="bookbot-btn-cart"
            onClick={() => onAddToCart?.({ id, title, author, genre, rating, reviewCount, price, coverSrc, coverAlt, url, shop, currency, onAddToCart })}
          >
            <span className="bookbot-cart-icon" aria-hidden>🛒</span>
            Add to Cart
          </button>
          <button type="button" className="bookbot-btn-heart" aria-label="Add to wishlist">♡</button>
        </div>
      </div>
    </article>
  );
}
