import EmptyState from "../../components/ui/EmptyState";
import Field from "../../components/ui/Field";
import PanelRow from "../../components/ui/PanelRow";
import SelectField from "../../components/ui/SelectField";
import StatusBadge from "../../components/ui/StatusBadge";
import TextButton from "../../components/ui/TextButton";
import { MembershipLevel } from "../../types";
import type { ResourcesTabProps } from "./types";

export default function ResourcesTab({
  resources,
  resName,
  resLevel,
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
        />
        <SelectField
          label="Min Level"
          value={resLevel}
          options={Object.values(MembershipLevel)}
          onChange={onLevelChange}
        />
        <button
          onClick={onProvisionResource}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Provision
        </button>
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
                onChange={(level) =>
                  onUpdateResourceLevel(
                    resource.id,
                    level,
                  )
                }
              />
              <StatusBadge active={resource.isActive} />
              {resource.isActive ? (
                <TextButton
                  onClick={() => onDecommissionResource(resource.id)}
                  tone="danger"
                >
                  Decommission
                </TextButton>
              ) : (
                <TextButton
                  onClick={() => onReactivateResource(resource.id)}
                  tone="success"
                >
                  Reactivate
                </TextButton>
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
