"use client";

/**
 * Persistent right-hand cart panel. Items grouped by shop with airport directions.
 */

import type { CartItem } from "../page";
import type { Currency } from "../page";

// Creative airport shop directions
const SHOP_INFO: Record<string, { emoji: string; directions: string }> = {
  shop1: {
    emoji: "✈️",
    directions: "Terminal A · Level 2 — Past security, turn left at the coffee bar, look for the orange sign.",
  },
  shop2: {
    emoji: "🛬",
    directions: "Terminal B · Arrivals Hall — Ground floor, opposite the luggage carousel 3.",
  },
  shop3: {
    emoji: "🌍",
    directions: "Terminal C · International Departures — After passport control, follow signs to Gate C12.",
  },
  shop4: {
    emoji: "🏪",
    directions: "Terminal A · Landside · Level 1 — Main entrance, before check-in, near the information desk.",
  },
};

const RATES: Record<Currency, number> = { GBP: 1, EUR: 1.17, USD: 1.27 };
const SYMBOLS: Record<Currency, string> = { GBP: "£", EUR: "€", USD: "$" };

function convertPrice(priceGbp: string, currency: Currency): string {
  const num = parseFloat(priceGbp.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return priceGbp;
  return `${SYMBOLS[currency]}${(num * RATES[currency]).toFixed(2)}`;
}

function groupByShop(items: CartItem[]): Array<{ shop: string; items: CartItem[] }> {
  const map = new Map<string, CartItem[]>();
  for (const item of items) {
    const shop = item.shop?.trim() || "other";
    if (!map.has(shop)) map.set(shop, []);
    map.get(shop)!.push(item);
  }
  return Array.from(map.keys())
    .sort()
    .map((shop) => ({ shop, items: map.get(shop)! }));
}

type CartPanelProps = {
  items: CartItem[];
  currency: Currency;
  onRemove: (index: number) => void;
  isOpen?: boolean;
  onClose?: () => void;
};

export default function CartPanel({ items, currency, onRemove, isOpen = false, onClose }: CartPanelProps) {
  const groups = groupByShop(items);
  const total = items.reduce((sum, item) => {
    const num = parseFloat(item.price.replace(/[^0-9.]/g, ""));
    return sum + (isNaN(num) ? 0 : num * RATES[currency]);
  }, 0);

  // Build a flat index map so onRemove gets the correct index in the full items array
  function globalIndex(shopGroup: { shop: string; items: CartItem[] }, localIdx: number): number {
    let offset = 0;
    for (const g of groups) {
      if (g.shop === shopGroup.shop) return offset + localIdx;
      offset += g.items.length;
    }
    return offset + localIdx;
  }

  return (
    <aside className={`bookbot-cart-panel ${isOpen ? "mobile-open" : ""}`} aria-label="Shopping cart">
      <div className="bookbot-cart-panel-header">
        <span className="bookbot-cart-panel-icon" aria-hidden>🛒</span>
        <h2 className="bookbot-cart-panel-title">Your Cart</h2>
        {items.length > 0 && (
          <span className="bookbot-cart-panel-count">{items.length}</span>
        )}
        <button type="button" className="bookbot-cart-panel-close" onClick={onClose} aria-label="Close cart">×</button>
      </div>

      <div className="bookbot-cart-panel-body">
        {items.length === 0 ? (
          <div className="bookbot-cart-panel-empty">
            <p>Your cart is empty.</p>
            <p className="bookbot-cart-panel-hint">Ask BookBot for a recommendation and add books here!</p>
          </div>
        ) : (
          <>
            {groups.map((group) => {
              const info = SHOP_INFO[group.shop] ?? { emoji: "📚", directions: "Ask airport staff for directions." };
              return (
                <section key={group.shop} className="bookbot-cart-shop-group">
                  <div className="bookbot-cart-shop-header">
                    <span className="bookbot-cart-shop-emoji" aria-hidden>{info.emoji}</span>
                    <h3 className="bookbot-cart-shop-name">{group.shop.toUpperCase()}</h3>
                  </div>
                  <p className="bookbot-cart-shop-directions">{info.directions}</p>
                  <ul className="bookbot-cart-list">
                    {group.items.map((item, i) => (
                      <li key={item.id ?? `${item.title}-${i}`} className="bookbot-cart-item">
                        <div className="bookbot-cart-item-info">
                          <span className="bookbot-cart-item-title">{item.title}</span>
                          {item.author && <span className="bookbot-cart-item-author">{item.author}</span>}
                        </div>
                        <div className="bookbot-cart-item-right">
                          <span className="bookbot-cart-item-price">{convertPrice(item.price, currency)}</span>
                          <button
                            type="button"
                            className="bookbot-cart-item-remove"
                            aria-label={`Remove ${item.title}`}
                            onClick={() => onRemove(globalIndex(group, i))}
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}

            <div className="bookbot-cart-total">
              <span>Total</span>
              <span className="bookbot-cart-total-price">{SYMBOLS[currency]}{total.toFixed(2)}</span>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
