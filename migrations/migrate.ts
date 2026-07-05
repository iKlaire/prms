import { pool } from "../src/config/db";

const migrate = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_level') THEN
          CREATE TYPE membership_level AS ENUM ('SILVER', 'GOLD', 'PLATINUM');
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_type') THEN
          CREATE TYPE resource_type AS ENUM (
            'FOOD_STATION',
            'SLEEPING_POD',
            'BASIC_HYGIENE',
            'PRIVATE_CABIN',
            'ADVANCED_MEDICAL_BAY',
            'LUXURY_O2_POD',
            'VIP_REC_DECK'
          );
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS crew_leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS passengers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        membership_level membership_level NOT NULL DEFAULT 'SILVER',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type resource_type NOT NULL,
        minimum_level membership_level NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        passenger_id UUID NOT NULL REFERENCES passengers(id),
        resource_id UUID NOT NULL REFERENCES resources(id),
        accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Seed 3 crew leads — spec says exactly 3, hardcoded by design
    await client.query(`
      INSERT INTO crew_leads (name)
      SELECT name
      FROM (
        VALUES
          ('Commander Reyes'),
          ('Commander Singh'),
          ('Commander Park')
      ) AS seeded(name)
      WHERE NOT EXISTS (
        SELECT 1 FROM crew_leads WHERE crew_leads.name = seeded.name
      );
    `);

    await client.query("COMMIT");
    console.log("Migration complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
