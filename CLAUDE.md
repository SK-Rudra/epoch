# Epoch — private personal development tracker
Stack: Next.js (App Router) + TypeScript + Tailwind, Supabase (Postgres, Auth, RLS), Vercel.
Single user only. Email + password login restricted to ALLOWED_EMAIL. RLS on every table.
Rules:
- Work one step at a time; stop and wait after each step.
- Explain what you changed and why in simple words (I am learning).
- Never commit secrets; use .env.local, and keep .env.example updated.
- Mobile-first (400px), dark/light theme, zod validation, server actions.
- Write tests for progress % and streak logic.