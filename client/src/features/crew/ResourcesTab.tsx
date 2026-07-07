import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Field from "../../components/ui/Field";
import PanelRow from "../../components/ui/PanelRow";
import SelectField from "../../components/ui/SelectField";
import StatusBadge from "../../components/ui/StatusBadge";
import { MembershipLevel } from "../../types";
import type { ResourcesTabProps } from "./types";

export default function ResourcesTab({
  resources,
  resName,
  resLevel,
  isProvisioningResource,
  busyResourceId,
  onNameChange,
  onLevelChange,
  onProvisionResource,
  onUpdateResourceLevel,
  onDecommissionResource,
  onReactivateResource,
}: ResourcesTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-3 items-end flex-wrap">
        <Field
          label="Name"
          value={resName}
          onChange={onNameChange}
          placeholder="Resource name"
          className="flex-1 min-w-40"
          disabled={isProvisioningResource}
        />
        <SelectField
          label="Min Level"
          value={resLevel}
          options={Object.values(MembershipLevel)}
          onChange={onLevelChange}
          disabled={isProvisioningResource}
        />
        <Button
          onClick={onProvisionResource}
          disabled={isProvisioningResource || !resName.trim()}
        >
          {isProvisioningResource ? "Provisioning..." : "Provision"}
        </Button>
      </div>

      <div className="space-y-2">
        {resources.map((resource) => (
          <PanelRow key={resource.id}>
            <div>
              <p className="text-sm font-medium">{resource.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Min: {resource.minimumLevel}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SelectField
                value={resource.minimumLevel}
                options={Object.values(MembershipLevel)}
                size="sm"
                disabled={busyResourceId === resource.id}
                onChange={(level) =>
                  onUpdateResourceLevel(
                    resource.id,
                    level,
                  )
                }
              />
              <StatusBadge active={resource.isActive} />
              {resource.isActive ? (
                <Button
                  onClick={() => onDecommissionResource(resource.id)}
                  variant="dangerText"
                  size="xs"
                  disabled={busyResourceId === resource.id}
                >
                  Decommission
                </Button>
              ) : (
                <Button
                  onClick={() => onReactivateResource(resource.id)}
                  variant="successText"
                  size="xs"
                  disabled={busyResourceId === resource.id}
                >
                  Reactivate
                </Button>
              )}
            </div>
          </PanelRow>
        ))}
        {resources.length === 0 && (
          <EmptyState>No resources provisioned</EmptyState>
        )}
      </div>
    </div>
  );
}
