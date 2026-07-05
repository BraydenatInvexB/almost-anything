export type ExpenseCategory =
  | "procurement"
  | "shipping"
  | "marketing"
  | "payroll"
  | "operations"
  | "refunds"
  | "other";

export interface Expense {
  id: string;
  label: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  vendor?: string;
  orderId?: string;
  recordedBy: string;
  recordedAt: string;
  notes?: string;
}
