import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function getFileName(path: unknown): string {
  if (typeof path !== "string") return "";
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

export function getToolLabel(toolInvocation: ToolInvocation): string {
  const { toolName, args } = toolInvocation;

  if (toolName === "str_replace_editor") {
    const command = args.command as string | undefined;
    const fileName = getFileName(args.path);

    switch (command) {
      case "create":
        return fileName ? `Creating ${fileName}` : "Creating file";
      case "str_replace":
        return fileName ? `Editing ${fileName}` : "Editing file";
      case "insert":
        return fileName ? `Editing ${fileName}` : "Inserting into file";
      case "view":
        return fileName ? `Reading ${fileName}` : "Reading file";
      case "undo_edit":
        return fileName ? `Undoing changes to ${fileName}` : "Undoing edit";
      default:
        return fileName ? `Modifying ${fileName}` : toolName;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const isComplete = toolInvocation.state === "result" && toolInvocation.result;
  const label = getToolLabel(toolInvocation);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
