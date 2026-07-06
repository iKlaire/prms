import EmptyState from "../../components/ui/EmptyState";
import PanelRow from "../../components/ui/PanelRow";
import type { ReportsTabProps } from "./types";

export default function ReportsTab({
  usageLogs,
  byLevel,
  topResources,
}: ReportsTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Usage by Membership Level
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {byLevel.map((level) => (
            <div
              key={level.membershipLevel}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4"
            >
              <p className="text-xs text-gray-500">{level.membershipLevel}</p>
              <p className="text-2xl font-bold mt-1">{level.totalUsage}</p>
              <p className="text-xs text-gray-500 mt-1">
                {level.uniquePassengers} passengers
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Most Used Resources
        </h2>
        <div className="space-y-2">
          {topResources.map((resource, index) => (
            <PanelRow key={resource.resourceId}>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-4">{index + 1}</span>
                <p className="text-sm">{resource.resourceName}</p>
              </div>
              <span className="text-sm font-semibold text-indigo-400">
                {resource.usageCount} uses
              </span>
            </PanelRow>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          All Usage Logs
        </h2>
        <div className="space-y-2">
          {usageLogs.map((log) => (
            <PanelRow key={log.id}>
              <div>
                <p className="text-sm">
                  {log.passengerName} - {log.resourceName}
                </p>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(log.accessedAt).toLocaleString()}
              </span>
            </PanelRow>
          ))}
          {usageLogs.length === 0 && (
            <EmptyState>No usage logged yet</EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}
