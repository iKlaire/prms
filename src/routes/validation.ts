import type {
  CreatePassengerDTO,
  UpdatePassengerDTO,
} from "../domain/passenger";
import { MembershipLevel } from "../domain/passenger";
import type { CreateResourceDTO, UpdateResourceDTO } from "../domain/resource";
import { ValidationError } from "../errors";

export interface LoginDTO {
  name: string;
  password: string;
}

const requireRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidationError("Request body must be a JSON object");
  }

  return value as Record<string, unknown>;
};

const getOptionalString = (
  body: Record<string, unknown>,
  field: string,
): string | undefined => {
  const value = body[field];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ValidationError(`Invalid ${field}`);
  }

  return value;
};

const getRequiredString = (
  body: Record<string, unknown>,
  field: string,
  message: string,
): string => {
  const value = getOptionalString(body, field);
  if (!value) {
    throw new ValidationError(message);
  }

  return value;
};

const parseMembershipLevel = (
  value: unknown,
  field: string,
): MembershipLevel => {
  if (
    typeof value !== "string" ||
    !Object.values(MembershipLevel).includes(value as MembershipLevel)
  ) {
    throw new ValidationError(`Invalid ${field}`);
  }

  return value as MembershipLevel;
};

export const validateLoginBody = (body: unknown): LoginDTO => {
  const record = requireRecord(body);

  return {
    name: getOptionalString(record, "name") ?? "",
    password: getOptionalString(record, "password") ?? "",
  };
};

export const validateCreatePassengerBody = (
  body: unknown,
): CreatePassengerDTO => {
  const record = requireRecord(body);
  const requiredMessage = "Name, password and membershipLevel are required";

  return {
    name: getRequiredString(record, "name", requiredMessage),
    password: getRequiredString(record, "password", requiredMessage),
    membershipLevel: parseMembershipLevel(
      record.membershipLevel,
      "membershipLevel",
    ),
  };
};

export const validateUpdatePassengerBody = (
  body: unknown,
): UpdatePassengerDTO => {
  const record = requireRecord(body);
  const name = getOptionalString(record, "name");
  const membershipLevel =
    record.membershipLevel === undefined
      ? undefined
      : parseMembershipLevel(record.membershipLevel, "membershipLevel");

  if (name === undefined && membershipLevel === undefined) {
    throw new ValidationError("At least one field required");
  }

  return { name, membershipLevel };
};

export const validateCreateResourceBody = (body: unknown): CreateResourceDTO => {
  const record = requireRecord(body);
  const requiredMessage = "name and minimumLevel are required";

  return {
    name: getRequiredString(record, "name", requiredMessage),
    minimumLevel: parseMembershipLevel(record.minimumLevel, "minimumLevel"),
  };
};

export const validateUpdateResourceBody = (body: unknown): UpdateResourceDTO => {
  const record = requireRecord(body);
  const name = getOptionalString(record, "name");
  const minimumLevel =
    record.minimumLevel === undefined
      ? undefined
      : parseMembershipLevel(record.minimumLevel, "minimumLevel");

  if (name === undefined && minimumLevel === undefined) {
    throw new ValidationError("At least one field required");
  }

  return { name, minimumLevel };
};
