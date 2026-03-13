import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq, and, like, or, desc } from "drizzle-orm";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const role = session.user.role;
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filterRole = searchParams.get("role");
    const search = searchParams.get("search");

    // Select only safe fields — exclude sensitive data
    let query = db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      createdAt: user.createdAt,
    }).from(user).orderBy(desc(user.createdAt));
    
    const conditions = [];
    if (filterRole) conditions.push(eq(user.role, filterRole as "admin" | "staff" | "teacher" | "student"));
    if (search) {
      conditions.push(
        or(
          like(user.name, `%${search}%`),
          like(user.email, `%${search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const data = await query;
    return NextResponse.json(data);
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
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Only admin can update other users' records
    if (session.user.id !== id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Whitelist allowed fields based on role — prevent privilege escalation
    const updateData: Record<string, any> = {};

    if (session.user.role === "admin") {
      // Admins can update these fields
      if (body.name !== undefined) updateData.name = body.name;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.image !== undefined) updateData.image = body.image;
      if (body.role !== undefined) updateData.role = body.role;
      if (body.banned !== undefined) updateData.banned = body.banned;
      if (body.banReason !== undefined) updateData.banReason = body.banReason;
      if (body.banExpires !== undefined) updateData.banExpires = body.banExpires;
    } else {
      // Non-admins can only update their own name and image
      if (body.name !== undefined) updateData.name = body.name;
      if (body.image !== undefined) updateData.image = body.image;
    }

    updateData.updatedAt = new Date();

    const updatedUser = await db.update(user)
      .set(updateData)
      .where(eq(user.id, id))
      .returning();

    if (!updatedUser.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
