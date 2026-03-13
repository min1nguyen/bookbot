"use client";

import BookCard, { type BookCardProps } from "./BookCard";
import type { Currency } from "../page";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  books?: BookCardProps[];
  onAddToCart?: (book: BookCardProps) => void;
  currency?: Currency;
};

export default function ChatMessage({ role, content, books = [], onAddToCart, currency = "GBP" }: ChatMessageProps) {
  const isUser = role === "user";
  return (
    <div className={`bookbot-msg-wrap ${isUser ? "user" : "assistant"}`}>
      <div className={`bookbot-msg-bubble ${isUser ? "user" : "assistant"}`}>
        <p className="bookbot-msg-text">{content}</p>
        {!isUser && books.length > 0 && (
          <div className="bookbot-msg-books">
            {books.map((book, i) => (
              <BookCard key={book.id ?? i} {...book} currency={currency} onAddToCart={onAddToCart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
