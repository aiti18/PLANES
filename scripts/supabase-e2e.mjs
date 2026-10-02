import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readEnv() {
  return Object.fromEntries(
    fs
      .readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
}

const env = readEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const stamp = Date.now();
const password = `PlanesE2E!${stamp}`;
const firstEmail = `planes.rls.one.${stamp}@gmail.com`;
const secondEmail = `planes.rls.two.${stamp}@gmail.com`;
const results = {};

function client(options = {}) {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, ...options },
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function check(error, operation) {
  if (error) throw new Error(`${operation}: ${error.message}`);
}

async function signUp(email, name) {
  const authClient = client();
  const { data, error } = await authClient.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  check(error, `signup ${email}`);
  assert(data.user, `signup ${email} did not return a user`);
  assert(data.session, `signup ${email} did not return a confirmed session`);
  return { authClient, session: data.session, user: data.user };
}

const first = await signUp(firstEmail, "Planes RLS One");
const second = await signUp(secondEmail, "Planes RLS Two");
results.signup = {
  first: { confirmed: Boolean(first.user.email_confirmed_at), id: first.user.id },
  second: { confirmed: Boolean(second.user.email_confirmed_at), id: second.user.id },
};

const firstClient = client();
const secondClient = client();
check(
  (await firstClient.auth.setSession(first.session)).error,
  "set first session",
);
check(
  (await secondClient.auth.setSession(second.session)).error,
  "set second session",
);

const firstProfile = await firstClient
  .from("profiles")
  .select("id,email,name,avatar_path")
  .eq("id", first.user.id)
  .single();
check(firstProfile.error, "read first profile created by trigger");
assert(firstProfile.data.id === first.user.id, "first profile UID mismatch");
assert(firstProfile.data.name === "Planes RLS One", "first profile name mismatch");

const secondProfile = await secondClient
  .from("profiles")
  .select("id,email,name,avatar_path")
  .eq("id", second.user.id)
  .single();
check(secondProfile.error, "read second profile created by trigger");
assert(secondProfile.data.id === second.user.id, "second profile UID mismatch");
results.profiles = { trigger: true, uidMatches: true };

const plannerKey = "day";
check(
  (
    await firstClient.from("planner_documents").upsert({
      user_id: first.user.id,
      document_key: plannerKey,
      payload: { checked: false, title: "E2E planner" },
    })
  ).error,
  "create planner",
);
let planner = await firstClient
  .from("planner_documents")
  .select("payload")
  .eq("user_id", first.user.id)
  .eq("document_key", plannerKey)
  .single();
check(planner.error, "read planner");
assert(planner.data.payload.title === "E2E planner", "planner create/read mismatch");
check(
  (
    await firstClient
      .from("planner_documents")
      .update({ payload: { checked: true, title: "E2E planner updated" } })
      .eq("user_id", first.user.id)
      .eq("document_key", plannerKey)
  ).error,
  "update planner",
);
planner = await firstClient
  .from("planner_documents")
  .select("payload")
  .eq("user_id", first.user.id)
  .eq("document_key", plannerKey)
  .single();
check(planner.error, "read updated planner");
assert(planner.data.payload.checked === true, "planner update mismatch");

const financeId = `e2e-finance-${stamp}`;
check(
  (
    await firstClient.from("finance_records").insert({
      user_id: first.user.id,
      record_id: financeId,
      type: "expense",
      amount: 120,
      checked: false,
      record_date: "E2E",
      month_key: "2026-10",
      note: "create",
      title: "E2E finance",
    })
  ).error,
  "create finance",
);
let finance = await firstClient
  .from("finance_records")
  .select("amount,checked,note")
  .eq("user_id", first.user.id)
  .eq("record_id", financeId)
  .single();
check(finance.error, "read finance");
assert(Number(finance.data.amount) === 120, "finance create/read mismatch");
check(
  (
    await firstClient
      .from("finance_records")
      .update({ checked: true, note: "updated" })
      .eq("user_id", first.user.id)
      .eq("record_id", financeId)
  ).error,
  "update finance",
);
finance = await firstClient
  .from("finance_records")
  .select("checked,note")
  .eq("user_id", first.user.id)
  .eq("record_id", financeId)
  .single();
check(finance.error, "read updated finance");
assert(finance.data.checked && finance.data.note === "updated", "finance update mismatch");

const savingsId = `e2e-savings-${stamp}`;
check(
  (
    await firstClient.from("savings_debt_records").insert({
      user_id: first.user.id,
      record_id: savingsId,
      type: "debt",
      amount: 340,
      checked: false,
      closed: false,
      record_date: "E2E",
      month_key: "2026-10",
      title: "E2E debt",
    })
  ).error,
  "create savings/debt",
);
let savings = await firstClient
  .from("savings_debt_records")
  .select("amount,checked,closed")
  .eq("user_id", first.user.id)
  .eq("record_id", savingsId)
  .single();
check(savings.error, "read savings/debt");
assert(Number(savings.data.amount) === 340, "savings/debt create/read mismatch");
check(
  (
    await firstClient
      .from("savings_debt_records")
      .update({ checked: true, closed: true })
      .eq("user_id", first.user.id)
      .eq("record_id", savingsId)
  ).error,
  "update savings/debt",
);
savings = await firstClient
  .from("savings_debt_records")
  .select("checked,closed")
  .eq("user_id", first.user.id)
  .eq("record_id", savingsId)
  .single();
check(savings.error, "read updated savings/debt");
assert(savings.data.checked && savings.data.closed, "savings/debt update mismatch");

check(
  (
    await firstClient
      .from("user_settings")
      .update({ settings: { language: "en", e2e: true } })
      .eq("user_id", first.user.id)
  ).error,
  "update user settings",
);
const settings = await firstClient
  .from("user_settings")
  .select("settings")
  .eq("user_id", first.user.id)
  .single();
check(settings.error, "read user settings");
assert(settings.data.settings.e2e === true, "settings update mismatch");

check(
  (
    await firstClient
      .from("profiles")
      .update({ name: "Planes RLS One Updated" })
      .eq("id", first.user.id)
  ).error,
  "update profile",
);
const updatedProfile = await firstClient
  .from("profiles")
  .select("name")
  .eq("id", first.user.id)
  .single();
check(updatedProfile.error, "read updated profile");
assert(updatedProfile.data.name === "Planes RLS One Updated", "profile update mismatch");

const avatarPath = `${first.user.id}/e2e-avatar.png`;
const png = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z0wAAAABJRU5ErkJggg==",
    "base64",
  ),
);
check(
  (
    await firstClient.storage.from("avatars").upload(avatarPath, png, {
      contentType: "image/png",
      upsert: true,
    })
  ).error,
  "upload own avatar",
);
const avatarList = await firstClient.storage
  .from("avatars")
  .list(first.user.id, { search: "e2e-avatar.png" });
