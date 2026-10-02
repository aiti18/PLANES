import { requireSupabase } from "@/lib/supabase";

const avatarBucket = "avatars";
const maxAvatarSize = 5 * 1024 * 1024;
const allowedAvatarTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function loadProfile() {
  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("AUTH_REQUIRED");
  }

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfileName(name: string) {
  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("AUTH_REQUIRED");
  }

  const { error } = await client
    .from("profiles")
    .update({ name: name.trim() })
    .eq("id", authData.user.id);

  if (error) {
    throw error;
  }
}

export async function uploadAvatar(file: File) {
  if (!allowedAvatarTypes.has(file.type)) {
    throw new Error("AVATAR_TYPE_NOT_ALLOWED");
  }

  if (file.size > maxAvatarSize) {
    throw new Error("AVATAR_TOO_LARGE");
  }

  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("AUTH_REQUIRED");
  }

  const avatarPath = `${authData.user.id}/avatar`;
  const { error: uploadError } = await client.storage
    .from(avatarBucket)
    .upload(avatarPath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { error: profileError } = await client
    .from("profiles")
    .update({ avatar_path: avatarPath })
    .eq("id", authData.user.id);

  if (profileError) {
    throw profileError;
  }

  return avatarPath;
}

export async function createAvatarUrl(avatarPath: string) {
  const client = requireSupabase();
  const { data, error } = await client.storage
    .from(avatarBucket)
    .createSignedUrl(avatarPath, 60 * 60);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function removeAvatar(avatarPath: string) {
  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("AUTH_REQUIRED");
  }

  const { error: removeError } = await client.storage
    .from(avatarBucket)
    .remove([avatarPath]);

  if (removeError) {
    throw removeError;
  }

  const { error: profileError } = await client
    .from("profiles")
    .update({ avatar_path: null })
    .eq("id", authData.user.id);

  if (profileError) {
    throw profileError;
  }
}
