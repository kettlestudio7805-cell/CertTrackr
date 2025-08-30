import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./shared/schema";

// Create a real DB client only when DATABASE_URL is set.
// Otherwise export a proxy that will error if accidentally used.
export const db = (() => {
  const url = process.env.DATABASE_URL;
  if (url && url.length > 0) {
    const client = postgres(url, { 
      ssl: {
        rejectUnauthorized: false // This allows self-signed certificates
      }
    });
    return drizzle(client, { schema });
  }

  return new Proxy({}, {
    get() {
      throw new Error("Database is not configured. Set DATABASE_URL in your .env to enable Postgres.");
    }
  }) as unknown as ReturnType<typeof drizzle>;
})();