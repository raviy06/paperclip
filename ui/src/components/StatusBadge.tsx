import type { CSSProperties } from "react";
import { cn } from "../lib/utils";
import {
  statusBadge,
  statusBadgeClassic,
  statusBadgeDefault,
  agentStatusColor,
  agentStatusColorDefault,
  agentStatusBadge,
  agentStatusCapsule,
  agentStatusMotion,
  brandChipBadge,
  issueStatusColor,
  issueStatusColorDefault,
  agentStatusVar,
  agentStatusVarDefault,
  taskStatusVar,
  taskStatusVarDefault,
  projectStatusVar,
  projectStatusVarDefault,
} from "../lib/status-colors";
import { useConferenceRoomChatEnabled } from "../hooks/useConferenceRoomChatEnabled";
import { useTaskStatusIconsEnabled } from "../hooks/useTaskStatusIconsEnabled";
import { StatusGlyph } from "./StatusGlyph";

/** Inline `--sc` local var pointing a status helper at a base-hue CSS var. */
function scStyle(cssVar: string): CSSProperties {
  return { "--sc": `var(${cssVar})` } as CSSProperties;
}

/** "in_review" → "In review" (sentence case for PAP-239 chips). */
function sentenceCaseStatus(status: string): string {
  const s = status.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function StatusBadge({ status }: { status: string }) {
  // PAP-75 brand hues for issue statuses (todo/in_progress) ship behind the
  // Conference Room Chat flag (PAP-139); OFF keeps master's palette. Non-issue
  // entries are identical in both records.
  const { enabled: conferenceRoomChatEnabled } = useConferenceRoomChatEnabled();
  const palette = conferenceRoomChatEnabled ? statusBadge : statusBadgeClassic;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shrink-0",
        palette[status] ?? statusBadgeDefault
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

/**
 * Agent status chip — brand `.task-chip` (1px border, light/dark variants).
 * Distinct from the shared {@link StatusBadge} so the agents section can carry
 * the brand state colours without affecting run/issue/goal badges. `active`
 * renders as "idle" (alias for dead code).
 *
 * PAP-199 / PAP-239 (3c): when the Task status icons flag is ON, recolour from
 * the editable `--status-agent-*` base hue via the `.status-chip` helper. Flag
 * OFF = master's fixed brand classes, byte-for-byte.
 */
export function AgentStatusBadge({ status }: { status: string }) {
  const { enabled: taskStatusIconsEnabled } = useTaskStatusIconsEnabled();
  const label = status === "active" ? "idle" : status;
  if (taskStatusIconsEnabled) {
    const cssVar = agentStatusVar[status] ?? agentStatusVarDefault;
    return (
      <span
        className="status-chip inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium leading-none whitespace-nowrap shrink-0"
        style={scStyle(cssVar)}
      >
        {label.replace(/_/g, " ")}
      </span>
    );
  }
  const color = agentStatusColor[status] ?? agentStatusColorDefault;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium leading-none whitespace-nowrap shrink-0",
        agentStatusBadge[color]
      )}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}

/**
 * Agent status indicator — brand heartbeat capsule (vertical 8x16, r4). Running
 * agents pulse, broken (error) agents blink; both honor `prefers-reduced-motion`.
 *
 * PAP-199 / PAP-239 (3c): flag ON fills from the editable `--status-agent-*`
 * base hue via `.status-fill`; flag OFF = master's fixed brand classes.
 */
export function AgentStatusCapsule({ status }: { status: string }) {
  const { enabled: taskStatusIconsEnabled } = useTaskStatusIconsEnabled();
  const motion = agentStatusMotion[status] ?? "";
  if (taskStatusIconsEnabled) {
    const cssVar = agentStatusVar[status] ?? agentStatusVarDefault;
    return (
      <span
        aria-hidden
        className={cn("status-fill inline-block h-4 w-2 rounded-[4px] shrink-0", motion)}
        style={scStyle(cssVar)}
      />
    );
  }
  const color = agentStatusColor[status] ?? agentStatusColorDefault;
  return (
    <span
      aria-hidden
      className={cn("inline-block h-4 w-2 rounded-[4px] shrink-0", agentStatusCapsule[color], motion)}
    />
  );
}

/**
 * Brand status glyph (12px) for the issue/task chip — paths lifted verbatim
 * from the PAP-75 `status-reference.html` guide (12px, `currentColor`). The
 * `in_progress` ring is half-filled (liveness), `done` is a filled circle with
 * a knocked-out check, `in_review` a ring + centre dot, `blocked` a ring + bar.
 *
 * PAP-239 (3c): when the Task status icons flag is ON, the bespoke 12px paths
 * are replaced by the unified {@link StatusGlyph}; OFF keeps today's chip glyph.
 */
