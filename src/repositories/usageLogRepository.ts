import type { Pool } from "pg";
import { pool } from "../config/db";
import {
  AggregatedUsage,
  ResourceUsageCount,
  UsageLog,
  UsageLogWithDetails,
} from "../domain/usageLog";

interface UsageLogRow {
  id: string;
  passenger_id: string;
  resource_id: string;
  accessed_at: Date;
}

interface UsageLogDetailsRow extends UsageLogRow {
  passenger_name: string;
  resource_name: string;
}

interface AggregatedUsageRow {
  membership_level: string;
  total_usage: string;
  unique_passengers: string;
}

interface ResourceUsageCountRow {
  resource_id: string;
  resource_name: string;
  usage_count: string;
}

export class UsageLogRepository {
  constructor(private readonly db: Pool = pool) {}

  async create(passengerId: string, resourceId: string): Promise<UsageLog> {
    const result = await this.db.query<UsageLogRow>(
      `
        INSERT INTO usage_logs (passenger_id, resource_id)
        VALUES ($1, $2)
        RETURNING id, passenger_id, resource_id, accessed_at
      `,
      [passengerId, resourceId],
    );

    return this.toDomain(result.rows[0]);
  }

  async findAllWithDetails(): Promise<UsageLogWithDetails[]> {
    const result = await this.db.query<UsageLogDetailsRow>(
      `
        SELECT
          ul.id,
          ul.passenger_id,
          ul.resource_id,
          ul.accessed_at,
          p.name AS passenger_name,
          r.name AS resource_name
        FROM usage_logs ul
        JOIN passengers p ON p.id = ul.passenger_id
        JOIN resources r ON r.id = ul.resource_id
        ORDER BY ul.accessed_at DESC
      `,
    );

    return result.rows.map((row) => this.toDetailsDomain(row));
  }

  async findByPassengerIdWithDetails(
    passengerId: string,
  ): Promise<UsageLogWithDetails[]> {
    const result = await this.db.query<UsageLogDetailsRow>(
      `
        SELECT
          ul.id,
          ul.passenger_id,
          ul.resource_id,
          ul.accessed_at,
          p.name AS passenger_name,
          r.name AS resource_name
        FROM usage_logs ul
        JOIN passengers p ON p.id = ul.passenger_id
        JOIN resources r ON r.id = ul.resource_id
        WHERE ul.passenger_id = $1
        ORDER BY ul.accessed_at DESC
      `,
      [passengerId],
    );

    return result.rows.map((row) => this.toDetailsDomain(row));
  }

  async aggregateByLevel(): Promise<AggregatedUsage[]> {
    const result = await this.db.query<AggregatedUsageRow>(
      `
        SELECT
          p.membership_level,
          COUNT(*) AS total_usage,
          COUNT(DISTINCT p.id) AS unique_passengers
        FROM usage_logs ul
        JOIN passengers p ON p.id = ul.passenger_id
        GROUP BY p.membership_level
        ORDER BY p.membership_level ASC
      `,
    );

    return result.rows.map((row) => ({
      membershipLevel: row.membership_level,
      totalUsage: Number(row.total_usage),
      uniquePassengers: Number(row.unique_passengers),
    }));
  }

  async topResources(): Promise<ResourceUsageCount[]> {
    const result = await this.db.query<ResourceUsageCountRow>(
      `
        SELECT
          r.id AS resource_id,
          r.name AS resource_name,
          COUNT(*) AS usage_count
        FROM usage_logs ul
        JOIN resources r ON r.id = ul.resource_id
        GROUP BY r.id, r.name
        ORDER BY usage_count DESC, r.name ASC
      `,
    );

    return result.rows.map((row) => ({
      resourceId: row.resource_id,
      resourceName: row.resource_name,
      usageCount: Number(row.usage_count),
    }));
  }

  private toDomain(row: UsageLogRow): UsageLog {
    return {
      id: row.id,
      passengerId: row.passenger_id,
      resourceId: row.resource_id,
      accessedAt: row.accessed_at,
    };
  }

  private toDetailsDomain(row: UsageLogDetailsRow): UsageLogWithDetails {
    return {
      ...this.toDomain(row),
      passengerName: row.passenger_name,
      resourceName: row.resource_name,
    };
  }
}
