export function getAuthErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("already registered")) {
    return "Пользователь с таким email уже существует";
  }

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid credentials")
  ) {
    return "Неверный email или пароль";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Email ещё не подтверждён. Откройте письмо от Supabase и перейдите по ссылке";
  }

  if (normalizedMessage.includes("password")) {
    return "Пароль не соответствует требованиям безопасности";
  }

  if (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("network")
  ) {
    return "Нет соединения с сервером. Проверьте интернет и попробуйте снова";
  }

  return "Не удалось выполнить запрос. Попробуйте ещё раз";
}
