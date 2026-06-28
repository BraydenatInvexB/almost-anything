import type { Permission } from "@/config/rbac";
import type { StaffMember } from "@/types/database";
import type { StaffProfile } from "@/types/staff-access";

function parsePermissionList(value: unknown): Permission[] {
  if (!Array.isArray(value)) return [];
  return value.filter((p): p is Permission => typeof p === "string");
}

/** Normalise a DB or demo staff row into a StaffProfile with permission arrays. */
export function toStaffProfile(row: StaffMember & Record<string, unknown>): StaffProfile {
  return {
    ...row,
    extra_permissions: parsePermissionList(row.extra_permissions),
    denied_permissions: parsePermissionList(row.denied_permissions),
  };
}
