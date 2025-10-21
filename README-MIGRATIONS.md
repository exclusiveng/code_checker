Render deployment recommendation

When deploying to Render (or any environment), run migrations before starting the server so database schema changes (including backfills) are applied.

Recommended Render `start` command (in Render dashboard or render.yaml):

# Build command
# npm run build

# Start with migrations then run the server
npm run start:migrate

Notes:
- `npm run migrate` runs TypeORM migrations (implemented in `src/migrations`) using ts-node.
- `start:migrate` will run migrations then start the built server. If you prefer to run server directly from source during deploy, change to `npm run migrate && npm run dev` (not recommended for production).
- Ensure `DATABASE_URL` is set in Render env settings.
- For zero-downtime deployments consider running migrations in a separate deploy hook step.
