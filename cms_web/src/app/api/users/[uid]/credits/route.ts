import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/users/:uid/credits — Add or deduct credits
 *
 * Body: { amount: number, reason: string }
 *   amount > 0 → add credits
 *   amount < 0 → deduct credits
 */
export async function POST(
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
    const amount = Number(body.amount);
    const reason = String(body.reason || "").trim();

    if (!amount || isNaN(amount)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    // Atomic transaction: update balance + write log
    const newBalance = await db.runTransaction(async (tx) => {
      const userRef = db.collection("users").doc(uid);
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new Error("User not found");
      }

      const currentBalance = (userSnap.data()!.creditsBalance as number) || 0;
      const updatedBalance = currentBalance + amount;

      if (updatedBalance < 0) {
        throw new Error(`Insufficient credits. Current: ${currentBalance}, deduct: ${Math.abs(amount)}`);
      }

      tx.update(userRef, {
        creditsBalance: updatedBalance,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const logRef = db.collection("creditLogs").doc();
      tx.set(logRef, {
        userId: uid,
        amount,
        type: amount > 0 ? "admin_add" : "admin_deduct",
        referenceId: null,
        referenceType: null,
        balanceAfter: updatedBalance,
        description: `[CMS Admin] ${reason}`,
        createdAt: FieldValue.serverTimestamp(),
      });

      return updatedBalance;
    });

    return NextResponse.json({
      success: true,
      newBalance,
      amount,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update credits";
    console.error("POST /api/users/[uid]/credits failed:", error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
