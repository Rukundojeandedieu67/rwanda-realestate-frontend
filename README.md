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
- Set `NEXT_PUBLIC_API_URL` to your backend API (default: http://127.0.0.1:8000/api)

Next steps (I can do these if you confirm):
- Implement `lib/api.ts` client helpers further
- Add `/login` and `/register` pages
- Add `/properties` listing and `/properties/[id]` detail pages
- Implement `/dashboard` with role-based views

