import type { StaffRole } from "@/types/database";
import type { StaffProfile } from "@/types/staff-access";
import type { Permission } from "@/config/rbac-permissions";
import { ROLE_PERMISSIONS } from "@/config/rbac-roles";

export function getRolePermissions(role: StaffRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** Effective permissions = role defaults + extras − denied. */
export function getEffectivePermissions(staff: StaffProfile): Permission[] {
  const set = new Set(getRolePermissions(staff.role));
  for (const p of staff.extra_permissions ?? []) set.add(p);
  for (const p of staff.denied_permissions ?? []) set.delete(p);
  return Array.from(set);
}

export function staffCan(
  staff: StaffProfile | null | undefined,
  permission: Permission,
): boolean {
  if (!staff) return false;
  if (staff.denied_permissions?.includes(permission)) return false;
  if (staff.extra_permissions?.includes(permission)) return true;
  return ROLE_PERMISSIONS[staff.role]?.includes(permission) ?? false;
}

export function can(role: StaffRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAny(role: StaffRole | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

export function staffCanAny(staff: StaffProfile | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => staffCan(staff, p));
}
