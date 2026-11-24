import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    automation: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    automationPost: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    instagramAccount: { findFirst: vi.fn() },
    workspace: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/auth", () => ({ getCurrentWorkspaceId: vi.fn() }));
vi.mock("@/lib/workspace-access", () => ({
  canManageWorkspace: () => true,
  getCurrentWorkspaceContext: vi.fn(async () => ({
    workspaceId: "workspace_123",
    role: "OWNER",
  })),
}));
vi.mock("@/lib/campaigns/links", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/campaigns/links")>()),
  syncCampaignLinks: vi.fn(),
}));

import {
  MAX_CAMPAIGN_POSTS,
  campaignPostFields,
  campaignPostForComment,
  campaignPostRows,
  requestedCampaignPosts,
  syncCampaignPosts,
} from "../lib/campaigns/posts";
import { PATCH, POST } from "../app/api/automations/route";
import type { Prisma } from "../app/generated/prisma/client";

const URL_A = "https://www.instagram.com/reel/A/";
const URL_B = "https://www.instagram.com/reel/B/";

function request(method: "POST" | "PATCH", body: unknown) {
  const url =
    method === "PATCH"
      ? "https://example.com/api/automations?id=automation_123"
      : "https://example.com/api/automations";
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const baseCampaign = {
  name: "Trial reels",
  keywords: ["GUIDE"],
  dmMessage: "Here you go: {link}",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.workspace.findUnique.mockResolvedValue({ id: "workspace_123" });
  mockPrisma.instagramAccount.findFirst.mockResolvedValue({ id: "account_1" });
  mockPrisma.automation.create.mockImplementation(async ({ data }) => ({
    id: "automation_123",
    posts: (data.posts?.create ?? []).map(
      (row: { postId: string; postUrl: string | null }) => row
    ),
    trackedLinks: [],
  }));
  mockPrisma.automation.findFirst.mockResolvedValue({
    id: "automation_123",
    workspaceId: "workspace_123",
    instagramAccountId: "account_1",
    matchAnyPost: false,
    pendingNextReel: false,
  });
  mockPrisma.automation.update.mockResolvedValue({});
  mockPrisma.automation.findUniqueOrThrow.mockResolvedValue({
    id: "automation_123",
    posts: [],
  });
  mockPrisma.automationPost.findMany.mockResolvedValue([]);
  mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
});

describe("requestedCampaignPosts", () => {
  it("takes the posts list, dropping repeats", () => {
    expect(
      requestedCampaignPosts({
        posts: [
          { id: "a", url: URL_A },
          { id: "b" },
          { id: "a", url: URL_B },
        ],
        postId: "ignored",
      })
    ).toEqual([
      { id: "a", url: URL_A },
      { id: "b", url: null },
    ]);
  });

  it("still accepts a single postId", () => {
    expect(requestedCampaignPosts({ postId: "a", postUrl: URL_A })).toEqual([
      { id: "a", url: URL_A },
    ]);
  });

  it("leaves the posts alone when the request names none", () => {
    expect(requestedCampaignPosts({})).toBeUndefined();
  });

  it("clears the posts on an explicit null", () => {
    expect(requestedCampaignPosts({ postId: null })).toEqual([]);
  });
});

describe("campaignPostRows", () => {
  it("keeps the given order in createdAt", () => {
    const from = new Date("2026-11-24T10:00:00.000Z");
    const rows = campaignPostRows(
      [
        { id: "a", url: URL_A },
        { id: "b", url: null },
      ],
      from
    );
    expect(rows).toEqual([
      { postId: "a", postUrl: URL_A, createdAt: from },
      { postId: "b", postUrl: null, createdAt: new Date(from.getTime() + 1) },
    ]);
  });
});

describe("campaignPostForComment", () => {
  it("records the post an ad was made from", () => {
    expect(campaignPostForComment(["post"], "ad", "post")).toBe("post");
  });

  it("records the post itself for a comment on it", () => {
    expect(campaignPostForComment(["a", "b"], "b")).toBe("b");
  });

  it("records the commented post for an any-post campaign", () => {
    expect(campaignPostForComment([], "post")).toBe("post");
    expect(campaignPostForComment([], "ad", "post")).toBe("post");
  });
});

describe("campaignPostFields", () => {
  it("returns the posts and the first one as postId / postUrl", () => {
    expect(
      campaignPostFields([
        { postId: "a", postUrl: URL_A },
        { postId: "b", postUrl: null },
      ])
    ).toEqual({
      posts: [
        { id: "a", url: URL_A },
        { id: "b", url: null },
      ],
      postId: "a",
      postUrl: URL_A,
    });
  });

  it("returns nulls for a campaign without posts", () => {
    expect(campaignPostFields([])).toEqual({
      posts: [],
      postId: null,
      postUrl: null,
    });
  });
});