check(avatarList.error, "list own avatar");
assert(avatarList.data.some((item) => item.name === "e2e-avatar.png"), "avatar missing");

const hiddenProfile = await secondClient
  .from("profiles")
  .select("id")
  .eq("id", first.user.id);
check(hiddenProfile.error, "RLS select first profile as second");
assert(hiddenProfile.data.length === 0, "second user can see first profile");

const hiddenPlanner = await secondClient
  .from("planner_documents")
  .select("document_key")
  .eq("user_id", first.user.id);
check(hiddenPlanner.error, "RLS select first planner as second");
assert(hiddenPlanner.data.length === 0, "second user can see first planner");

const hiddenFinance = await secondClient
  .from("finance_records")
  .select("record_id")
  .eq("user_id", first.user.id);
check(hiddenFinance.error, "RLS select first finance as second");
assert(hiddenFinance.data.length === 0, "second user can see first finance");

const hiddenSavings = await secondClient
  .from("savings_debt_records")
  .select("record_id")
  .eq("user_id", first.user.id);
check(hiddenSavings.error, "RLS select first savings as second");
assert(hiddenSavings.data.length === 0, "second user can see first savings/debt");

const hiddenSettings = await secondClient
  .from("user_settings")
  .select("user_id")
  .eq("user_id", first.user.id);