export function IssueStatusGlyph({ status }: { status: string }) {
  const { enabled: taskStatusIconsEnabled } = useTaskStatusIconsEnabled();
  if (taskStatusIconsEnabled) {
    return <StatusGlyph status={status} size="sm" />;
  }
  const svgProps = {
    viewBox: "0 0 12 12",
    className: "h-3 w-3 shrink-0",
    "aria-hidden": true,
  } as const;

  switch (status) {
    case "todo":
      return (
        <svg {...svgProps}>
          <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case "in_progress":
      return (
        <svg {...svgProps}>
          <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6 1.5 A4.5 4.5 0 0 1 6 10.5 Z" fill="currentColor" />
        </svg>
      );
    case "in_review":
      return (
        <svg {...svgProps}>
          <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="6" cy="6" r="2" fill="currentColor" />
        </svg>
      );
    case "done":
      return (
        <svg {...svgProps}>
          <circle cx="6" cy="6" r="5" fill="currentColor" />
          <path
            d="M3.5 6 5.5 8 8.5 4.5"
            fill="none"
            className="stroke-background"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "blocked":
      return (
        <svg {...svgProps}>
          <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <rect x="3.5" y="5.2" width="5" height="1.6" rx="0.4" fill="currentColor" />
        </svg>
      );
    case "cancelled":
      return (
        <svg {...svgProps}>
          <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M3 9 9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "backlog":
    default:
      return (
        <svg {...svgProps}>
          <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" />
        </svg>
      );
  }
}

/**
 * Issue/task status chip — brand `.task-chip` (1px border, 12px glyph,
 * light/dark), the same surface used by projects + agents. Maps the 7
 * `ISSUE_STATUSES` onto PAP-75 brand colours (todo → amber, in_progress → blue
 * "liveness", in_review → violet, done → green, blocked → red,
 * backlog/cancelled → gray). Each chip carries its glyph; `cancelled` is struck
 * through. Distinct from the shared {@link StatusBadge} so run/goal/approval
 * badges are unaffected.
 *
 * PAP-239 (3c): when the Task status icons flag is ON the chip is unified —
 * recoloured from the editable `--status-task-*` base hue via `.status-chip`,
 * sentence-cased label, regular weight, and the shared {@link StatusGlyph}.
 * Flag OFF keeps master's behaviour exactly: the PAP-75 brand chip behind the
 * Conference Room Chat flag, or the plain {@link StatusBadge} when that is OFF.
 */
export function IssueStatusBadge({ status }: { status: string }) {
  const { enabled: conferenceRoomChatEnabled } = useConferenceRoomChatEnabled();
  const { enabled: taskStatusIconsEnabled } = useTaskStatusIconsEnabled();

  if (taskStatusIconsEnabled) {
    const cssVar = taskStatusVar[status] ?? taskStatusVarDefault;
    return (
      <span
        className={cn(
          "status-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-normal leading-none whitespace-nowrap shrink-0",
          status === "cancelled" && "line-through"
        )}
        style={scStyle(cssVar)}
      >
        <IssueStatusGlyph status={status} />
        {sentenceCaseStatus(status)}
      </span>
    );
  }

  // Conference Room Chat flag OFF (PAP-139): fall back to the plain master
  // badge — same markup master rendered at this badge's call sites.
  const color = issueStatusColor[status] ?? issueStatusColorDefault;
  if (!conferenceRoomChatEnabled) {
    return <StatusBadge status={status} />;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium leading-none whitespace-nowrap shrink-0",
        brandChipBadge[color],
        status === "cancelled" && "line-through"
      )}
    >
      <IssueStatusGlyph status={status} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

/**
 * Project status chip (PAP-199) — borderless soft badge, the shape master used
 * for project status, but recolored from the editable `--status-project-*` base
 * hues so the status colour system drives it. Ships under the `taskStatusIcons`
 * flag (only flagged call sites use it). Mirrors the generic {@link StatusBadge}
 * layout; only the colour source differs.
 */
export function ProjectStatusBadge({ status }: { status: string }) {
  const cssVar = projectStatusVar[status] ?? projectStatusVarDefault;
  return (
    <span
      className="status-soft inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shrink-0"
      style={scStyle(cssVar)}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
