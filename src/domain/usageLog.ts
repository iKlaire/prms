export interface UsageLog {
  id: string;
  passengerId: string;
  resourceId: string;
  accessedAt: Date;
}

export interface UsageLogWithDetails extends UsageLog {
  passengerName: string;
  resourceName: string;
}

export interface AggregatedUsage {
  membershipLevel: string;
  totalUsage: number;
  uniquePassengers: number;
}

export interface ResourceUsageCount {
  resourceId: string;
  resourceName: string;
  usageCount: number;
}
