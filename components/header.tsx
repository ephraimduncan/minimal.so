"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronsUpDown, Plus, Check, Trash2 } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { type GroupItem } from "@/lib/schema";

interface HeaderProps {
  groups: GroupItem[];
  selectedGroup: GroupItem;
  onSelectGroup: (id: string) => void;
  onCreateGroup: (name: string) => void;
  onDeleteGroup?: (id: string) => void;
  userName: string;
}

export function Header({
  groups,
  selectedGroup,
  onSelectGroup,
  onCreateGroup,
  onDeleteGroup,
  userName,
}: HeaderProps) {
  const router = useRouter();
  const [newGroupName, setNewGroupName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [holdingGroupId, setHoldingGroupId] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartRef = useRef<number>(0);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim());
      setNewGroupName("");
      setDialogOpen(false);
    }
  };

  const cancelHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    setHoldingGroupId(null);
    setHoldProgress(0);
  }, []);

  const startHold = useCallback(
    (groupId: string) => {
      if (groups.length <= 1) return;
      setHoldingGroupId(groupId);
      holdStartRef.current = Date.now();

      const updateProgress = () => {
        const elapsed = Date.now() - holdStartRef.current;
        const progress = Math.min((elapsed / 2000) * 100, 100);
        setHoldProgress(progress);

        if (progress >= 100) {
          onDeleteGroup?.(groupId);
          cancelHold();
        } else {
          holdTimerRef.current = setTimeout(updateProgress, 16);
        }
      };

      holdTimerRef.current = setTimeout(updateProgress, 16);
    },
    [groups.length, onDeleteGroup, cancelHold]
  );

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-2">
        <BmrksLogo />
        <span className="text-muted-foreground">/</span>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-xl" asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: selectedGroup.color }}
              />
              <span>{selectedGroup.name}</span>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-48 space-y-1 rounded-xl"
          >
            {groups.map((group) => (
              <DropdownMenuItem
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={cn(
                  "flex items-center justify-between rounded-lg",
                  group.id === selectedGroup.id && "bg-accent"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span>{group.name}</span>
                </div>
                {group.id === selectedGroup.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {group.bookmarkCount ?? 0}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="rounded-lg w-full"
                >
                  <Plus className="h-4 w-4 mr-0" />
                  Create Group
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Group</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateGroup();
                  }}
                  className="flex flex-col gap-4"
                >
                  <Input
                    placeholder="Enter group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    autoFocus
                  />
                  <Button type="submit" disabled={!newGroupName.trim()}>
                    Create
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            {groups.length > 1 && (
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onMouseDown={() => startHold(selectedGroup.id)}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={() => startHold(selectedGroup.id)}
                onTouchEnd={cancelHold}
                className="relative overflow-hidden text-destructive focus:text-destructive rounded-lg"
              >
                {holdingGroupId === selectedGroup.id && (
                  <div
                    className="absolute inset-0 bg-destructive/20"
                    style={{ width: `${holdProgress}%` }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  {holdingGroupId === selectedGroup.id
                    ? "Hold to delete..."
                    : "Delete Group"}
                </span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-xl" asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <UserAvatar name={userName} />
            <span>{userName}</span>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-2xl">
          <DropdownMenuItem className="rounded-lg">Settings</DropdownMenuItem>
          <DropdownMenuItem className="rounded-lg" onClick={handleSignOut}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

function BmrksLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Logo"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12.432 17.949c.863 1.544 2.589 1.976 4.13 1.112c1.54 -.865 1.972 -2.594 1.048 -4.138c-.185 -.309 -.309 -.556 -.494 -.74c.247 .06 .555 .06 .925 .06c1.726 0 2.959 -1.234 2.959 -2.963c0 -1.73 -1.233 -2.965 -3.02 -2.965c-.37 0 -.617 0 -.925 .062c.185 -.185 .308 -.432 .493 -.74c.863 -1.545 .431 -3.274 -1.048 -4.138c-1.541 -.865 -3.205 -.433 -4.13 1.111c-.185 .309 -.308 .556 -.432 .803c-.123 -.247 -.246 -.494 -.431 -.803c-.802 -1.605 -2.528 -2.038 -4.007 -1.173c-1.541 .865 -1.973 2.594 -1.048 4.137c.185 .31 .308 .556 .493 .741c-.246 -.061 -.555 -.061 -.924 -.061c-1.788 0 -3.021 1.235 -3.021 2.964c0 1.729 1.233 2.964 3.02 2.964" />
      <path d="M4.073 21c4.286 -2.756 5.9 -5.254 7.927 -9" />
    </svg>
  );
}

function UserAvatar({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" width="24" height="24">
      <rect width="32" height="32" rx="16" fill="#74B06F" />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="500"
      >
        {name.charAt(0).toUpperCase()}
      </text>
    </svg>
  );
}
