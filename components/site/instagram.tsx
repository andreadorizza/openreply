// Instagram interface mockups, drawn in dark mode, used on the public site.
// Everything here is illustrative sample content, not real accounts.
import type { ReactNode } from "react";
import {
  BookmarkIcon,
  CameraIcon,
  CaretLeftIcon,
  CommentIcon,
  DotsIcon,
  HeartFillIcon,
  HeartIcon,
  ImageSqIcon,
  InfoIcon,
  MicrophoneIcon,
  PhoneIcon,
  SendIcon,
  SmileyIcon,
  VideoIcon,
} from "./icons";

export function Phone({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <figure className={`phone ${className}`} aria-label={label}>
      <div className="phone-screen">
        <span className="phone-island" aria-hidden="true" />
        <div className="phone-status" aria-hidden="true">
          <span>9:41</span>
          <span>5G</span>
        </div>
        {children}
      </div>
    </figure>
  );
}

function Avatar({
  letter,
  tone,
  ring = false,
  size = 32,
}: {
  letter: string;
  tone: string;
  ring?: boolean;
  size?: number;
}) {
  return (
    <span
      className={`ig-avatar ${ring ? "ig-avatar-ring" : ""}`}
      style={{ width: size, height: size, background: tone }}
      aria-hidden="true"
    >
      <span style={{ fontSize: size * 0.42 }}>{letter}</span>
    </span>
  );
}

export function PostGraphic({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`ig-graphic ${compact ? "ig-graphic-compact" : ""}`}
      role="img"
      aria-label="Post graphic: Comment GUIDE below and I’ll send you the link."
    >
      <span className="ig-graphic-sun" aria-hidden="true" />
      <span className="ig-graphic-arch" aria-hidden="true" />
      <span className="ig-graphic-kicker">New drop</span>
      <span className="ig-graphic-title">
        Comment GUIDE below and I’ll send you the link.
      </span>
      <span className="ig-graphic-pill">Keyword: GUIDE</span>
    </div>
  );
}

function Comment({
  name,
  tone,
  text,
  time,
  owner = false,
  liked = false,
}: {
  name: string;
  tone: string;
  text: string;
  time: string;
  owner?: boolean;
  liked?: boolean;
}) {
  return (
    <div className="ig-comment">
      <Avatar letter={name[0].toUpperCase()} tone={tone} size={28} />
      <div className="ig-comment-body">
        <p>
          <strong>{name}</strong>
          {owner && <em className="ig-creator">Creator</em>} {text}
        </p>
        <span>
          {time} · Reply
        </span>
      </div>
      {liked ? (
        <HeartFillIcon className="ig-like ig-like-on" />
      ) : (
        <HeartIcon className="ig-like" />
      )}
    </div>
  );
}

/** Feed post with the comments underneath. */
export function InstagramPost({ showReply = true }: { showReply?: boolean }) {
  return (
    <Phone
      label="Instagram post from sunday.studio with comments asking for the guide"
      className="phone-post"
    >
      <div className="ig">
        <div className="ig-header">
          <Avatar letter="S" tone="#5b4636" ring />
          <div className="ig-header-text">
            <strong>sunday.studio</strong>
            <span>Instagram</span>
          </div>
          <DotsIcon />
        </div>
        <PostGraphic />
        <div className="ig-actions">
          <HeartIcon />
          <CommentIcon />
          <SendIcon />
          <BookmarkIcon className="ig-actions-end" />
        </div>
        <div className="ig-caption">
          <strong>sunday.studio</strong> New drop. Comment GUIDE below and I’ll
          send you the link.
        </div>
        <div className="ig-comments">
          <Comment
            name="maya.creates"
            tone="#7a5c8a"
            text="GUIDE! need this 😍"
            time="2m"
          />
          <Comment
            name="jordan.wells"
            tone="#4a6b73"
            text="GUIDE please"
            time="1m"
          />
          {showReply && (
            <Comment
              name="sunday.studio"
              tone="#5b4636"
              text="@maya.creates Sent! Check your DMs."
              time="Just now"
              owner
              liked
            />
          )}
        </div>
      </div>
    </Phone>
  );
}

export function DmHeader({ name = "sunday.studio" }: { name?: string }) {
  return (
    <div className="dm-header">
      <CaretLeftIcon />
      <Avatar letter={name[0].toUpperCase()} tone="#5b4636" size={32} />
      <div className="dm-header-text">
        <strong>{name}</strong>
        <span>Active now</span>
      </div>
      <PhoneIcon />
      <VideoIcon />
      <InfoIcon />
    </div>
  );
}

