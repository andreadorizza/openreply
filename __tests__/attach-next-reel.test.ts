import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockGetUserMedia } = vi.hoisted(() => ({
  mockPrisma: {
    automation: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  mockGetUserMedia: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/meta/client", () => ({ getUserMedia: mockGetUserMedia }));
vi.mock("@/lib/meta/oauth", () => ({ decryptToken: () => "token" }));

import { attachNextReels } from "../lib/polling/attach-next-reel";

const account = { id: "acct_1", accessToken: "enc" };

function pendingCampaign(overrides: Record<string, unknown> = {}) {
  return {
    id: "auto_1",
    instagramAccountId: "acct_1",
    instagramAccount: account,
    createdAt: new Date("2026-09-01T00:00:00Z"),
    nextReelArmedAt: null,
    ...overrides,
  };
}

const media = [
  { id: "reel_old", media_product_type: "REELS", timestamp: "2026-09-10T12:00:00+0000", permalink: "https://ig/old" },
  { id: "post_new", media_product_type: "FEED", timestamp: "2026-09-21T12:00:00+0000", permalink: "https://ig/feed" },
  { id: "reel_new", media_product_type: "REELS", timestamp: "2026-09-22T12:00:00+0000", permalink: "https://ig/new" },
];

describe("attachNextReels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserMedia.mockResolvedValue(media);
    mockPrisma.automation.updateMany.mockResolvedValue({ count: 1 });
  });

  it("binds to the first reel posted after the campaign was armed, not created", async () => {
    // Created on 1 Sep, switched to "next reel" on 20 Sep: the 10 Sep reel is
    // already live and must not be picked.
    mockPrisma.automation.findMany.mockResolvedValue([
      pendingCampaign({ nextReelArmedAt: new Date("2026-09-20T00:00:00Z") }),
    ]);

    const result = await attachNextReels();

    expect(mockPrisma.automation.updateMany).toHaveBeenCalledWith({
      where: { id: "auto_1", pendingNextReel: true },
      data: { postId: "reel_new", postUrl: "https://ig/new", pendingNextReel: false },
    });
    expect(result.bound).toBe(1);
  });

  it("falls back to createdAt for campaigns armed before the column existed", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([pendingCampaign()]);

    await attachNextReels();

    expect(mockPrisma.automation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ postId: "reel_old" }),
      })
    );
  });

  it("leaves the campaign waiting when no reel is newer than the arm time", async () => {
    mockPrisma.automation.findMany.mockResolvedValue([
      pendingCampaign({ nextReelArmedAt: new Date("2026-09-23T00:00:00Z") }),
    ]);

    const result = await attachNextReels();

    expect(mockPrisma.automation.updateMany).not.toHaveBeenCalled();
    expect(result.bound).toBe(0);
  });
});
