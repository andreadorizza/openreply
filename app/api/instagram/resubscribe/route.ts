import { NextResponse } from "next/server";
import { getCurrentWorkspaceId } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { decryptToken } from "@/lib/meta/oauth";
import {
  WEBHOOK_SUBSCRIBED_FIELDS,
  getSubscribedApps,
  subscribeInstagramAccountToWebhooks,
} from "@/lib/meta/client";

export const runtime = "nodejs";

/**
 * Re-run the per-account webhook subscription for the workspace's connected
 * accounts, then read back which fields Meta actually has active. Connecting
 * an account subscribes it once; if that call was made with an incomplete
 * field list (or failed), the only remedy used to be a full
 * disconnect/reconnect. This applies the current field list in place and
 * reports the live per-account state so a gap is visible instead of guessed.
 */
export async function POST() {
  const workspaceId = await getCurrentWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const accounts = await prisma.instagramAccount.findMany({
    where: { workspaceId, accessToken: { not: "" } },
    select: {
      id: true,
      instagramId: true,
      username: true,
      accessToken: true,
    },
  });

  const results: Array<{
    instagramAccountId: string;
    username: string;
    status: "subscribed" | "failed";
    activeFields: string[];
    missingFields: string[];
    error?: string;
  }> = [];

  for (const account of accounts) {
    try {
      const token = decryptToken(account.accessToken);
      const subscription = await subscribeInstagramAccountToWebhooks(
        account.instagramId,
        token
      );

      // Read back rather than trust the POST's success flag: this is the
      // list Meta will actually deliver against.
      const apps = await getSubscribedApps(account.instagramId, token);
      const activeFields = [
        ...new Set(apps.flatMap((app) => app.subscribed_fields ?? [])),
      ];
      const missingFields = WEBHOOK_SUBSCRIBED_FIELDS.filter(
        (field) => !activeFields.includes(field)
      );

      await prisma.instagramAccount.update({
        where: { id: account.id },
        data: { webhookSubscribed: Boolean(subscription.success) },
      });

      results.push({
        instagramAccountId: account.id,
        username: account.username,
        status: subscription.success ? "subscribed" : "failed",
        activeFields,
        missingFields,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await prisma.operationalEvent
        .create({
          data: {
            workspaceId,
            source: "SYSTEM",
            level: "ERROR",
            message: `Webhook re-subscription failed for @${account.username}: ${message}`,
            payload: { instagramAccountId: account.id },
          },
        })
        .catch(() => {});

      results.push({
        instagramAccountId: account.id,
        username: account.username,
        status: "failed",
        activeFields: [],
        missingFields: WEBHOOK_SUBSCRIBED_FIELDS,
        error: message,
      });
    }
  }

  return NextResponse.json({ success: true, data: { results } });
}
