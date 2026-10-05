const rememberSessionKey = "planes:auth:remember";
const rememberedEmailKey = "planes:auth:email";

function canUseBrowserStorage() {
  return typeof window !== "undefined";
}

export function shouldRememberSession() {
  return (
    canUseBrowserStorage() &&
    window.localStorage.getItem(rememberSessionKey) === "true"
  );
}

export function getRememberedEmail() {
  if (!canUseBrowserStorage()) return "";

  return window.localStorage.getItem(rememberedEmailKey) ?? "";
}

export function setAuthPersistence(remember: boolean, email: string) {
  if (!canUseBrowserStorage()) return;

  if (remember) {
    window.localStorage.setItem(rememberSessionKey, "true");
    window.localStorage.setItem(rememberedEmailKey, email.trim().toLowerCase());
    return;
  }

  window.localStorage.removeItem(rememberSessionKey);
  window.localStorage.removeItem(rememberedEmailKey);
}

export const browserAuthStorage = {
  getItem(key: string) {
    if (!canUseBrowserStorage()) return null;

    return (
      window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key)
    );
  },
  removeItem(key: string) {
    if (!canUseBrowserStorage()) return;

    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
  setItem(key: string, value: string) {
    if (!canUseBrowserStorage()) return;

    if (shouldRememberSession()) {
      window.sessionStorage.removeItem(key);
      window.localStorage.setItem(key, value);
      return;
    }

    window.localStorage.removeItem(key);
    window.sessionStorage.setItem(key, value);
  },
};
