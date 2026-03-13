"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import CartPanel from "./components/CartSidebar";
import type { BookCardProps } from "./components/BookCard";

export type Currency = "GBP" | "EUR" | "USD";

type Message = {
  role: "user" | "assistant";
  content: string;
  books?: BookCardProps[];
};

export type CartItem = {
  id?: string;
  title: string;
  price: string;
  author?: string;
  url?: string;
  shop?: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState<Currency>("GBP");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });
      const textBody = await res.text();
      let data: { reply?: string; session_id?: string; books?: unknown[]; detail?: string };
      try {
        data = textBody ? JSON.parse(textBody) : {};
      } catch {
        throw new Error(res.ok ? "Invalid response" : `API error ${res.status}: ${textBody.slice(0, 150)}`);
      }
      if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : String(data.detail || res.statusText).slice(0, 200));
      setSessionId(data.session_id ?? null);
      const cardBooks: BookCardProps[] = (data.books || []).map((raw: unknown) => {
        const b = raw as Record<string, unknown>;
        return {
          id: b.id as string | undefined,
          title: (b.title as string) || "Unknown",
          author: (b.author as string) || "—",
          genre: (b.genre as string) || "Book",
          rating: typeof b.rating === "number" ? b.rating : parseInt(String(b.rating || 0), 10) || 0,
          reviewCount: String(b.reviewCount ?? b.Number_of_reviews ?? "0"),
          price: String(b.price ?? "—"),
          coverSrc: b.coverSrc as string | undefined,
          url: b.url as string | undefined,
          shop: b.shop as string | undefined,
        };
      });
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply ?? "", books: cardBooks.length ? cardBooks : undefined },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart(book: BookCardProps) {
    setCart((prev) => [
      ...prev,
      { id: book.id, title: book.title, price: book.price, author: book.author, url: book.url, shop: book.shop },
    ]);
  }

  function handleRemoveFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="bookbot-root">
      <Sidebar />
      <div className="bookbot-main">
        <header className="bookbot-main-header">
          <div className="bookbot-header-left">
            <h1 className="bookbot-main-title">Book Recommendations</h1>
            <p className="bookbot-main-status">BookBot is online</p>
          </div>
          <div className="bookbot-currency-switcher" aria-label="Currency selector">
            {(["GBP", "EUR", "USD"] as Currency[]).map((c) => (
              <button
                key={c}
                type="button"
                className={`bookbot-currency-btn ${currency === c ? "active" : ""}`}
                onClick={() => setCurrency(c)}
                aria-pressed={currency === c}
              >
                {c === "GBP" ? "£ GBP" : c === "EUR" ? "€ EUR" : "$ USD"}
              </button>
            ))}
          </div>
        </header>
        <div className="bookbot-messages">
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              books={msg.books}
              onAddToCart={handleAddToCart}
              currency={currency}
            />
          ))}
          {loading && <div className="bookbot-loading">Searching and answering…</div>}
          {error && <div className="bookbot-error">{error}</div>}
          <div ref={bottomRef} />
        </div>
        <ChatInput value={input} onChange={setInput} onSubmit={handleSubmit} disabled={loading} />
      </div>
      <CartPanel items={cart} currency={currency} onRemove={handleRemoveFromCart} />
    </div>
  );
}
