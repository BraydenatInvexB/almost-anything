import { getCurrentStaff, listActivity } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader, Panel } from "@/components/admin/ui";

export default async function AdminActivityPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "activity.view")) return <AccessDenied feature="the activity log" />;

  const activity = await listActivity();

  return (
    <>
      <PageHeader
        title="Activity Log"
        subtitle="A full audit trail of every action taken across the admin console."
      />

      <Panel>
        <ol className="flex flex-col">
          {activity.map((a, i) => (
            <li
              key={a.id}
              className="flex items-start gap-4 px-5 py-4"
              style={{ borderTop: i === 0 ? undefined : "1px solid #f5f5f5" }}
            >
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                {(a.staff_name ?? "?").charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-neutral-800">
                  <span className="font-semibold">{a.staff_name ?? "System"}</span> {a.action}
                  {a.entity_id && (
                    <span className="text-neutral-400"> · {a.entity_type} {a.entity_id}</span>
                  )}
                </p>
                <p className="text-xs text-neutral-400">
                  {new Date(a.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}
