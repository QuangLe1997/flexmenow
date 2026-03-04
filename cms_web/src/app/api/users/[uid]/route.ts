import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * GET /api/users/:uid — Get user detail + credit logs
 */
export async function GET(
  request: Request,
  { params }: { params: { uid: string } }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { uid } = params;
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = userSnap.data()!;
    const user = {
      uid,
      email: data.email || "",
      displayName: data.displayName || "",
      avatarUrl: data.avatarUrl || "",
      authProvider: data.authProvider || "email",
      creditsBalance: data.creditsBalance ?? 0,
      subscriptionPlan: data.subscriptionPlan || "free",
      subscriptionExpiresAt: data.subscriptionExpiresAt?.toDate?.()?.toISOString() || null,
      revenuecatAppUserId: data.revenuecatAppUserId || null,
      totalGenerations: data.totalGenerations ?? 0,
      totalStories: data.totalStories ?? 0,
      locale: data.locale || "en",
      timezone: data.timezone || "UTC",
      fcmToken: data.fcmToken || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      lastActiveAt: data.lastActiveAt?.toDate?.()?.toISOString() || null,
    };

    // Fetch recent credit logs
    const logsSnap = await db
      .collection("creditLogs")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const creditLogs = logsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        amount: d.amount ?? 0,
        type: d.type || "",
        description: d.description || "",
        balanceAfter: d.balanceAfter ?? 0,
        referenceId: d.referenceId || null,
        createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ user, creditLogs });
  } catch (error) {
    console.error("GET /api/users/[uid] failed:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

/**
 * PUT /api/users/:uid — Update user fields
 */
export async function PUT(
  request: Request,
  { params }: { params: { uid: string } }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { uid } = params;
    const body = await request.json();

    // Whitelist of editable fields
    const allowedFields = [
      "displayName",
      "email",
      "subscriptionPlan",
      "locale",
      "timezone",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    updates.updatedAt = FieldValue.serverTimestamp();

    await db.collection("users").doc(uid).update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/users/[uid] failed:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
