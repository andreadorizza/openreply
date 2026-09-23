import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockGetUserMedia } = vi.hoisted(() => ({
  mockPrisma: {
    automation: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
  mockGetUserMedia: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/instagram/provider", () => ({
  createInstagramContext: vi.fn(async () => ({})),
  hasInstagramCredentials: () => true,
  getUserMedia: mockGetUserMedia,
}));

import { attachPendingNextReels } from "../lib/automation/attach-next-reel";

function pendingCampaign(overrides: Record<string, unknown> = {}) {
  return {
    id: "auto_1",
    instagramAccountId: "acct_1",
    instagramAccount: { id: "acct_1" },
    createdAt: new Date("2026-09-01T00:00:00Z"),
    nextReelArmedAt: null,
    ...overrides,
  };
}

const media = [
  { id: "reel_old", media_product_type: "REELS", timestamp: "2026-09-10T12:00:00+0000", permalink: "https://ig/old" },
  { id: "reel_new", media_product_type: "REELS", timestamp: "2026-09-22T12:00:00+0000", permalink: "https://ig/new" },
];

describe("attachPendingNextReels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserMedia.mockResolvedValue(media);
  });

  it("binds to the first reel posted after the campaign was armed, not created", async () => {
    // Created on 1 Sep, switched to "next reel" on 20 Sep: the 10 Sep reel is
    // already live and must not be picked.
    mockPrisma.automation.findMany.mockResolvedValue([
      pendingCampaign({ nextReelArmedAt: new Date("2026-09-20T00:00:00Z") }),
    ]);

    await attachPendingNextReels();

    expect(mockPrisma.automation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ postId: "reel_new" }),
      })
    );
  });

  it("falls back to createdAt for campaigns armed before the column existed", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([pendingCampaign()]);

    await attachPendingNextReels();

    expect(mockPrisma.automation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ postId: "reel_old" }),
      })
    );
  });
});
