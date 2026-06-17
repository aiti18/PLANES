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
  const body = await request.json();
  const parsedBody = registerSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: "Проверьте данные формы" },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsedBody.data.email },
  });

  if (existingUser) {
    return NextResponse.json(
      { message: "Пользователь с таким email уже существует" },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(parsedBody.data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: parsedBody.data.name,
      email: parsedBody.data.email,
      password: hashedPassword,
    },
  });

  console.info("[auth][register] created user", {
    email: maskEmail(user.email),
    userId: user.id,
  });

  return NextResponse.json({ message: "Аккаунт создан" }, { status: 201 });
}
