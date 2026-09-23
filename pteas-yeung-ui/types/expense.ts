// types/expense.ts

export interface Expense {
  id: number;
  owner_id: number;
  property_id?: number | null;
  category?: string | null;
  description?: string | null;
  amount: string | number;
  date: string;
  property?: import('./property').Property;
  created_at?: string;
  updated_at?: string;
}

export interface CreateExpenseRequest {
  property_id?: number;
  category?: string;
  description?: string;
  amount: number;
  date: string;
}

export type UpdateExpenseRequest = Partial<CreateExpenseRequest>;

export interface ExpenseListResponse {
  data?: Expense[];
  success?: boolean;
}
