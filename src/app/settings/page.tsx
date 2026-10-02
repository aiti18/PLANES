"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  ImagePlus,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAppState } from "@/components/providers/AppStateProvider";
const profilePhotoSize = 512;

async function createProfilePhotoDataUrlFromSource(source: string) {
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => reject(new Error("Image load failed")), {
      once: true,
    });
    image.src = source;
  });

  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);

  if (!sourceSize) {
    throw new Error("Invalid image dimensions");
  }

  const targetSize = Math.min(profilePhotoSize, sourceSize);
  const offsetX = (image.naturalWidth - sourceSize) / 2;
  const offsetY = (image.naturalHeight - sourceSize) / 2;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available");
  }

  canvas.width = targetSize;
  canvas.height = targetSize;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, targetSize, targetSize);
  context.drawImage(
    image,
    offsetX,
    offsetY,
    sourceSize,
    sourceSize,
    0,
    0,
    targetSize,
    targetSize,
  );

  return canvas.toDataURL("image/jpeg", 0.88);
}

async function createProfilePhotoDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Unsupported file type");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    return await createProfilePhotoDataUrlFromSource(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      aria-pressed={checked}
      className={cn(
        "flex h-7 w-12 shrink-0 items-center rounded-full border p-1 transition",
        checked
          ? "border-emerald-800 bg-emerald-800"
          : "border-emerald-900/20 bg-white",
      )}
      onClick={() => onChange(!checked)}
      title={label}
      type="button"
    >
      <span
        className={cn(
          "h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0 bg-emerald-900/20",
        )}
      />
    </button>
  );
}

