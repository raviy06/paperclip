// @vitest-environment node

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StatusIcon } from "./StatusIcon";

// PAP-75 brand hues ship behind the Conference Room Chat experimental flag
// (PAP-139). This suite was written against the NUX UI, so the flag is seeded
// ON; the palette suite at the bottom covers both flag states.
const conferenceRoomChatFlag = vi.hoisted(() => ({ enabled: true }));
vi.mock("../hooks/useConferenceRoomChatEnabled", () => ({
  useConferenceRoomChatEnabled: () => ({ enabled: conferenceRoomChatFlag.enabled, loaded: true }),
}));

// PAP-239 (3c): Task status icons flag. Seeded OFF so the suites above lock
// today's ring; the flag-ON suite at the bottom flips it on.
const taskStatusIconsFlag = vi.hoisted(() => ({ enabled: false }));
vi.mock("../hooks/useTaskStatusIconsEnabled", () => ({
  useTaskStatusIconsEnabled: () => ({ enabled: taskStatusIconsFlag.enabled, loaded: true }),
}));

afterEach(() => {
  conferenceRoomChatFlag.enabled = true;
  taskStatusIconsFlag.enabled = false;
});

describe("StatusIcon — Conference Room Chat flag palettes (PAP-139)", () => {
  it("keeps master's blue todo / yellow in_progress when the flag is OFF", () => {
    conferenceRoomChatFlag.enabled = false;
    expect(renderToStaticMarkup(<StatusIcon status="todo" />)).toContain("text-blue-600");
    expect(renderToStaticMarkup(<StatusIcon status="in_progress" />)).toContain("text-yellow-600");
  });

  it("uses PAP-75 brand hues (todo amber, in_progress blue) when the flag is ON", () => {
    expect(renderToStaticMarkup(<StatusIcon status="todo" />)).toContain("text-amber-600");
    expect(renderToStaticMarkup(<StatusIcon status="in_progress" />)).toContain("text-blue-600");
  });
});

describe("StatusIcon", () => {
  it("renders covered blocked issues with the cyan covered state visual", () => {
    const html = renderToStaticMarkup(
      <StatusIcon
        status="blocked"
        blockerAttention={{
          state: "covered",
          reason: "active_child",
          unresolvedBlockerCount: 1,
          coveredBlockerCount: 1,
          stalledBlockerCount: 0,
          attentionBlockerCount: 0,
          sampleBlockerIdentifier: "PAP-2",
          sampleStalledBlockerIdentifier: null,
        }}
      />,
    );

    expect(html).toContain('data-blocker-attention-state="covered"');
    expect(html).toContain('aria-label="Blocked · waiting on active sub-task PAP-2"');
    expect(html).toContain('title="Blocked · waiting on active sub-task PAP-2"');
    expect(html).toContain("border-cyan-600");
    expect(html).not.toContain("border-red-600");
    expect(html).not.toContain("border-dashed");
    expect(html).toContain("-bottom-0.5");
  });

  it("uses covered blocked copy for the active dependency count matrix", () => {
    const html = renderToStaticMarkup(
      <StatusIcon
        status="blocked"
        blockerAttention={{
          state: "covered",
          reason: "active_dependency",
          unresolvedBlockerCount: 2,
          coveredBlockerCount: 2,
          stalledBlockerCount: 0,
          attentionBlockerCount: 0,
          sampleBlockerIdentifier: null,
          sampleStalledBlockerIdentifier: null,
        }}
      />,
    );

    expect(html).toContain('aria-label="Blocked · covered by 2 active dependencies"');
    expect(html).toContain("border-cyan-600");
    expect(html).not.toContain("border-dashed");
  });

  it("keeps normal blocked issues on the attention-required visual", () => {
    const html = renderToStaticMarkup(
      <StatusIcon
        status="blocked"
        blockerAttention={{
          state: "needs_attention",
          reason: "attention_required",
          unresolvedBlockerCount: 1,
          coveredBlockerCount: 0,
          stalledBlockerCount: 0,
          attentionBlockerCount: 1,
          sampleBlockerIdentifier: "PAP-2",
          sampleStalledBlockerIdentifier: null,
        }}
      />,
    );

    expect(html).not.toContain('data-blocker-attention-state="covered"');
    expect(html).toContain('data-blocker-attention-state="needs_attention"');
    expect(html).toContain('aria-label="Blocked · 1 blocker needs attention"');
    expect(html).toContain("border-red-600");
    expect(html).not.toContain("border-dashed");
  });

  it("shows active covered work on mixed attention-required blockers", () => {
    const html = renderToStaticMarkup(
      <StatusIcon
        status="blocked"
        blockerAttention={{
          state: "needs_attention",
          reason: "attention_required",
          unresolvedBlockerCount: 5,
          coveredBlockerCount: 2,
          stalledBlockerCount: 0,
          attentionBlockerCount: 3,
          sampleBlockerIdentifier: "PAP-3541",
          sampleStalledBlockerIdentifier: null,
        }}
      />,
    );

    expect(html).toContain('data-blocker-attention-state="needs_attention"');
    expect(html).toContain('aria-label="Blocked · 3 blockers need attention; 2 covered by active work"');
    expect(html).toContain("border-red-600");
    expect(html).not.toContain("border-cyan-600");
    expect(html).toContain("bg-cyan-600");
  });

  it("renders stalled review chains with amber visual and stalled-leaf copy", () => {
    const html = renderToStaticMarkup(
      <StatusIcon
        status="blocked"
        blockerAttention={{
          state: "stalled",
          reason: "stalled_review",
          unresolvedBlockerCount: 1,
          coveredBlockerCount: 0,
          stalledBlockerCount: 1,
          attentionBlockerCount: 0,
          sampleBlockerIdentifier: "PAP-2279",
          sampleStalledBlockerIdentifier: "PAP-2279",
        }}
      />,
    );

    expect(html).toContain('data-blocker-attention-state="stalled"');
    expect(html).toContain('aria-label="Blocked · review stalled on PAP-2279"');
    expect(html).toContain("border-amber-600");
    expect(html).not.toContain("border-cyan-600");
    expect(html).not.toContain("border-red-600");
  });
});

