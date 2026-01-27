"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { Field, FieldLabel } from "@/components/ui/field";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    name: string;
    email: string;
  };
  onExport?: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  user,
  onExport,
}: SettingsDialogProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveName = async () => {
    if (name.trim() === user.name) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    const { error } = await authClient.updateUser({ name: name.trim() });
    setIsSaving(false);

    if (error) {
      toast.error("Failed to update name");
      return;
    }

    toast.success("Name updated");
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <Form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveName();
          }}
        >
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your account settings.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              type="text"
            />
          </Field>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input
              value={user.email}
              disabled
              type="email"
              className="text-muted-foreground"
            />
          </Field>
          <Field>
            <FieldLabel>Chrome Extension</FieldLabel>
            <a
              href="/chrome"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChromeIcon />
              <span>Get the Chrome Extension</span>
            </a>
          </Field>
          <Field>
            <FieldLabel>Data</FieldLabel>
            <Button
              type="button"
              variant="outline"
              onClick={onExport}
              className="w-fit"
            >
              Export
            </Button>
          </Field>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ChromeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.17" y1="8" x2="12" y2="8" />
      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
    </svg>
  );
}
