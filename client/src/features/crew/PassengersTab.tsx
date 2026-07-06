import EmptyState from "../../components/ui/EmptyState";
import Field from "../../components/ui/Field";
import PanelRow from "../../components/ui/PanelRow";
import SelectField from "../../components/ui/SelectField";
import StatusBadge from "../../components/ui/StatusBadge";
import TextButton from "../../components/ui/TextButton";
import { MembershipLevel } from "../../types";
import type { PassengersTabProps } from "./types";

export default function PassengersTab({
  passengers,
  newName,
  newPassword,
  newLevel,
  onNameChange,
  onPasswordChange,
  onLevelChange,
  onCreatePassenger,
  onUpdateMembership,
  onDecommissionPassenger,
}: PassengersTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-3 items-end">
        <Field
          label="Name"
          value={newName}
          onChange={onNameChange}
          placeholder="Passenger name"
          className="flex-1"
        />
        <Field
          label="Password"
          value={newPassword}
          onChange={onPasswordChange}
          placeholder="Initial password"
          type="password"
        />
        <SelectField
          label="Level"
          value={newLevel}
          options={Object.values(MembershipLevel)}
          onChange={onLevelChange}
        />
        <button
          onClick={onCreatePassenger}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Add Passenger
        </button>
      </div>

      <div className="space-y-2">
        {passengers.map((passenger) => (
          <PanelRow key={passenger.id}>
            <div>
              <p className="text-sm font-medium">{passenger.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{passenger.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge active={passenger.isActive} />
              {passenger.isActive && (
                <>
                  <SelectField
                    value={passenger.membershipLevel}
                    options={Object.values(MembershipLevel)}
                    size="sm"
                    onChange={(level) =>
                      onUpdateMembership(
                        passenger.id,
                        level,
                      )
                    }
                  />
                  <TextButton
                    onClick={() => onDecommissionPassenger(passenger.id)}
                    tone="danger"
                  >
                    Decommission
                  </TextButton>
                </>
              )}
            </div>
          </PanelRow>
        ))}
        {passengers.length === 0 && <EmptyState>No passengers yet</EmptyState>}
      </div>
    </div>
  );
}
