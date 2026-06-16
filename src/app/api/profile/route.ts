import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profilePhotoSchema = z.union([
  z.literal(""),
  z
    .string()
    .max(1_500_000)
    .regex(/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/),
]);

const updateProfileSchema = z
  .object({
    profilePhoto: profilePhotoSchema.optional(),
  })
  .strict();

async function getSessionUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    select: {
      email: true,
      id: true,
      name: true,
      profilePhoto: true,
    },
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Пользователь не найден" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    email: user.email,
    id: user.id,
    name: user.name,
    profilePhoto: user.profilePhoto ?? "",
  });
}

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Некорректный JSON" },
      { status: 400 },
    );
  }

  const parsedBody = updateProfileSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: "Некорректные данные профиля" },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    data: {
      ...(parsedBody.data.profilePhoto !== undefined
        ? { profilePhoto: parsedBody.data.profilePhoto || null }
        : {}),
    },
    select: {
      email: true,
      id: true,
      name: true,
      profilePhoto: true,
    },
    where: { id: userId },
  });

  return NextResponse.json({
    email: user.email,
    id: user.id,
    name: user.name,
    profilePhoto: user.profilePhoto ?? "",
  });
}
