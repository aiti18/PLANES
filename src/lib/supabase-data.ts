import { requireSupabase } from "@/lib/supabase";
import type {
  FinanceRecordRow,
  Json,
  PlannerDocumentKey,
  SavingsDebtRecordRow,
} from "@/types/database";

export type FinanceRecordInput = Omit<
  FinanceRecordRow,
  "created_at" | "updated_at" | "user_id"
>;

export type SavingsDebtRecordInput = Omit<
  SavingsDebtRecordRow,
  "created_at" | "updated_at" | "user_id"
>;

async function getCurrentUserId() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error("AUTH_REQUIRED");
  }

  return data.user.id;
}

export async function loadPlannerDocument<T>(documentKey: PlannerDocumentKey) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { data, error } = await client
    .from("planner_documents")
    .select("payload")
    .eq("user_id", userId)
    .eq("document_key", documentKey)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.payload as T | undefined) ?? null;
}

export async function savePlannerDocument(
  documentKey: PlannerDocumentKey,
  payload: unknown,
) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { error } = await client.from("planner_documents").upsert(
    { document_key: documentKey, payload: payload as Json, user_id: userId },
    { onConflict: "user_id,document_key" },
  );

  if (error) {
    throw error;
  }
}

export async function loadUserSettings<T>() {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { data, error } = await client
    .from("user_settings")
    .select("settings")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.settings as T | undefined) ?? null;
}

export async function saveUserSettings(settings: Json) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { error } = await client
    .from("user_settings")
    .upsert({ settings, user_id: userId }, { onConflict: "user_id" });

  if (error) {
    throw error;
  }
}

export async function loadFinanceRecords() {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { data, error } = await client
    .from("finance_records")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertFinanceRecord(record: FinanceRecordInput) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { error } = await client.from("finance_records").upsert(
    { ...record, user_id: userId },
    { onConflict: "user_id,record_id" },
  );

  if (error) {
    throw error;
  }
}

export async function deleteFinanceRecord(recordId: string) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { error } = await client
    .from("finance_records")
    .delete()
    .eq("user_id", userId)
    .eq("record_id", recordId);

  if (error) {
    throw error;
  }
}

export async function replaceFinanceRecords(records: FinanceRecordInput[]) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { data: existing, error: loadError } = await client
    .from("finance_records")
    .select("record_id")
    .eq("user_id", userId);

  if (loadError) throw loadError;

  if (records.length) {
    const { error } = await client.from("finance_records").upsert(
      records.map((record) => ({ ...record, user_id: userId })),
      { onConflict: "user_id,record_id" },
    );
    if (error) throw error;
  }

  const nextIds = new Set(records.map((record) => record.record_id));
  const removedIds = (existing ?? [])
    .map((record) => record.record_id)
    .filter((recordId) => !nextIds.has(recordId));

  if (removedIds.length) {
    const { error } = await client
      .from("finance_records")
      .delete()
      .eq("user_id", userId)
      .in("record_id", removedIds);
    if (error) throw error;
  }
}

export async function loadSavingsDebtRecords() {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { data, error } = await client
    .from("savings_debt_records")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertSavingsDebtRecord(record: SavingsDebtRecordInput) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { error } = await client.from("savings_debt_records").upsert(
    { ...record, user_id: userId },
    { onConflict: "user_id,record_id" },
  );

  if (error) {
    throw error;
  }
}

export async function deleteSavingsDebtRecord(recordId: string) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { error } = await client
    .from("savings_debt_records")
    .delete()
    .eq("user_id", userId)
    .eq("record_id", recordId);

  if (error) {
    throw error;
  }
}

export async function replaceSavingsDebtRecords(
  records: SavingsDebtRecordInput[],
) {
  const client = requireSupabase();
  const userId = await getCurrentUserId();
  const { data: existing, error: loadError } = await client
    .from("savings_debt_records")
    .select("record_id")
    .eq("user_id", userId);

  if (loadError) throw loadError;

  if (records.length) {
    const { error } = await client.from("savings_debt_records").upsert(
      records.map((record) => ({ ...record, user_id: userId })),
      { onConflict: "user_id,record_id" },
    );
    if (error) throw error;
  }

  const nextIds = new Set(records.map((record) => record.record_id));
  const removedIds = (existing ?? [])
    .map((record) => record.record_id)
    .filter((recordId) => !nextIds.has(recordId));

  if (removedIds.length) {
    const { error } = await client
      .from("savings_debt_records")
      .delete()
      .eq("user_id", userId)
      .in("record_id", removedIds);
    if (error) throw error;
  }
}
