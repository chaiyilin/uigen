import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

test("getToolLabel returns 'Creating <file>' for create command", () => {
  expect(
    getToolLabel({
      toolCallId: "1",
      toolName: "str_replace_editor",
      args: { command: "create", path: "/src/App.jsx" },
      state: "result",
    })
  ).toBe("Creating App.jsx");
});

test("getToolLabel returns 'Editing <file>' for str_replace command", () => {
  expect(
    getToolLabel({
      toolCallId: "1",
      toolName: "str_replace_editor",
      args: { command: "str_replace", path: "/src/components/Card.jsx" },
      state: "result",
    })
  ).toBe("Editing Card.jsx");
});

test("getToolLabel returns 'Editing <file>' for insert command", () => {
  expect(
    getToolLabel({
      toolCallId: "1",
      toolName: "str_replace_editor",
      args: { command: "insert", path: "/src/utils.ts" },
      state: "result",
    })
  ).toBe("Editing utils.ts");
});

test("getToolLabel returns 'Reading <file>' for view command", () => {
  expect(
    getToolLabel({
      toolCallId: "1",
      toolName: "str_replace_editor",
      args: { command: "view", path: "/src/index.tsx" },
      state: "result",
    })
  ).toBe("Reading index.tsx");
});

test("getToolLabel returns 'Undoing changes to <file>' for undo_edit command", () => {
  expect(
    getToolLabel({
      toolCallId: "1",
      toolName: "str_replace_editor",
      args: { command: "undo_edit", path: "/src/App.jsx" },
      state: "result",
    })
  ).toBe("Undoing changes to App.jsx");
});

test("getToolLabel handles missing path gracefully", () => {
  expect(
    getToolLabel({
      toolCallId: "1",
      toolName: "str_replace_editor",
      args: { command: "create" },
      state: "result",
    })
  ).toBe("Creating file");
});

test("getToolLabel handles unknown command with path", () => {
  expect(
    getToolLabel({
      toolCallId: "1",
      toolName: "str_replace_editor",
      args: { command: "unknown_cmd", path: "/src/test.ts" },
      state: "result",
    })
  ).toBe("Modifying test.ts");
});

test("getToolLabel returns toolName for non-str_replace_editor tools", () => {
  expect(
    getToolLabel({
      toolCallId: "1",
      toolName: "some_other_tool",
      args: {},
      state: "result",
    })
  ).toBe("some_other_tool");
});

// --- ToolInvocationBadge rendering tests ---

test("renders completed badge with green dot", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/src/App.jsx" },
        state: "result",
        result: "File created successfully",
      }}
    />
  );

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  // Green dot should be present
  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).not.toBeNull();
  // Spinner should not be present
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeNull();
});

test("renders in-progress badge with spinner", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/src/Card.jsx" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
  // Spinner should be present
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).not.toBeNull();
  // Green dot should not be present
  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).toBeNull();
});

test("renders in-progress when state is result but result is falsy", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "view", path: "/src/index.tsx" },
        state: "result",
        result: undefined,
      }}
    />
  );

  expect(screen.getByText("Reading index.tsx")).toBeDefined();
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).not.toBeNull();
});
