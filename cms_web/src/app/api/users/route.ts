import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

/**
 * GET /api/users — List users with search + pagination
 *
 * Query params:
 *   search   — filter by email or displayName (prefix match)
 *   page     — page number (default 1)
 *   limit    — items per page (default 20)
 *   plan     — filter by subscriptionPlan
 *   sort     — "credits" | "created" | "active" (default "created")
 */
export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const plan = url.searchParams.get("plan") || "";
    const sort = url.searchParams.get("sort") || "created";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

    // Build query
    let query: FirebaseFirestore.Query = db.collection("users");

    // Filter by plan
    if (plan) {
      query = query.where("subscriptionPlan", "==", plan);
    }

    // Sort
    switch (sort) {
      case "credits":
        query = query.orderBy("creditsBalance", "desc");
        break;
      case "active":
        query = query.orderBy("lastActiveAt", "desc");
        break;
      default:
        query = query.orderBy("createdAt", "desc");
    }

    // Firestore doesn't support LIKE search, so we fetch all and filter in-memory
    // For a production app with many users, consider Algolia or a dedicated search service
    const snapshot = await query.get();

    let users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || "",
        displayName: data.displayName || "",
        avatarUrl: data.avatarUrl || "",
        authProvider: data.authProvider || "email",
        creditsBalance: data.creditsBalance ?? 0,
        subscriptionPlan: data.subscriptionPlan || "free",
        subscriptionExpiresAt: data.subscriptionExpiresAt?.toDate?.()?.toISOString() || null,
        totalGenerations: data.totalGenerations ?? 0,
        totalStories: data.totalStories ?? 0,
        locale: data.locale || "en",
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        lastActiveAt: data.lastActiveAt?.toDate?.()?.toISOString() || null,
      };
    });

    // Search filter (in-memory)
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q) ||
          u.uid.toLowerCase().includes(q)
      );
    }

    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const paged = users.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      users: paged,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("GET /api/users failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
