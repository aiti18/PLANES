import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";

function maskEmail(email: string) {
  const [name, domain] = email.split("@");

  if (!domain) {
    return "invalid-email";
  }

  return `${name.slice(0, 2)}***@${domain}`;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Некорректный JSON" },
      { status: 400 },
    );
  }

  const parsedBody = registerSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: "Проверьте данные формы" },
      { status: 400 },
    );
  }

  const email = parsedBody.data.email.trim().toLowerCase();
  const existingUser = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });

  if (existingUser) {
    console.warn("[auth][register] user already exists", {
      email: maskEmail(email),
      userId: existingUser.id,
    });

    return NextResponse.json(
      { message: "Пользователь с таким email уже существует" },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(parsedBody.data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: parsedBody.data.name,
      email,
      password: hashedPassword,
    },
  });

  console.info("[auth][register] created user", {
    email: maskEmail(user.email),
    userId: user.id,
  });

  return NextResponse.json({ message: "Аккаунт создан" }, { status: 201 });
}
