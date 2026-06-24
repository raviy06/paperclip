// @vitest-environment node

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AgentStatusBadge,
  IssueStatusBadge,
  IssueStatusGlyph,
  ProjectStatusBadge,
  StatusBadge,
} from "./StatusBadge";
import {
  agentStatusVar,
  brandChipBadge,
  issueStatusColor,
  projectStatusVar,
  statusBadgeClassic,
  taskStatusVar,
} from "../lib/status-colors";

// The brand chips ship behind the Conference Room Chat experimental flag
// (PAP-139). These suites were written against the NUX UI, so the flag is
// seeded ON; the classic-fallback suite below flips it OFF.
const conferenceRoomChatFlag = vi.hoisted(() => ({ enabled: true }));
vi.mock("../hooks/useConferenceRoomChatEnabled", () => ({
  useConferenceRoomChatEnabled: () => ({ enabled: conferenceRoomChatFlag.enabled, loaded: true }),
}));

// PAP-234 Option A: the whole status colour system (status-chip/var recolours +
// unified glyph) is gated behind the Task status icons flag. Seeded OFF so the
// parity suites lock today's master look; the flag-ON suites flip it on.
const taskStatusIconsFlag = vi.hoisted(() => ({ enabled: false }));
vi.mock("../hooks/useTaskStatusIconsEnabled", () => ({
  useTaskStatusIconsEnabled: () => ({ enabled: taskStatusIconsFlag.enabled, loaded: true }),
}));

afterEach(() => {
  conferenceRoomChatFlag.enabled = true;
  taskStatusIconsFlag.enabled = false;
});

/**
 * PAP-234 parity: with the Task status icons flag OFF, IssueStatusBadge must
 * reproduce master byte-for-byte — the PAP-75 brand chip when Conference Room
 * Chat is ON, the plain StatusBadge when it is OFF. No status-chip / var.
 */
describe("IssueStatusBadge — Task status icons flag OFF (master parity)", () => {
  it("maps each issue status to its PAP-75 brand colour token (no status-chip)", () => {
    const cases: Record<string, keyof typeof brandChipBadge> = {
      backlog: "gray",
      todo: "amber",
      in_progress: "blue",
      in_review: "violet",
      done: "green",
      blocked: "red",
      cancelled: "gray",
    };
    for (const [status, color] of Object.entries(cases)) {
      expect(issueStatusColor[status]).toBe(color);
      const html = renderToStaticMarkup(<IssueStatusBadge status={status} />);
      expect(html).not.toContain("status-chip");
      expect(html).not.toContain("var(--status-task-");
      expect(html).toContain("border");
      expect(html).toContain(brandChipBadge[color].split(" ")[0]); // light bg hex
      expect(html).toContain('viewBox="0 0 12 12"'); // bespoke 12px chip glyph
      expect(html).toContain(status.replace(/_/g, " "));
    }
  });

  it("uses liveness blue for in_progress and amber for todo", () => {
    expect(renderToStaticMarkup(<IssueStatusBadge status="in_progress" />)).toContain("#DBEAFE");
    expect(renderToStaticMarkup(<IssueStatusBadge status="todo" />)).toContain("#FEF3C7");
  });

  it("falls back to the plain master badge when CRC is also OFF", () => {
    conferenceRoomChatFlag.enabled = false;
    const html = renderToStaticMarkup(<IssueStatusBadge status="in_progress" />);
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("status-chip");
    expect(html).toBe(renderToStaticMarkup(<StatusBadge status="in_progress" />));
    expect(html).toContain(statusBadgeClassic.in_progress!.split(" ")[0]); // bg-yellow-100
  });
});

/**
 * PAP-199 / PAP-234: with the flag ON, issue chips carry the unified glyph and
 * are recolored from the editable `--status-task-*` base hue via `.status-chip`.
 */
describe("IssueStatusBadge — flag ON", () => {
  it("wires each issue status to its --status-task-* base hue", () => {
    taskStatusIconsFlag.enabled = true;
    for (const [status, cssVar] of Object.entries(taskStatusVar)) {
      const html = renderToStaticMarkup(<IssueStatusBadge status={status} />);
      expect(html).toContain("status-chip");
      expect(html).toContain("border");
      expect(html).toContain(`var(${cssVar})`);
      expect(html).toContain("<svg");
    }
  });

  it("points in_progress at the blue liveness var and todo at the amber var", () => {
    taskStatusIconsFlag.enabled = true;
    expect(renderToStaticMarkup(<IssueStatusBadge status="in_progress" />)).toContain("var(--status-task-in_progress)");
    expect(renderToStaticMarkup(<IssueStatusBadge status="todo" />)).toContain("var(--status-task-todo)");
  });

  it("sentence-cases the label, drops to regular weight, uses the 24-unit glyph", () => {
    taskStatusIconsFlag.enabled = true;
    const html = renderToStaticMarkup(<IssueStatusBadge status="in_review" />);
    expect(html).toContain("In review");
    expect(html).not.toContain("In Review"); // sentence case, not title case
    expect(html).toContain("font-normal");
    expect(html).not.toContain("font-medium");
    expect(html).toContain('viewBox="0 0 24 24"');
  });

  it("strikes through cancelled chips", () => {
    taskStatusIconsFlag.enabled = true;
    expect(renderToStaticMarkup(<IssueStatusBadge status="cancelled" />)).toContain("line-through");
  });

  it("falls back to the backlog (gray) var for unknown statuses", () => {
    taskStatusIconsFlag.enabled = true;
    expect(renderToStaticMarkup(<IssueStatusBadge status="mystery" />)).toContain("var(--status-task-backlog)");
  });

  it("renders the unified chip even when Conference Room Chat is OFF", () => {
    conferenceRoomChatFlag.enabled = false;
    taskStatusIconsFlag.enabled = true;
    const html = renderToStaticMarkup(<IssueStatusBadge status="todo" />);
    expect(html).toContain("status-chip");
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain("Todo");
  });
});

