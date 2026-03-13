# BookBot — Airport Book Recommendation Chat

A Next.js chat UI powered by OpenAI. Customers describe what they want to read and BookBot recommends books, grouped by airport shop location with directions.

## Features
- RAG pipeline: semantic search over 1,000 books using OpenAI embeddings
- GPT-4o-mini chat with sales-oriented personality
- Book cards with cover images, ratings, and prices
- Currency switcher: £ GBP / € EUR / $ USD
- Persistent cart panel grouped by shop (shop1–shop4) with airport directions

## Run locally

1. Copy the example env file and add your key:
   ```bash
   cp .env.example .env.local
   # edit .env.local and set OPENAI_API_KEY=sk-...
   ```

2. Install dependencies and start:
   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push this repo to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add `OPENAI_API_KEY` in Vercel → Settings → Environment Variables
4. Deploy
