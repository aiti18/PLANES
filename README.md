# Planes

## Vercel frontend

Use `frontend` as the Vercel Root Directory.

Required environment variable:

```env
NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
```

The frontend folder does not include Prisma, NextAuth server routes, or the
PostgreSQL backend. API calls are sent to the Render backend URL.
