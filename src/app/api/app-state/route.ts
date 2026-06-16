import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const appStateEntrySchema = z.object({
  key: z
    .string()
    .min(1)
    .max(160)
    .regex(/^planes(?::|-)/),
  value: z.string().max(5_000_000).nullable(),
});

const appStatePayloadSchema = z.object({
  entries: z.array(appStateEntrySchema).max(80),
});

async function getSessionUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
  }

  const entries = await prisma.appState.findMany({
    orderBy: { key: "asc" },
    select: {
      key: true,
      updatedAt: true,
      value: true,
    },
    where: { userId },
  });

  return NextResponse.json({
    entries: entries.map((entry) => ({
      key: entry.key,
      updatedAt: entry.updatedAt.toISOString(),
      value: entry.value,
    })),
    userId,
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

  const parsedBody = appStatePayloadSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: "Некорректные данные состояния" },
      { status: 400 },
    );
  }

  if (parsedBody.data.entries.length === 0) {
    return NextResponse.json({ saved: true });
  }

  await prisma.$transaction(
    parsedBody.data.entries.map((entry) =>
      entry.value === null
        ? prisma.appState.deleteMany({
            where: {
              key: entry.key,
              userId,
            },
          })
        : prisma.appState.upsert({
            create: {
              key: entry.key,
              userId,
              value: entry.value,
            },
            update: {
              value: entry.value,
            },
            where: {
              userId_key: {
                key: entry.key,
                userId,
              },
            },
          }),
    ),
  );

  return NextResponse.json({ saved: true });
}

export async function POST(request: Request) {
  return PATCH(request);
}