/** PAP-199: project status chips recolor from the `--status-project-*` hues. */
describe("ProjectStatusBadge", () => {
  it("wires each project status to its --status-project-* base hue", () => {
    for (const [status, cssVar] of Object.entries(projectStatusVar)) {
      const html = renderToStaticMarkup(<ProjectStatusBadge status={status} />);
      expect(html).toContain("status-soft");
      expect(html).toContain(`var(${cssVar})`);
      expect(html).toContain(status.replace(/_/g, " "));
    }
  });

  it("falls back to the backlog (gray) var for unknown statuses", () => {
    expect(renderToStaticMarkup(<ProjectStatusBadge status="mystery" />)).toContain("var(--status-project-backlog)");
  });
});

/** PAP-199 / PAP-234: agent chips recolor only when the flag is ON. */
describe("AgentStatusBadge", () => {
  it("keeps master's fixed brand classes (no status-chip) when the flag is OFF", () => {
    const html = renderToStaticMarkup(<AgentStatusBadge status="running" />);
    expect(html).not.toContain("status-chip");
    expect(html).not.toContain("var(--status-agent-running)");
  });

  it("recolors from the --status-agent-* var via status-chip when the flag is ON", () => {
    taskStatusIconsFlag.enabled = true;
    const html = renderToStaticMarkup(<AgentStatusBadge status="running" />);
    expect(html).toContain("status-chip");
    expect(html).toContain(`var(${agentStatusVar.running})`);
  });
});

describe("StatusBadge — Conference Room Chat flag palettes (PAP-139)", () => {
  it("keeps master's blue todo / yellow in_progress palette when the flag is OFF", () => {
    conferenceRoomChatFlag.enabled = false;
    expect(renderToStaticMarkup(<StatusBadge status="todo" />)).toContain("bg-blue-100");
    expect(renderToStaticMarkup(<StatusBadge status="in_progress" />)).toContain("bg-yellow-100");
  });

  it("uses the brand hues on StatusBadge when the flag is ON", () => {
    expect(renderToStaticMarkup(<StatusBadge status="todo" />)).toContain("bg-amber-100");
    expect(renderToStaticMarkup(<StatusBadge status="in_progress" />)).toContain("bg-blue-100");
  });
});

describe("IssueStatusGlyph", () => {
  it("swaps to the unified 24-unit glyph when the flag is ON", () => {
    taskStatusIconsFlag.enabled = true;
    expect(renderToStaticMarkup(<IssueStatusGlyph status="blocked" />)).toContain('viewBox="0 0 24 24"');
  });

  it("keeps the bespoke 12-unit chip glyph when the flag is OFF", () => {
    expect(renderToStaticMarkup(<IssueStatusGlyph status="blocked" />)).toContain('viewBox="0 0 12 12"');
  });

  it("gives in_progress a half-filled ring (liveness) when OFF", () => {
    expect(renderToStaticMarkup(<IssueStatusGlyph status="in_progress" />)).toContain('d="M6 1.5 A4.5 4.5 0 0 1 6 10.5 Z"');
  });

  it("gives in_review a ring + centre dot (not a clock) when OFF", () => {
    expect(renderToStaticMarkup(<IssueStatusGlyph status="in_review" />)).toContain('r="2"');
  });

  it("gives done a filled circle with a knocked-out check when OFF", () => {
    const html = renderToStaticMarkup(<IssueStatusGlyph status="done" />);
    expect(html).toContain('d="M3.5 6 5.5 8 8.5 4.5"');
    expect(html).toContain("stroke-background");
  });

  it("gives backlog a dashed ring when OFF", () => {
    expect(renderToStaticMarkup(<IssueStatusGlyph status="backlog" />)).toContain('stroke-dasharray="2 2"');
  });

  it("gives cancelled a ring + slash when OFF", () => {
    expect(renderToStaticMarkup(<IssueStatusGlyph status="cancelled" />)).toContain('d="M3 9 9 3"');
  });
});