function SettingRow({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-emerald-900/10 bg-[#f8faf5] p-3 sm:items-center sm:gap-4 sm:p-4">
      <div className="min-w-0 flex-1">
        <p className="font-black text-emerald-950">{label}</p>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <Toggle checked={checked} label={label} onChange={onChange} />
    </div>
  );
}

function SettingsCard({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: typeof Settings;
  title: string;
}) {
  return (
    <Card className="overflow-hidden border-emerald-900/15 bg-white shadow-sm shadow-emerald-950/5">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-900">
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-black text-emerald-950">{title}</h2>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const {
    removeProfileAvatar,
    settings,
    updateSettings,
    uploadProfileAvatar,
  } = useAppState();
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [photoDraft, setPhotoDraft] = useState(settings.photo);
  const language = settings.language === "en" ? "en" : "ru";
  const text = {
    en: {
      addPhoto: "Add photo",
      emailDescription: "Receive important notifications and reminders by email.",
      emailNotifications: "Email notifications",
      english: "English",
      language: "Language",
      logout: "Log out",
      name: "Name",
      notifications: "Notifications",
      openSiteSettings: "Site management",
      profile: "Profile",
      profilePhoto: "Profile photo",
      photoReadError: "Could not read this image.",
      photoSaved: "Photo saved",
      photoSaveError: "Could not save photo",
      pushDescription: "Show browser notifications when they are allowed.",
      pushNotifications: "Push notifications",
      removePhoto: "Remove photo",
      russian: "Russian",
      savePhoto: "Save photo",
      savingPhoto: "Saving...",
      settings: "Settings",
      subtitle: "Customize your profile and notifications.",
      updatePhoto: "Change photo",
    },
    ru: {
      addPhoto: "Добавить фото",
      emailDescription: "Получать важные уведомления и напоминания на email.",
      emailNotifications: "Email уведомления",
      english: "English",
      language: "Язык",
      logout: "Выйти",
      name: "Имя",
      notifications: "Уведомления",
      openSiteSettings: "Управление сайтом",
      profile: "Профиль",
      profilePhoto: "Фото профиля",
      photoReadError: "Не удалось прочитать это изображение.",
      photoSaved: "Фото сохранено",
      photoSaveError: "Не удалось сохранить фото",
      pushDescription: "Показывать уведомления в браузере, если они разрешены.",
      pushNotifications: "Push уведомления",
      removePhoto: "Убрать фото",
      russian: "Русский",
      savePhoto: "Сохранить фото",
      savingPhoto: "Сохраняю...",
      settings: "Настройки",
      subtitle: "Настройте профиль и уведомления под себя.",
      updatePhoto: "Поменять фото",
    },
  }[language];

  useEffect(() => {
    setPhotoDraft(settings.photo);
  }, [settings.photo]);

  async function saveProfilePhoto() {
    setIsSavingPhoto(true);

    try {
      if (!photoDraft) {
        await removeProfileAvatar();
      } else if (photoDraft !== settings.photo) {
        const profilePhoto = await createProfilePhotoDataUrlFromSource(photoDraft);
        const blob = await (await fetch(profilePhoto)).blob();
        await uploadProfileAvatar(
          new File([blob], "avatar.jpg", { type: "image/jpeg" }),
        );
      }

      toast.success(text.photoSaved);
    } catch {
      toast.error(text.photoSaveError);
    } finally {
      setIsSavingPhoto(false);
    }
  }

  async function handlePhotoChange(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      setPhotoDraft(await createProfilePhotoDataUrl(file));
    } catch {
      toast.error(text.photoReadError);
    }
  }

  async function handlePushNotificationsChange(pushNotifications: boolean) {
    if (
      pushNotifications &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      await Notification.requestPermission();
    }

    updateSettings({ pushNotifications });
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[1400px] space-y-5">
        <header className="rounded-md border border-emerald-900/15 bg-white p-5 shadow-sm shadow-emerald-950/5 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-emerald-800">
                <Settings className="h-4 w-4" />
                {text.openSiteSettings}
              </div>
              <h1 className="text-3xl font-black leading-tight text-emerald-950 sm:text-4xl">
                {text.settings}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {text.subtitle}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-5">
          <div className="space-y-5">
            <SettingsCard icon={User} title={text.profile}>
              <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="rounded-md border border-emerald-900/10 bg-[#f8faf5] p-4">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-emerald-900/15 bg-white text-3xl font-black text-emerald-900 shadow-sm">
                    {photoDraft ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={text.profilePhoto}
                        className="h-full w-full object-cover"
                        src={photoDraft}
                      />
                    ) : (
                      settings.name.trim().charAt(0).toUpperCase() || "P"
                    )}
                  </div>

                  <label
                    className="mt-4 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-emerald-900 px-3 text-sm font-black text-white transition hover:bg-emerald-800"
                    htmlFor="settings-photo"
                  >
                    <ImagePlus className="h-4 w-4" />
                    {photoDraft ? text.updatePhoto : text.addPhoto}
                  </label>
                  <input
                    accept="image/*"
                    className="hidden"
                    id="settings-photo"
                    onChange={(event) => {
                      void handlePhotoChange(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                    type="file"
                  />

                  {photoDraft && (
                    <button
                      className="mt-2 h-10 w-full rounded-md border border-red-200 bg-white text-sm font-black text-red-700 transition hover:bg-red-50"
                      onClick={() => setPhotoDraft("")}
                      type="button"
                    >
                      {text.removePhoto}
                    </button>
                  )}

                  <Button
                    className="mt-2 h-10 w-full rounded-md bg-emerald-900 font-black text-white hover:bg-emerald-800"
                    disabled={isSavingPhoto || photoDraft === settings.photo}
                    onClick={saveProfilePhoto}
                  >
                    {isSavingPhoto ? text.savingPhoto : text.savePhoto}
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="settings-name">{text.name}</Label>
                    <Input
                      id="settings-name"
                      onChange={(event) =>
                        updateSettings({ name: event.target.value })
                      }
                      value={settings.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-language">{text.language}</Label>
                    <select
                      className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-semibold text-emerald-950 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
                      id="settings-language"
                      onChange={(event) =>
                        updateSettings({
                          language: event.target.value === "en" ? "en" : "ru",
                        })
                      }
                      value={settings.language}
                    >
                      <option value="ru">{text.russian}</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>
            </SettingsCard>

            <SettingsCard icon={Bell} title={text.notifications}>
              <div className="space-y-3">
                <SettingRow
                  checked={settings.emailNotifications}
                  description={text.emailDescription}
                  label={text.emailNotifications}
                  onChange={(emailNotifications) =>
                    updateSettings({ emailNotifications })
                  }
                />
                <SettingRow
                  checked={settings.pushNotifications}
                  description={text.pushDescription}
                  label={text.pushNotifications}
                  onChange={(pushNotifications) => {
                    void handlePushNotificationsChange(pushNotifications);
                  }}
                />
              </div>
            </SettingsCard>

            <Button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-white text-sm font-black text-red-700 shadow-sm shadow-red-950/5 transition hover:bg-red-50 sm:hidden"
              onClick={() => {
                void signOut().then((result) => {
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }

                  navigate("/login", { replace: true });
                });
              }}
              variant="outline"
            >
              <LogOut className="h-4 w-4" />
              {text.logout}
            </Button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
