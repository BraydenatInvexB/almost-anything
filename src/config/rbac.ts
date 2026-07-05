export type { Permission } from "@/config/rbac-permissions";
export { ALL_PERMISSIONS } from "@/config/rbac-permissions";
export { ROLE_PERMISSIONS, ROLE_META } from "@/config/rbac-roles";
export {
  can,
  canAny,
  getEffectivePermissions,
  getRolePermissions,
  staffCan,
  staffCanAny,
} from "@/config/rbac-helpers";
export { PERMISSION_MODULES } from "@/config/rbac-modules";
export type { AdminNavItem } from "@/config/rbac-nav";
export { ADMIN_NAV } from "@/config/rbac-nav";