describe("syncCampaignPosts", () => {
  it("removes dropped posts, keeps the rest and adds new ones after them", async () => {
    mockPrisma.automationPost.findMany.mockResolvedValue([
      { postId: "a", postUrl: null },
    ]);

    await syncCampaignPosts(
      mockPrisma as unknown as Prisma.TransactionClient,
      "automation_123",
      [
        { id: "a", url: URL_A },
        { id: "c", url: null },
      ]
    );

    expect(mockPrisma.automationPost.deleteMany).toHaveBeenCalledWith({
      where: { automationId: "automation_123", postId: { notIn: ["a", "c"] } },
    });
    const created = mockPrisma.automationPost.createMany.mock.calls[0][0].data;
    expect(created).toEqual([
      expect.objectContaining({ automationId: "automation_123", postId: "c" }),
    ]);
    // "a" keeps its row and gains the link it lacked.
    expect(mockPrisma.automationPost.update).toHaveBeenCalledWith({
      where: { automationId_postId: { automationId: "automation_123", postId: "a" } },
      data: { postUrl: URL_A },
    });
  });
});

describe("POST /api/automations", () => {
  it("creates one row per chosen post, in order", async () => {
    const response = await POST(
      request("POST", {
        ...baseCampaign,
        posts: [
          { id: "a", url: URL_A },
          { id: "b", url: URL_B },
        ],
      })
    );

    expect(response.status).toBe(201);
    const rows = mockPrisma.automation.create.mock.calls[0][0].data.posts.create;
    expect(rows.map((row: { postId: string }) => row.postId)).toEqual(["a", "b"]);
    const { data } = await response.json();
    expect(data.posts).toEqual([
      { id: "a", url: URL_A },
      { id: "b", url: URL_B },
    ]);
    expect(data.postId).toBe("a");
  });

  it("still accepts a single postId", async () => {
    const response = await POST(
      request("POST", { ...baseCampaign, postId: "a", postUrl: URL_A })
    );

    expect(response.status).toBe(201);
    const rows = mockPrisma.automation.create.mock.calls[0][0].data.posts.create;
    expect(rows).toEqual([expect.objectContaining({ postId: "a", postUrl: URL_A })]);
  });

  it(`refuses more than ${MAX_CAMPAIGN_POSTS} posts`, async () => {
    const posts = Array.from({ length: MAX_CAMPAIGN_POSTS + 1 }, (_, i) => ({
      id: `post_${i}`,
    }));
    const response = await POST(request("POST", { ...baseCampaign, posts }));

    expect(response.status).toBe(400);
    expect(mockPrisma.automation.create).not.toHaveBeenCalled();
  });

  it("refuses a campaign on chosen posts without any", async () => {
    const response = await POST(request("POST", { ...baseCampaign, posts: [] }));

    expect(response.status).toBe(400);
  });

  it("stores no posts for an any-post campaign", async () => {
    await POST(
      request("POST", { ...baseCampaign, matchAnyPost: true, posts: [{ id: "a" }] })
    );

    expect(mockPrisma.automation.create.mock.calls[0][0].data.posts).toBeUndefined();
  });
});

describe("PATCH /api/automations", () => {
  it("replaces the posts with the ones sent", async () => {
    const response = await PATCH(
      request("PATCH", { posts: [{ id: "a", url: URL_A }, { id: "b" }] })
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.automationPost.deleteMany).toHaveBeenCalledWith({
      where: { automationId: "automation_123", postId: { notIn: ["a", "b"] } },
    });
  });

  it("leaves the posts alone when none are sent", async () => {
    await PATCH(request("PATCH", { isActive: false }));

    expect(mockPrisma.automationPost.deleteMany).not.toHaveBeenCalled();
    expect(mockPrisma.automationPost.createMany).not.toHaveBeenCalled();
  });

  it("drops the posts when the campaign moves to any post", async () => {
    await PATCH(request("PATCH", { matchAnyPost: true, posts: [{ id: "a" }] }));

    expect(mockPrisma.automationPost.deleteMany).toHaveBeenCalledWith({
      where: { automationId: "automation_123", postId: { notIn: [] } },
    });
    expect(mockPrisma.automationPost.createMany).not.toHaveBeenCalled();
  });

  it("refuses to remove the last post of a campaign on chosen posts", async () => {
    const response = await PATCH(request("PATCH", { posts: [] }));

    expect(response.status).toBe(400);
    expect(mockPrisma.automation.update).not.toHaveBeenCalled();
  });
});
