import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Field from "../../components/ui/Field";
import PanelRow from "../../components/ui/PanelRow";
import SelectField from "../../components/ui/SelectField";
import StatusBadge from "../../components/ui/StatusBadge";
import { MembershipLevel } from "../../types";
import type { PassengersTabProps } from "./types";

export default function PassengersTab({
  passengers,
  newName,
  newPassword,
  newLevel,
  isCreatingPassenger,
  busyPassengerId,
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
          disabled={isCreatingPassenger}
        />
        <Field
          label="Password"
          value={newPassword}
          onChange={onPasswordChange}
          placeholder="Initial password"
          type="password"
          disabled={isCreatingPassenger}
        />
        <SelectField
          label="Level"
          value={newLevel}
          options={Object.values(MembershipLevel)}
          onChange={onLevelChange}
          disabled={isCreatingPassenger}
        />
        <Button
          onClick={onCreatePassenger}
          disabled={isCreatingPassenger || !newName.trim() || !newPassword}
        >
          {isCreatingPassenger ? "Adding..." : "Add Passenger"}
        </Button>
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
                    disabled={busyPassengerId === passenger.id}
                    onChange={(level) =>
                      onUpdateMembership(
                        passenger.id,
                        level,
                      )
                    }
                  />
                  <Button
                    onClick={() => onDecommissionPassenger(passenger.id)}
                    variant="dangerText"
                    size="xs"
                    disabled={busyPassengerId === passenger.id}
                  >
                    Decommission
                  </Button>
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
