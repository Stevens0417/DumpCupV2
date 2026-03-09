# Deployment Strategy

## Branching

main = production
dev = development

---

## Deployment Flow

1. Merge to main.
2. Vercel auto-deploys.
3. Verify environment variables.
4. Verify Supabase connection.

---

## Environment Variables

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

Never expose service role key to client.

---

## Production Safety

- Never run destructive migrations without review.
- Backup before major schema change.
- Update Change Log after release.