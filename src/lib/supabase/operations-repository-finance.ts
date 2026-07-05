import type { SupplierPayable } from "@/lib/admin/finance-types";
import type { Expense } from "@/lib/admin/operations-types";
import { mapExpenseRow, mapPayableRow } from "@/lib/supabase/operations-mappers";
import { asRow, asRows, tbl } from "@/lib/supabase/operations-repository-shared";

export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await tbl("expenses")
    .select("*")
    .order("recorded_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapExpenseRow(r));
}

export async function createExpense(
  input: Omit<Expense, "id" | "recordedAt">,
): Promise<Expense> {
  const { data, error } = await tbl("expenses")
    .insert({
      label: input.label,
      category: input.category,
      amount: input.amount,
      currency: input.currency,
      vendor: input.vendor ?? null,
      order_id: input.orderId ?? null,
      recorded_by: input.recordedBy,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapExpenseRow(asRow(data));
}

export async function listPayables(): Promise<SupplierPayable[]> {
  const { data, error } = await tbl("supplier_payables")
    .select("*")
    .order("due_date", { ascending: true });
  if (error) throw error;
  return asRows(data).map((r) => mapPayableRow(r));
}

export async function createPayable(
  input: Omit<SupplierPayable, "id" | "createdAt">,
): Promise<SupplierPayable> {
  const { data, error } = await tbl("supplier_payables")
    .insert({
      invoice_number: input.invoiceNumber,
      vendor: input.vendor,
      category: input.category,
      amount: input.amount,
      currency: input.currency,
      due_date: input.dueDate,
      status: input.status,
      order_id: input.orderId ?? null,
      order_number: input.orderNumber ?? null,
      procurement_id: input.procurementId ?? null,
      notes: input.notes ?? null,
      paid_at: input.paidAt ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapPayableRow(asRow(data));
}

export async function updatePayable(
  id: string,
  patch: Partial<SupplierPayable>,
): Promise<SupplierPayable | null> {
  const update: Record<string, unknown> = {};
  if (patch.invoiceNumber !== undefined) update.invoice_number = patch.invoiceNumber;
  if (patch.vendor !== undefined) update.vendor = patch.vendor;
  if (patch.category !== undefined) update.category = patch.category;
  if (patch.amount !== undefined) update.amount = patch.amount;
  if (patch.currency !== undefined) update.currency = patch.currency;
  if (patch.dueDate !== undefined) update.due_date = patch.dueDate;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.orderId !== undefined) update.order_id = patch.orderId;
  if (patch.orderNumber !== undefined) update.order_number = patch.orderNumber;
  if (patch.procurementId !== undefined) update.procurement_id = patch.procurementId;
  if (patch.notes !== undefined) update.notes = patch.notes;
  if (patch.paidAt !== undefined) update.paid_at = patch.paidAt;

  const { data, error } = await tbl("supplier_payables")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapPayableRow(asRow(data)) : null;
}
