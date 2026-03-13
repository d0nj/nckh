import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const conditions = [eq(notifications.userId, session.user.id)];
    if (unreadOnly) conditions.push(eq(notifications.isRead, false));

    const result = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = session.user.role;
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, title, content, type, link } = body;
    if (!userId || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newNotif = await db.insert(notifications).values({
      id: nanoid(),
      userId,
      title,
      content,
      type: type || "info",
      link,
      isRead: false,
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newNotif[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    
    if (body.all) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, session.user.id));
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      const updated = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, body.id), eq(notifications.userId, session.user.id)))
        .returning();
      return NextResponse.json(updated[0] || { success: true });
    }

    return NextResponse.json({ error: "Missing id or all flag" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