check(hiddenSettings.error, "RLS select first settings as second");
assert(hiddenSettings.data.length === 0, "second user can see first settings");

const forbiddenUpdate = await secondClient
  .from("finance_records")
  .update({ note: "hacked" })
  .eq("user_id", first.user.id)
  .eq("record_id", financeId)
  .select("record_id");
check(forbiddenUpdate.error, "RLS update attempt");
assert(forbiddenUpdate.data.length === 0, "second user updated first finance");

const forbiddenDelete = await secondClient
  .from("savings_debt_records")
  .delete()
  .eq("user_id", first.user.id)
  .eq("record_id", savingsId)
  .select("record_id");
check(forbiddenDelete.error, "RLS delete attempt");
assert(forbiddenDelete.data.length === 0, "second user deleted first savings/debt");

const forbiddenInsert = await secondClient.from("finance_records").insert({
  user_id: first.user.id,
  record_id: `forbidden-${stamp}`,
  type: "income",
  amount: 1,
  checked: false,
  record_date: "E2E",
  month_key: "2026-10",
  note: "forbidden",
  title: "Forbidden",
});
assert(Boolean(forbiddenInsert.error), "second user inserted row for first user");

const forbiddenAvatarRead = await secondClient.storage
  .from("avatars")
  .download(avatarPath);
assert(Boolean(forbiddenAvatarRead.error), "second user downloaded first avatar");
const forbiddenAvatarWrite = await secondClient.storage
  .from("avatars")
  .upload(`${first.user.id}/forbidden.png`, png, { contentType: "image/png" });
assert(Boolean(forbiddenAvatarWrite.error), "second user wrote to first avatar folder");

const firstFinanceStillExists = await firstClient
  .from("finance_records")
  .select("note")
  .eq("user_id", first.user.id)
  .eq("record_id", financeId)
  .single();
check(firstFinanceStillExists.error, "verify finance after forbidden update");
assert(firstFinanceStillExists.data.note === "updated", "forbidden update changed finance");

const firstSavingsStillExists = await firstClient
  .from("savings_debt_records")
  .select("record_id")
  .eq("user_id", first.user.id)
  .eq("record_id", savingsId)
  .single();
check(firstSavingsStillExists.error, "verify savings after forbidden delete");

const secondFinanceId = `e2e-finance-second-${stamp}`;
check(
  (
    await secondClient.from("finance_records").insert({
      user_id: second.user.id,
      record_id: secondFinanceId,
      type: "income",
      amount: 25,
      checked: true,
      record_date: "E2E",
      month_key: "2026-10",
      note: "second owner",
      title: "Second user finance",
    })
  ).error,
  "create second user finance",
);
const reverseHidden = await firstClient
  .from("finance_records")
  .select("record_id")
  .eq("user_id", second.user.id)
  .eq("record_id", secondFinanceId);
check(reverseHidden.error, "reverse RLS select");
assert(reverseHidden.data.length === 0, "first user can see second finance");
const reverseUpdate = await firstClient
  .from("finance_records")
  .update({ note: "reverse hacked" })
  .eq("user_id", second.user.id)
  .eq("record_id", secondFinanceId)
  .select("record_id");
check(reverseUpdate.error, "reverse RLS update");
assert(reverseUpdate.data.length === 0, "first user updated second finance");
const reverseDelete = await firstClient
  .from("finance_records")
  .delete()
  .eq("user_id", second.user.id)
  .eq("record_id", secondFinanceId)
  .select("record_id");
check(reverseDelete.error, "reverse RLS delete");
assert(reverseDelete.data.length === 0, "first user deleted second finance");
const reverseInsert = await firstClient.from("finance_records").insert({
  user_id: second.user.id,
  record_id: `reverse-forbidden-${stamp}`,
  type: "income",
  amount: 1,
  checked: false,
  record_date: "E2E",
  month_key: "2026-10",
  note: "reverse forbidden",
  title: "Reverse forbidden",
});
assert(Boolean(reverseInsert.error), "first user inserted row for second user");
const secondFinanceStillExists = await secondClient
  .from("finance_records")
  .select("note")
  .eq("user_id", second.user.id)
  .eq("record_id", secondFinanceId)
  .single();
