import type { Permission } from "@/config/rbac";
import type { StaffMember } from "@/types/database";

/** Staff member plus optional permission overrides beyond the base role. */
export type StaffProfile = Omit<StaffMember, "extra_permissions" | "denied_permissions"> & {
  extra_permissions?: Permission[];
  denied_permissions?: Permission[];
};
