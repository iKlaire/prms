import type { Pool } from "pg";
import { pool } from "../config/db";
import type { MembershipLevel } from "../domain/passenger";
import {
  CreateResourceDTO,
  Resource,
  ResourceType,
} from "../domain/resource";

interface ResourceRow {
  id: string;
  name: string;
  type: ResourceType;
  minimum_level: MembershipLevel;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class ResourceRepository {
  constructor(private readonly db: Pool = pool) {}

  async create(dto: CreateResourceDTO): Promise<Resource> {
    const result = await this.db.query<ResourceRow>(
      `
        INSERT INTO resources (name, type, minimum_level)
        VALUES ($1, $2, $3)
        RETURNING id, name, type, minimum_level, is_active, created_at, updated_at
      `,
      [dto.name, dto.type, dto.minimumLevel],
    );

    return this.toDomain(result.rows[0]);
  }

  async findAll(): Promise<Resource[]> {
    const result = await this.db.query<ResourceRow>(
      `
        SELECT id, name, type, minimum_level, is_active, created_at, updated_at
        FROM resources
        ORDER BY created_at ASC
      `,
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<Resource | null> {
    const result = await this.db.query<ResourceRow>(
      `
        SELECT id, name, type, minimum_level, is_active, created_at, updated_at
        FROM resources
        WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findActiveByMinimumLevels(
    levels: MembershipLevel[],
  ): Promise<Resource[]> {
    const result = await this.db.query<ResourceRow>(
      `
        SELECT id, name, type, minimum_level, is_active, created_at, updated_at
        FROM resources
        WHERE is_active = TRUE
          AND minimum_level = ANY($1::membership_level[])
        ORDER BY created_at ASC
      `,
      [levels],
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  async decommission(id: string): Promise<Resource | null> {
    const result = await this.db.query<ResourceRow>(
      `
        UPDATE resources
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, type, minimum_level, is_active, created_at, updated_at
      `,
      [id],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  private toDomain(row: ResourceRow): Resource {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      minimumLevel: row.minimum_level,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