check(secondFinanceStillExists.error, "verify second finance after reverse attacks");
assert(
  secondFinanceStillExists.data.note === "second owner",
  "reverse RLS attempt changed second finance",
);
results.rls = {
  crossDeleteBlocked: true,
  crossInsertBlocked: true,
  crossSelectBlocked: true,
  crossUpdateBlocked: true,
  storageReadBlocked: true,
  storageWriteBlocked: true,
};

const memory = new Map();
const storage = {
  getItem: (storageKey) => memory.get(storageKey) ?? null,
  removeItem: (storageKey) => memory.delete(storageKey),
  setItem: (storageKey, value) => memory.set(storageKey, value),
};
const loginClient = client({ persistSession: true, storage });
const login = await loginClient.auth.signInWithPassword({
  email: firstEmail,
  password,
});
check(login.error, "login with password");
assert(login.data.session, "login did not create session");
const restoredClient = client({ persistSession: true, storage });
const restored = await restoredClient.auth.getSession();
check(restored.error, "restore session");
assert(restored.data.session?.user.id === first.user.id, "session restore mismatch");
check((await restoredClient.auth.signOut()).error, "logout");
const afterLogout = await restoredClient.auth.getSession();
check(afterLogout.error, "get session after logout");
assert(!afterLogout.data.session, "session remained after logout");
results.auth = { login: true, logout: true, sessionRestore: true };

for (const [table, filters] of [
  ["planner_documents", { document_key: plannerKey }],
  ["finance_records", { record_id: financeId }],
  ["savings_debt_records", { record_id: savingsId }],
]) {
  let query = firstClient.from(table).delete().eq("user_id", first.user.id);
  for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
  check((await query).error, `delete own ${table}`);
  let verify = firstClient.from(table).select("*").eq("user_id", first.user.id);
  for (const [column, value] of Object.entries(filters)) verify = verify.eq(column, value);
  const deleted = await verify;
  check(deleted.error, `verify own delete ${table}`);
  assert(deleted.data.length === 0, `own delete failed for ${table}`);
}
check(
  (await firstClient.storage.from("avatars").remove([avatarPath])).error,
  "delete own avatar",
);
check(
  (
    await secondClient
      .from("finance_records")
      .delete()
      .eq("user_id", second.user.id)
      .eq("record_id", secondFinanceId)
  ).error,
  "delete second own finance",
);

check(
  (
    await secondClient
      .from("user_settings")
      .delete()
      .eq("user_id", second.user.id)
  ).error,
  "delete own user settings",
);
const deletedSettings = await secondClient
  .from("user_settings")
  .select("user_id")
  .eq("user_id", second.user.id);
check(deletedSettings.error, "verify deleted user settings");
assert(deletedSettings.data.length === 0, "own user settings delete failed");
check(
  (
    await secondClient.from("user_settings").insert({
      user_id: second.user.id,
      settings: {},
    })
  ).error,
  "recreate own user settings",
);

check(
  (await secondClient.from("profiles").delete().eq("id", second.user.id)).error,
  "delete own profile",
);
const deletedProfile = await secondClient
  .from("profiles")
  .select("id")
  .eq("id", second.user.id);
check(deletedProfile.error, "verify deleted profile");
assert(deletedProfile.data.length === 0, "own profile delete failed");
check(
  (
    await secondClient.from("profiles").insert({
      id: second.user.id,
      email: secondEmail,
      name: "Planes RLS Two",
    })
  ).error,
  "recreate own profile",
);
results.crud = {
  finance_records: true,
  planner_documents: true,
  profiles: true,
  savings_debt_records: true,
  user_settings: true,
};
results.avatar = { create: true, read: true, delete: true };

console.log(JSON.stringify(results, null, 2));
