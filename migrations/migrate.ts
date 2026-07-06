import bcrypt from "bcrypt";
import { pool } from "../src/config/db";

const migrate = async (): Promise<void> => {
  const client = await pool.connect();
  const defaultPassword = bcrypt.hashSync("password123", 10);

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
      CREATE TABLE IF NOT EXISTS crew_leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE crew_leads
      ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    `);

    await client.query(
      "UPDATE crew_leads SET password = $1 WHERE password IS NULL",
      [defaultPassword],
    );

    await client.query(`
      ALTER TABLE crew_leads
      ALTER COLUMN password SET NOT NULL;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS passengers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        membership_level membership_level NOT NULL DEFAULT 'SILVER',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE passengers
      ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    `);

    await client.query(`
      ALTER TABLE passengers
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
    `);

    await client.query(
      "UPDATE passengers SET password = $1 WHERE password IS NULL",
      [defaultPassword],
    );

    await client.query(`
      ALTER TABLE passengers
      ALTER COLUMN password SET NOT NULL;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        minimum_level membership_level NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE resources
      DROP COLUMN IF EXISTS type;
    `);

    await client.query(`
      DROP TYPE IF EXISTS resource_type;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        passenger_id UUID NOT NULL REFERENCES passengers(id),
        resource_id UUID NOT NULL REFERENCES resources(id),
        accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      DELETE FROM crew_leads
      WHERE LOWER(name) NOT IN ('ali', 'muthu', 'hock');
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_crew_lead_name
      ON crew_leads (LOWER(name));
    `);

    await client.query("DROP INDEX IF EXISTS unique_passenger_name;");

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_active_passenger_name
      ON passengers (LOWER(name))
      WHERE is_active = TRUE;
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_resource_name
      ON resources (LOWER(name));
    `);

    // Seed 3 crew leads — spec says exactly 3, hardcoded by design.
    await client.query(`
      INSERT INTO crew_leads (name, password)
      SELECT name, password
      FROM (
        VALUES
          ('Ali', $1),
          ('Muthu', $1),
          ('Hock', $1)
      ) AS seeded(name, password)
      WHERE NOT EXISTS (
        SELECT 1 FROM crew_leads WHERE LOWER(crew_leads.name) = LOWER(seeded.name)
      );
    `, [defaultPassword]);

    await client.query(`
      INSERT INTO resources (name, minimum_level)
      VALUES
        ('Food Station', 'SILVER'),
        ('Sleeping Pod', 'SILVER'),
        ('Basic Hygiene', 'SILVER'),
        ('Private Cabin', 'GOLD'),
        ('Advanced Medical Bay', 'GOLD'),
        ('Luxury O2 Pod', 'PLATINUM'),
        ('VIP Rec Deck', 'PLATINUM')
      ON CONFLICT DO NOTHING;
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
