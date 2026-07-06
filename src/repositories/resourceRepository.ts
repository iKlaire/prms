import type { Pool } from "pg";
import { pool } from "../config/db";
import type { MembershipLevel } from "../domain/passenger";
import {
  CreateResourceDTO,
  Resource,
  UpdateResourceDTO,
} from "../domain/resource";

interface ResourceRow {
  id: string;
  name: string;
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
        INSERT INTO resources (name, minimum_level)
        VALUES ($1, $2)
        RETURNING id, name, minimum_level, is_active, created_at, updated_at
      `,
      [dto.name, dto.minimumLevel],
    );

    return this.toDomain(result.rows[0]);
  }

  async findAll(): Promise<Resource[]> {
    const result = await this.db.query<ResourceRow>(
      `
        SELECT id, name, minimum_level, is_active, created_at, updated_at
        FROM resources
        ORDER BY created_at ASC
      `,
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<Resource | null> {
    const result = await this.db.query<ResourceRow>(
      `
        SELECT id, name, minimum_level, is_active, created_at, updated_at
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
        SELECT id, name, minimum_level, is_active, created_at, updated_at
        FROM resources
        WHERE is_active = TRUE
          AND minimum_level = ANY($1::membership_level[])
        ORDER BY created_at ASC
      `,
      [levels],
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  async findByName(name: string): Promise<Resource | null> {
    const result = await this.db.query<ResourceRow>(
      `
        SELECT id, name, minimum_level, is_active, created_at, updated_at
        FROM resources
        WHERE LOWER(name) = LOWER($1)
      `,
      [name],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async update(id: string, dto: UpdateResourceDTO): Promise<Resource | null> {
    const result = await this.db.query<ResourceRow>(
      `
        UPDATE resources
        SET
          name = COALESCE($2, name),
          minimum_level = COALESCE($3, minimum_level),
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, minimum_level, is_active, created_at, updated_at
      `,
      [id, dto.name ?? null, dto.minimumLevel ?? null],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async decommission(id: string): Promise<Resource | null> {
    const result = await this.db.query<ResourceRow>(
      `
        UPDATE resources
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, minimum_level, is_active, created_at, updated_at
      `,
      [id],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async reactivate(id: string): Promise<Resource | null> {
    const result = await this.db.query<ResourceRow>(
      `
        UPDATE resources
        SET is_active = TRUE, updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, minimum_level, is_active, created_at, updated_at
      `,
      [id],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  private toDomain(row: ResourceRow): Resource {
    return {
      id: row.id,
      name: row.name,
      minimumLevel: row.minimum_level,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
