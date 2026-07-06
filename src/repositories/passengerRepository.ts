import type { Pool } from "pg";
import { pool } from "../config/db";
import {
  CreatePassengerDTO,
  MembershipLevel,
  Passenger,
  PassengerWithPassword,
  UpdatePassengerDTO,
} from "../domain/passenger";

interface PassengerRow {
  id: string;
  name: string;
  password?: string;
  membership_level: MembershipLevel;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class PassengerRepository {
  constructor(private readonly db: Pool = pool) {}

  async create(dto: CreatePassengerDTO): Promise<Passenger> {
    const result = await this.db.query<PassengerRow>(
      `
        INSERT INTO passengers (name, password, membership_level)
        VALUES ($1, $2, $3)
        RETURNING id, name, membership_level, is_active, created_at, updated_at
      `,
      [dto.name, dto.password, dto.membershipLevel],
    );

    return this.toDomain(result.rows[0]);
  }

  async findAll(): Promise<Passenger[]> {
    const result = await this.db.query<PassengerRow>(
      `
        SELECT id, name, membership_level, is_active, created_at, updated_at
        FROM passengers
        ORDER BY created_at ASC
      `,
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<Passenger | null> {
    const result = await this.db.query<PassengerRow>(
      `
        SELECT id, name, membership_level, is_active, created_at, updated_at
        FROM passengers
        WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findByName(name: string): Promise<Passenger | null> {
    return this.findActiveByName(name);
  }

  async findActiveByName(name: string): Promise<Passenger | null> {
    const result = await this.db.query<PassengerRow>(
      `
        SELECT id, name, membership_level, is_active, created_at, updated_at
        FROM passengers
        WHERE LOWER(name) = LOWER($1)
          AND is_active = TRUE
      `,
      [name],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findByNameWithPassword(
    name: string,
  ): Promise<PassengerWithPassword | null> {
    const result = await this.db.query<PassengerRow>(
      `
        SELECT id, name, password, membership_level, is_active, created_at, updated_at
        FROM passengers
        WHERE LOWER(name) = LOWER($1)
          AND is_active = TRUE
      `,
      [name],
    );

    return result.rows[0] ? this.toPasswordDomain(result.rows[0]) : null;
  }

  async update(id: string, dto: UpdatePassengerDTO): Promise<Passenger | null> {
    const result = await this.db.query<PassengerRow>(
      `
        UPDATE passengers
        SET
          name = COALESCE($2, name),
          membership_level = COALESCE($3, membership_level),
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, membership_level, is_active, created_at, updated_at
      `,
      [id, dto.name ?? null, dto.membershipLevel ?? null],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async updateMembership(
    id: string,
    membershipLevel: MembershipLevel,
  ): Promise<Passenger | null> {
    return this.update(id, { membershipLevel });
  }

  async delete(id: string): Promise<boolean> {
    const passenger = await this.decommission(id);
    return passenger !== null;
  }

  async decommission(id: string): Promise<Passenger | null> {
    const result = await this.db.query<PassengerRow>(
      `
        UPDATE passengers
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, membership_level, is_active, created_at, updated_at
      `,
      [id],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await this.db.query(
      "DELETE FROM passengers WHERE id = $1",
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }

  private toDomain(row: PassengerRow): Passenger {
    return {
      id: row.id,
      name: row.name,
      membershipLevel: row.membership_level,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toPasswordDomain(row: PassengerRow): PassengerWithPassword {
    return {
      ...this.toDomain(row),
      password: row.password ?? "",
    };
  }
}