describe("StatusIcon — Task status icons flag ON (PAP-239)", () => {
  it("renders the unified StatusGlyph instead of the bespoke ring", () => {
    taskStatusIconsFlag.enabled = true;
    const html = renderToStaticMarkup(<StatusIcon status="in_progress" />);
    expect(html).toContain('viewBox="0 0 24 24"');
    // The legacy ring span (border-2 rounded-full) is gone.
    expect(html).not.toContain("rounded-full border-2");
  });

  it("maps covered-blocked → In queue (blue glyph, no cyan corner dot)", () => {
    taskStatusIconsFlag.enabled = true;
    const html = renderToStaticMarkup(
      <StatusIcon
        status="blocked"
        blockerAttention={{
          state: "covered",
          reason: "active_child",
          unresolvedBlockerCount: 1,
          coveredBlockerCount: 1,
          attentionBlockerCount: 0,
          stalledBlockerCount: 0,
          sampleBlockerIdentifier: "PAP-9",
          sampleStalledBlockerIdentifier: null,
        }}
      />,
    );
    // In queue uses the blocked shape recoloured via the blue in_queue icon var.
    expect(html).toContain("var(--status-task-icon-in_queue)");
    // Bespoke teal/cyan covered markers are retired.
    expect(html).not.toContain("bg-cyan");
    expect(html).not.toContain("border-cyan");
    // Full blocked reason still rides on the accessible label.
    expect(html).toContain("aria-label");
  });

  it("keeps the onChange picker working with the new glyph", () => {
    taskStatusIconsFlag.enabled = true;
    const html = renderToStaticMarkup(<StatusIcon status="todo" onChange={() => {}} />);
    expect(html).toContain('viewBox="0 0 24 24"');
  });
});

describe("StatusIcon — glyph size (PAP-243a)", () => {
  it("forwards size=\"lg\" as a 20px glyph", () => {
    taskStatusIconsFlag.enabled = true;
    const html = renderToStaticMarkup(<StatusIcon status="todo" size="lg" />);
    expect(html).toContain('width="20"');
    expect(html).toContain('height="20"');
  });

  it("defaults to a 16px (md) glyph when size is omitted", () => {
    taskStatusIconsFlag.enabled = true;
    const html = renderToStaticMarkup(<StatusIcon status="todo" />);
    expect(html).toContain('width="16"');
    expect(html).toContain('height="16"');
  });
});