export function DmComposer() {
  return (
    <div className="dm-composer" aria-hidden="true">
      <span className="dm-composer-cam">
        <CameraIcon />
      </span>
      <span className="dm-composer-input">Message...</span>
      <MicrophoneIcon />
      <ImageSqIcon />
      <SmileyIcon />
    </div>
  );
}

function CardMessage({
  children,
  buttons,
}: {
  children: ReactNode;
  buttons: string[];
}) {
  return (
    <div className="dm-card">
      <p>{children}</p>
      <div className="dm-card-buttons">
        {buttons.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

/** The DM a commenter receives, including a tracked link button. */
export function InstagramDm({ followGate = false }: { followGate?: boolean }) {
  return (
    <Phone
      label="Instagram direct message from sunday.studio with a link button"
      className="phone-dm"
    >
      <div className="ig dm">
        <DmHeader />
        <div className="dm-thread">
          <div className="dm-time">Today 9:41 AM</div>
          <div className="dm-reply-ref">
            <span>sunday.studio replied to your comment</span>
            <em>“GUIDE! need this 😍”</em>
          </div>
          {followGate ? (
            <>
              <CardMessage buttons={["I’m following"]}>
                Hey maya.creates! Follow @sunday.studio, then tap below and
                I’ll send the link.
              </CardMessage>
              <div className="dm-out">I’m following</div>
            </>
          ) : null}
          <CardMessage buttons={["Shop the new drop"]}>
            Hey maya.creates! Here’s the link 👇
          </CardMessage>
        </div>
        <DmComposer />
      </div>
    </Phone>
  );
}

/** A DM screen without the phone frame, used inside feature cards. */
export function DmPanel({ children }: { children: ReactNode }) {
  return (
    <div className="dm-panel">
      <DmHeader />
      <div className="dm-panel-thread">{children}</div>
      <DmComposer />
    </div>
  );
}

/** Compact bubble stack used inside feature cards (no phone frame). */
export function DmBubbles({
  variant,
}: {
  variant: "buttons" | "follow" | "story";
}) {
  if (variant === "story") {
    return (
      <div className="dm-mini">
        <div className="dm-story-ref">
          <span>You replied to their story</span>
          <span className="dm-story-thumb" aria-hidden="true">
            <i />
            <b />
          </span>
        </div>
        <div className="dm-in">GUIDE</div>
        <CardMessage buttons={["Shop the new drop"]}>
          Hey maya.creates! Here’s the link 👇
        </CardMessage>
      </div>
    );
  }
  if (variant === "follow") {
    return (
      <div className="dm-mini">
        <CardMessage buttons={["I’m following"]}>
          Follow @sunday.studio, then tap below and I’ll send the link.
        </CardMessage>
        <div className="dm-out">I’m following</div>
        <CardMessage buttons={["Shop the new drop"]}>
          Thanks for following! Here’s the link 👇
        </CardMessage>
      </div>
    );
  }
  return (
    <div className="dm-mini">
      <div className="dm-reply-ref">
        <span>sunday.studio replied to your comment</span>
        <em>“GUIDE! need this 😍”</em>
      </div>
      <CardMessage buttons={["Shop the new drop", "Read the guide"]}>
        Hey maya.creates! Here’s the link 👇
      </CardMessage>
    </div>
  );
}

/** Instagram inbox list, used for the inbox feature. */
export function InboxList() {
  const rows = [
    ["M", "maya.creates", "Thanks! Got it 🙌", "2m", "#7a5c8a", true],
    ["J", "jordan.wells", "Is this still in stock?", "14m", "#4a6b73", true],
    ["T", "tessa.lin", "You: Here’s the link 👇", "1h", "#8a5c4a", false],
    ["R", "rafael.n", "Sent a reel", "3h", "#5c7a4a", false],
  ] as const;
  return (
    <div className="inbox-mini">
      <div className="inbox-mini-head">
        <strong>Messages</strong>
        <span>Primary</span>
      </div>
      {rows.map(([letter, name, preview, time, tone, unread]) => (
        <div key={name} className="inbox-row">
          <Avatar letter={letter} tone={tone} size={36} />
          <div>
            <strong>{name}</strong>
            <span className={unread ? "inbox-unread" : ""}>{preview}</span>
          </div>
          <time>{time}</time>
          {unread && <i aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}
