export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type ProfileRow = {
  avatar_path: string | null;
  created_at: string;
  email: string;
  id: string;
  name: string;
  updated_at: string;
};

export type PlannerDocumentKey =
  | "day"
  | "week"
  | "month"
  | "year_goals"
  | "focus";

export type PlannerDocumentRow = {
  created_at: string;
  document_key: PlannerDocumentKey;
  payload: Json;
  updated_at: string;
  user_id: string;
};

export type FinanceRecordRow = {
  amount: number;
  checked: boolean;
  created_at: string;
  month_key: string | null;
  note: string;
  record_date: string;
  record_id: string;
  title: string;
  type: "income" | "expense";
  updated_at: string;
  user_id: string;
};

export type SavingsDebtRecordRow = {
  amount: number;
  checked: boolean;
  closed: boolean;
  created_at: string;
  month_key: string | null;
  record_date: string;
  record_id: string;
  title: string;
  type: "saving" | "debt";
  updated_at: string;
  user_id: string;
};

export type UserSettingsRow = {
  created_at: string;
  settings: Json;
  updated_at: string;
  user_id: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        ProfileRow,
        {
          avatar_path?: string | null;
          email: string;
          id: string;
          name?: string;
        },
        {
          avatar_path?: string | null;
          email?: string;
          name?: string;
        }
      >;
      planner_documents: Table<
        PlannerDocumentRow,
        {
          document_key: PlannerDocumentKey;
          payload: Json;
          user_id: string;
        },
        { payload?: Json }
      >;
      finance_records: Table<
        FinanceRecordRow,
        Omit<FinanceRecordRow, "created_at" | "updated_at">,
        Partial<Omit<FinanceRecordRow, "created_at" | "updated_at" | "user_id">>
      >;
      savings_debt_records: Table<
        SavingsDebtRecordRow,
        Omit<SavingsDebtRecordRow, "created_at" | "updated_at">,
        Partial<
          Omit<SavingsDebtRecordRow, "created_at" | "updated_at" | "user_id">
        >
      >;
      user_settings: Table<
        UserSettingsRow,
        { settings: Json; user_id: string },
        { settings?: Json }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
