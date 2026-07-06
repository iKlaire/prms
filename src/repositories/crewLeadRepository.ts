import type { Pool } from "pg";
import { pool } from "../config/db";
import type { CrewLead, CrewLeadWithPassword } from "../domain/crewLead";

interface CrewLeadRow {
  id: string;
  name: string;
  password?: string;
  created_at: Date;
}

export class CrewLeadRepository {
  constructor(private readonly db: Pool = pool) {}

  async findById(id: string): Promise<CrewLead | null> {
    const result = await this.db.query<CrewLeadRow>(
      "SELECT id, name, created_at FROM crew_leads WHERE id = $1",
      [id],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findByName(name: string): Promise<CrewLead | null> {
    const result = await this.db.query<CrewLeadRow>(
      "SELECT id, name, created_at FROM crew_leads WHERE LOWER(name) = LOWER($1)",
      [name],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findByNameWithPassword(
    name: string,
  ): Promise<CrewLeadWithPassword | null> {
    const result = await this.db.query<CrewLeadRow>(
      `
        SELECT id, name, password, created_at
        FROM crew_leads
        WHERE LOWER(name) = LOWER($1)
      `,
      [name],
    );

    return result.rows[0] ? this.toPasswordDomain(result.rows[0]) : null;
  }

  private toDomain(row: CrewLeadRow): CrewLead {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    };
  }

  private toPasswordDomain(row: CrewLeadRow): CrewLeadWithPassword {
    return {
      ...this.toDomain(row),
      password: row.password ?? "",
    };
  }
}
