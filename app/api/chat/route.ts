/**
 * POST /api/chat
 * Full RAG pipeline: embed query → cosine similarity → OpenAI GPT chat.
 * Data files are loaded once per process from web/data/ (bundled for Vercel).
 */
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Book = {
  id?: string;
  title?: string;
  description?: string;
  url?: string;
  genres?: string[];
  themes?: string[];
  settings?: string[];
  characters?: string[];
  promotion?: string;
  shop?: string;
  availability?: string;
  rating?: string | number;
  Number_of_reviews?: string | number;
  price?: string;
  Price_incl_discount_tax?: string | number;
  publisher?: string;
  cover_image_url?: string;
};

// ---------------------------------------------------------------------------
// Data loading (cached per process / Lambda warm start)
// ---------------------------------------------------------------------------
let cachedBooks: Book[] | null = null;
let cachedEmbeddings: number[][] | null = null;
let cachedMetadata: Record<string, unknown> | null = null;

function loadData() {
  if (cachedBooks && cachedEmbeddings && cachedMetadata) {
    return { books: cachedBooks, embeddings: cachedEmbeddings, metadata: cachedMetadata };
  }
  const dataDir = path.join(process.cwd(), "data");
  cachedBooks = JSON.parse(fs.readFileSync(path.join(dataDir, "books.json"), "utf-8")) as Book[];
  cachedEmbeddings = JSON.parse(fs.readFileSync(path.join(dataDir, "embeddings.json"), "utf-8")) as number[][];
  cachedMetadata = JSON.parse(fs.readFileSync(path.join(dataDir, "metadata.json"), "utf-8")) as Record<string, unknown>;
  return { books: cachedBooks, embeddings: cachedEmbeddings, metadata: cachedMetadata };
}

// ---------------------------------------------------------------------------
// Vector math
// ---------------------------------------------------------------------------
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function embedQuery(query: string): Promise<number[]> {
  const res = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: query.trim() || " ",
  });
  return res.data[0].embedding;
}

function retrieveBooks(
  queryVec: number[],
  books: Book[],
  embeddings: number[][],
  topK = 8
): Array<{ book: Book; score: number }> {
  const scored = books.map((book, i) => ({
    book,
    score: cosineSimilarity(queryVec, embeddings[i]),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// ---------------------------------------------------------------------------
// LLM answer
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a friendly, sales-oriented book assistant at an airport bookshop. You answer only using the list of books provided to you — never invent titles, authors, or facts.

Rules:
- Be warm, engaging, and have light humour — travellers appreciate a good read!
- Recommend at least 3 books from the list when possible.
- Always mention the shop where each book is available (shop1, shop2, shop3, or shop4) so the customer knows where to pick it up.
- State the price and rating for every book you recommend.
- If a book has a rating above 4, mention it's highly rated and worth checking the reviews.
- If the query is broad or unspecific, ask a follow-up question to narrow down preferences, and lean toward books that are on promotion.
- If the query is about price, suggest books near that price and offer cheaper/pricier alternatives.
- Never make up information not present in the provided list.`;

function formatBooksForPrompt(results: Array<{ book: Book; score: number }>): string {
  return results
    .map((r, i) => {
      const b = r.book;
      const genres = (b.genres || []).join(", ");
      const themes = (b.themes || []).join(", ");
      const onPromo = b.promotion === "yes" ? " [On promotion]" : "";
      const priceNum = parseFloat(String(b.Price_incl_discount_tax ?? "0"));
      const price = !isNaN(priceNum) && priceNum > 0 ? `£${priceNum.toFixed(2)}` : String(b.price ?? "—");
      return [
        `${i + 1}. **${b.title}**${onPromo}`,
        `   Price: ${price} | Rating: ${b.rating ?? "?"}/5 | Reviews: ${b.Number_of_reviews ?? 0}`,
        `   Shop: ${b.shop ?? "?"} | Genres: ${genres || "—"} | Themes: ${themes || "—"}`,
        `   ${(b.description ?? "").slice(0, 250)}...`,
      ].join("\n");
    })
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// Session store (in-memory; resets on cold start — fine for demo)
// ---------------------------------------------------------------------------
type Session = { history: OpenAI.Chat.ChatCompletionMessageParam[]; recentQueries: string[] };
const sessions = new Map<string, Session>();

// ---------------------------------------------------------------------------
// Card shape for frontend
// ---------------------------------------------------------------------------
function bookToCard(b: Book) {
  const priceNum = parseFloat(String(b.Price_incl_discount_tax ?? "0"));
  const price = !isNaN(priceNum) && priceNum > 0 ? `£${priceNum.toFixed(2)}` : String(b.price ?? "—");
  const rating = parseInt(String(b.rating ?? "0"), 10) || 0;
  const genres = b.genres ?? [];
  return {
    id: b.id,
    title: b.title ?? "Unknown",
    author: b.publisher ?? "—",
    genre: genres.length > 0 ? String(genres[0]).charAt(0).toUpperCase() + String(genres[0]).slice(1) : "Book",
    rating: Math.min(5, Math.max(0, rating)),
    reviewCount: String(b.Number_of_reviews ?? "0"),
    price,
    coverSrc: b.cover_image_url ?? undefined,
    url: b.url ?? undefined,
    shop: b.shop ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  let body: { message?: string; session_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ detail: "message is required" }, { status: 400 });
  }

  const sessionId = body.session_id ?? crypto.randomUUID();
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { history: [], recentQueries: [] });
  }
  const session = sessions.get(sessionId)!;
  session.recentQueries.push(message);

  let books: Book[], embeddings: number[][];
  try {
    ({ books, embeddings } = loadData());
  } catch (err) {
    return NextResponse.json({ detail: `Failed to load data: ${err}` }, { status: 500 });
  }

  // Retrieve top books using the last 3 queries for context
  const retrievalQuery = session.recentQueries.slice(-3).join(" ");
  let queryVec: number[];
  try {
    queryVec = await embedQuery(retrievalQuery);
  } catch (err) {
    return NextResponse.json({ detail: `Embedding failed: ${err}` }, { status: 500 });
  }

  const results = retrieveBooks(queryVec, books, embeddings, 8);
  if (results.length === 0) {
    return NextResponse.json({
      reply: "No matching books found. Try a different question!",
      session_id: sessionId,
      books: [],
    });
  }

  const booksBlock = formatBooksForPrompt(results);
  const userContent = `Books available to recommend (use only these):\n\n${booksBlock}\n\n---\nCustomer question: ${message}\n\nReply in a few friendly sentences. Recommend at least 3 books when possible. Be persuasive and mention shop locations.`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...session.history,
    { role: "user", content: userContent },
  ];

  let reply: string;
  try {
    const res = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 600,
    });
    reply = res.choices[0].message.content?.trim() ?? "Sorry, I couldn't generate a response.";
  } catch (err) {
    return NextResponse.json({ detail: `LLM call failed: ${err}` }, { status: 500 });
  }

  // Update history (keep last 10 turns to avoid token bloat)
  session.history.push({ role: "user", content: userContent });
  session.history.push({ role: "assistant", content: reply });
  if (session.history.length > 20) session.history = session.history.slice(-20);

  const suggestedCards = results.slice(0, 5).map((r) => bookToCard(r.book));

  return NextResponse.json({ reply, session_id: sessionId, books: suggestedCards });
}
