import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
const mod = isMac ? "⌘" : "Ctrl";

const shortcuts = [
  { keys: [mod, "F"], action: "Focus search" },
  { keys: ["↑", "/", "↓"], action: "Navigate bookmarks" },
  { keys: ["Enter"], action: "Open / copy bookmark" },
  { keys: [mod, "C"], action: "Copy" },
  { keys: [mod, "E"], action: "Rename" },
  { keys: [mod, "⌫"], action: "Delete" },
  { keys: ["Esc"], action: "Exit selection" },
  { keys: [mod, "A"], action: "Select all" },
  { keys: ["Space"], action: "Toggle select" },
] as const;

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.action}
              className="flex items-center justify-between py-1"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.action}
              </span>
              <KbdGroup>
                {shortcut.keys.map((key) =>
                  key === "/" ? (
                    <span key={key} className="text-xs text-muted-foreground">
                      /
                    </span>
                  ) : (
                    <Kbd key={key}>{key}</Kbd>
                  ),
                )}
              </KbdGroup>
            </div>
          ))}
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
