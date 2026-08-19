Rwanda Realestate Frontend (scaffold)

This is a minimal Next.js 14 (App Router) + TypeScript + Tailwind CSS scaffold.

To finish installing dependencies locally (PowerShell may block `npx`/`npm`), run:

```powershell
cd c:\wamp64\www\rwanda-realestate-frontend
npm install
npx tailwindcss init -p
npm run dev
```

Environment:
- Copy `.env.local.example` (or create `.env.local`) and set `NEXT_PUBLIC_API_URL` to your local backend URL.
- Local development default: `http://127.0.0.1:8000/api`
- For production, set the same variable in the deployment environment and keep a checked-in example file at `.env.production.example` with the real production URL pattern.
- The fallback in code is intentional for local development only; production should always override it via environment configuration.

Next steps (I can do these if you confirm):
- Implement `lib/api.ts` client helpers further
- Add `/login` and `/register` pages
- Add `/properties` listing and `/properties/[id]` detail pages
- Implement `/dashboard` with role-based views

