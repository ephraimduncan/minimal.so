"use client";

import {
  useState,
  useCallback,
  useRef,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client";
import { client, orpc } from "@/lib/orpc";
import {
  isExtensionAvailable,
  sendExtensionMessage,
} from "@/lib/extension";
import type { ImportBookmarksResponse } from "@/lib/schema";
import type { ProfileData } from "@/components/dashboard-content";
import { ChromeIcon } from "@/components/chrome-icon";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form } from "@/components/ui/form";
import { Field, FieldLabel } from "@/components/ui/field";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  IconCheck,
  IconX,
  IconLoader2,
  IconCopy,
  IconExternalLink,
  IconDownload,
  IconKey,
  IconRefresh,
  IconTrash,
  IconAlertTriangle,
  IconCreditCard,
  IconRocket,
} from "@tabler/icons-react";
import { ImagePlusIcon } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usernameSchema, updateProfileSchema } from "@/lib/schema";
import { Badge } from "@/components/ui/badge";
import { hasActiveProAccess } from "@/lib/plan-limits";
import { startCheckout } from "@/lib/checkout";

const ACCEPTED_AVATAR_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const MAX_AVATAR_FILE_SIZE_BYTES = 2 * 1024 * 1024;

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
  profile?: ProfileData;
  onExport?: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  user,
  profile,
  onExport,
}: SettingsDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.image);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewOnceKey, setViewOnceKey] = useState<string | null>(null);
  const hasProAccess = hasActiveProAccess(
    profile?.plan,
    profile?.subscriptionStatus,
    profile?.subscriptionCurrentPeriodEnd,
  );

  const [prevOpen, setPrevOpen] = useState(open);
  if (open && !prevOpen) {
    setName(user.name);
    setAvatarUrl(user.image);
    setViewOnceKey(null);
  }
  if (open !== prevOpen) {
    setPrevOpen(open);
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  const handleAvatarUpload = async (file: File) => {
    if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
      toast.error("Only PNG, JPEG, WebP, and GIF files are supported");
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
      toast.error("Avatar must be 2MB or smaller");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw await responseError(response, "Failed to upload avatar");

      const data = (await response.json()) as { url?: string };
      if (!data.url) throw new Error("Invalid upload response");

      setAvatarUrl(data.url);
      toast.success("Avatar updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await handleAvatarUpload(file);
    event.target.value = "";
  };

  const handleAvatarRemove = async () => {
    setIsUploading(true);
    try {
      const response = await fetch("/api/avatar", { method: "DELETE" });

      if (!response.ok) throw await responseError(response, "Failed to remove avatar");

      setAvatarUrl(null);
      toast.success("Avatar removed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove avatar");
    } finally {
      setIsUploading(false);
    }
  };

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

    posthog.capture("settings_updated");
    toast.success("Name updated");
    onOpenChange(false);
    router.refresh();
  };

  const handleImportBookmarks = async () => {
    if (!hasProAccess) {
      toast.error("Import is a Pro feature. Upgrade to unlock browser import.");
      return;
    }

    if (!isExtensionAvailable()) {
      toast.error("Install the Chrome extension to import bookmarks", {
        action: {
          label: "Get Extension",
          onClick: () => window.open("/chrome", "_blank"),
        },
      });
      return;
    }

    setIsImporting(true);
    const loadingId = toast.loading("Importing browser bookmarks...");

    try {
      const result =
        await sendExtensionMessage<ImportBookmarksResponse>({
          type: "import-bookmarks",
        });

      if (!result.success) {
        if (result.status === 401) {
          toast.error("Please log in to import bookmarks");
        } else {
          toast.error(result.message || "Failed to import bookmarks. Please try again.");
        }
        return;
      }

      const parts = [`Imported ${result.importedCount} bookmarks into '${result.groupName}'`];
      const skippedTotal = result.skippedCount ?? 0;
      if (skippedTotal > 0) {
        parts.push(`Skipped ${skippedTotal} (duplicates/invalid)`);
      }
      toast.success(parts.join(". "));

      queryClient.invalidateQueries({ queryKey: orpc.bookmark.key() });
      queryClient.invalidateQueries({ queryKey: orpc.group.key() });
    } catch {
      toast.error("Failed to import bookmarks. Please try again.");
    } finally {
      toast.dismiss(loadingId);
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your account settings.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general" onValueChange={() => setViewOnceKey(null)}>
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="profile">Public Profile</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Form
              className="space-y-4 pt-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveName();
              }}
            >
              <Field>
                <FieldLabel>Profile Picture</FieldLabel>
                <div className="flex items-center gap-3">
                  <div className="group relative">
                    <Avatar
                      size="lg"
                      className="overflow-hidden *:data-[slot=avatar-image]:transition-[filter] *:data-[slot=avatar-fallback]:transition-[filter] sm:group-hover:*:data-[slot=avatar-image]:blur-sm sm:group-hover:*:data-[slot=avatar-fallback]:blur-sm"
                    >
                      <AvatarImage
                        src={avatarUrl ?? undefined}
                        alt={name || user.name}
                      />
                      <AvatarFallback>{initial}</AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      disabled={isUploading}
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 hover:bg-black/55 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-100 cursor-pointer outline-none"
                      onClick={
                        avatarUrl
                          ? handleAvatarRemove
                          : () => fileInputRef.current?.click()
                      }
                    >
                      <AvatarOverlayIcon
                        isUploading={isUploading}
                        hasAvatar={!!avatarUrl}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload a photo
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleAvatarChange}
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="duncan"
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
                  <ChromeIcon size={20} />
                  <span>Get the Chrome Extension</span>
                </a>
              </Field>
              <Field>
                <FieldLabel>Data</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {onExport && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onExport}
                    >
                      Export Bookmarks
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isImporting || !hasProAccess}
                    onClick={handleImportBookmarks}
                  >
                    {isImporting ? (
                      <>
                        <IconLoader2 className="size-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <IconDownload className="size-4" />
                        Import Browser Bookmarks
                        {!hasProAccess ? (
                          <Badge
                            variant="outline"
                            className="ml-1 h-5 rounded-md px-1.5 text-[10px]"
                          >
                            Pro
                          </Badge>
                        ) : null}
                      </>
                    )}
                  </Button>
                </div>
              </Field>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" />}>
                  Cancel
                </DialogClose>
                <Button
                  type="submit"
                  disabled={isSaving || isUploading || !name.trim()}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </Form>
          </TabsContent>
          <TabsContent value="profile">
            {profile && <ProfileTab profile={profile} onOpenChange={onOpenChange} />}
          </TabsContent>
          <TabsContent value="api">
            <ApiKeyTab viewOnceKey={viewOnceKey} onKeyGenerated={setViewOnceKey} />
          </TabsContent>
          <TabsContent value="billing">
            {profile && <BillingTab profile={profile} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface ProfileTabProps {
  profile: ProfileData;
  onOpenChange: (open: boolean) => void;
}

function ProfileTab({ profile, onOpenChange }: ProfileTabProps) {
  const router = useRouter();

  const [username, setUsername] = useState(profile.username ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [github, setGithub] = useState(profile.github ?? "");
  const [twitter, setTwitter] = useState(profile.twitter ?? "");
  const [website, setWebsite] = useState(
    profile.website?.replace(/^https?:\/\//, "") ?? "",
  );
  const [isProfilePublic, setIsProfilePublic] = useState(
    profile.isProfilePublic,
  );
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const markDirty = (field: string) => {
    setDirtyFields((prev) => new Set(prev).add(field));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const debouncedUsername = useDebounce(username, 400);
  const usernameParseResult = usernameSchema.safeParse(debouncedUsername);
  const isUsernameValid =
    debouncedUsername.length > 0 && usernameParseResult.success;

  const availabilityQuery = useQuery({
    ...orpc.profile.checkUsername.queryOptions({
      input: { username: debouncedUsername },
    }),
    enabled: isUsernameValid,
    staleTime: 10_000,
  });

  const usernameStatus = getStatus(
    username,
    debouncedUsername,
    usernameParseResult,
    availabilityQuery,
  );

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof client.profile.update>[0]) =>
      client.profile.update(data),
    onSuccess: () => {
      posthog.capture("settings_updated");
      toast.success("Profile updated");
      onOpenChange(false);
      router.refresh();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update profile");
    },
  });

  const handleSubmit = () => {
    if (username && usernameStatus !== "available") return;

    const originalWebsite = profile.website?.replace(/^https?:\/\//, "") ?? "";
    const hasChanges =
      username !== (profile.username ?? "") ||
      bio !== (profile.bio ?? "") ||
      github !== (profile.github ?? "") ||
      twitter !== (profile.twitter ?? "") ||
      website !== originalWebsite ||
      isProfilePublic !== profile.isProfilePublic;

    if (!hasChanges) {
      onOpenChange(false);
      return;
    }

    const payload = {
      username: username || null,
      bio: bio || null,
      github: github || null,
      twitter: twitter || null,
      website: website || null,
      isProfilePublic,
    };

    const result = updateProfileSchema.safeParse(payload);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0]?.toString();
        if (field && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    updateMutation.mutate(result.data);
  };

  const handleCopyLink = useCallback(() => {
    if (username) {
      navigator.clipboard.writeText(`${window.location.origin}/u/${username}`);
      toast.success("Link copied");
    }
  }, [username]);

  return (
    <Form
      className="space-y-4 pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <Field>
        <div className="flex items-center justify-between">
          <FieldLabel>Public Profile</FieldLabel>
          <Switch
            checked={isProfilePublic}
            onCheckedChange={setIsProfilePublic}
            size="sm"
          />
        </div>
      </Field>
      <Field>
        <FieldLabel>Username</FieldLabel>
        <div className="relative">
          <Input
            value={username}
            onChange={(e) => {
              markDirty("username");
              const newValue = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "");
              if (newValue && !username && !isProfilePublic) {
                setIsProfilePublic(true);
              }
              setUsername(newValue);
            }}
            placeholder="duncan"
            type="text"
            className="pr-8"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <UsernameStatusIcon status={usernameStatus} />
          </div>
        </div>
        {dirtyFields.has("username") &&
          username &&
          usernameStatus === "invalid" && (
            <p className="text-xs text-destructive mt-1">
              {usernameParseResult.error?.issues[0]?.message}
            </p>
          )}
        {dirtyFields.has("username") &&
          username &&
          usernameStatus === "taken" && (
            <p className="text-xs text-destructive mt-1">Username is taken</p>
          )}
      </Field>
      <Field>
        <FieldLabel>Bio</FieldLabel>
        <Textarea
          value={bio}
          onChange={(e) => {
            markDirty("bio");
            setBio(e.target.value);
          }}
          placeholder="Building cool things on the web"
          rows={2}
          maxLength={160}
          className="resize-none"
        />
        {fieldErrors.bio && (
          <p className="text-xs text-destructive mt-1">{fieldErrors.bio}</p>
        )}
      </Field>
      <Field>
        <FieldLabel>GitHub</FieldLabel>
        <Input
          value={github}
          onChange={(e) => {
            markDirty("github");
            setGithub(e.target.value);
          }}
          placeholder="ephraimduncan"
          type="text"
        />
        {fieldErrors.github && (
          <p className="text-xs text-destructive mt-1">{fieldErrors.github}</p>
        )}
      </Field>
      <Field>
        <FieldLabel>X (Twitter)</FieldLabel>
        <Input
          value={twitter}
          onChange={(e) => {
            markDirty("twitter");
            setTwitter(e.target.value);
          }}
          placeholder="ephraimduncan"
          type="text"
        />
        {fieldErrors.twitter && (
          <p className="text-xs text-destructive mt-1">{fieldErrors.twitter}</p>
        )}
      </Field>
      <Field>
        <FieldLabel>Website</FieldLabel>
        <div className="flex">
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-2 text-sm text-muted-foreground">
            https://
          </span>
          <Input
            value={website}
            onChange={(e) => {
              markDirty("website");
              setWebsite(e.target.value.replace(/^https?:\/\//, ""));
            }}
            placeholder="ephraimduncan.com"
            type="text"
            className="rounded-l-none px-2"
          />
        </div>
        {fieldErrors.website && (
          <p className="text-xs text-destructive mt-1">{fieldErrors.website}</p>
        )}
      </Field>
      {username && usernameStatus === "available" && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleCopyLink}
          >
            <IconCopy className="h-3.5 w-3.5" />
            Copy Profile Link
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => window.open(`/u/${username}`, "_blank")}
          >
            <IconExternalLink className="h-3.5 w-3.5" />
            Preview Profile
          </Button>
        </div>
      )}
      <DialogFooter>
        <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
        <Button
          type="submit"
          disabled={
            updateMutation.isPending ||
            (!!username && usernameStatus !== "available")
          }
        >
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </Form>
  );
}

interface ApiKeyTabProps {
  viewOnceKey: string | null;
  onKeyGenerated: (key: string | null) => void;
}

function ApiKeyTab({ viewOnceKey, onKeyGenerated }: ApiKeyTabProps) {
  const queryClient = useQueryClient();
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  const apiKeyQuery = useQuery({
    ...orpc.apiKey.get.queryOptions({ input: undefined }),
  });

  const generateMutation = useMutation({
    mutationFn: () => client.apiKey.generate(undefined),
    onSuccess: (data) => {
      onKeyGenerated(data.key);
      queryClient.invalidateQueries({ queryKey: orpc.apiKey.key() });
      toast.success("API key generated");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate API key");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: () => client.apiKey.revoke(undefined),
    onSuccess: () => {
      onKeyGenerated(null);
      queryClient.invalidateQueries({ queryKey: orpc.apiKey.key() });
      toast.success("API key revoked");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to revoke API key");
    },
  });

  const handleCopyKey = useCallback(async () => {
    if (!viewOnceKey) return;
    try {
      await navigator.clipboard.writeText(viewOnceKey);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, [viewOnceKey]);

  const handleRevoke = () => {
    setShowRevokeConfirm(false);
    revokeMutation.mutate();
  };

  const existingKey = apiKeyQuery.data;
  const isLoading = apiKeyQuery.isPending;
  const hasKey = !!existingKey;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // View-once: key was just generated
  if (viewOnceKey) {
    return (
      <div className="space-y-4 pt-2">
        <div className="rounded-lg border border-amber-500/30 bg-amber-50/50 p-3 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <IconAlertTriangle className="size-4 shrink-0" />
            <p className="text-sm font-medium">
              Copy your key now. It won&apos;t appear again.
            </p>
          </div>
        </div>
        <Field>
          <FieldLabel>API Key</FieldLabel>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md border bg-muted px-2 font-mono text-xs h-7 flex items-center">
              {viewOnceKey}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={handleCopyKey}
            >
              <IconCopy className="size-3.5" />
            </Button>
          </div>
        </Field>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => setShowRevokeConfirm(true)}
            disabled={revokeMutation.isPending}
          >
            {revokeMutation.isPending ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconTrash className="size-4" />
            )}
            Revoke
          </Button>
        </div>
        <RevokeConfirmDialog
          open={showRevokeConfirm}
          onOpenChange={setShowRevokeConfirm}
          onConfirm={handleRevoke}
        />
      </div>
    );
  }

  // No key state
  if (!hasKey) {
    return (
      <div className="space-y-4 pt-2">
        <div className="flex flex-col items-center justify-center gap-3 py-6">
          <div className="rounded-full border bg-muted p-3">
            <IconKey className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No API key generated</p>
          <Button
            type="button"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <IconLoader2 className="size-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <IconKey className="size-4" />
                Generate API Key
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Key exists (normal view): show masked prefix, dates, actions
  return (
    <div className="space-y-4 pt-2">
      <Field>
        <FieldLabel>API Key</FieldLabel>
        <code className="block rounded-md border bg-muted px-3 py-2 font-mono text-sm text-muted-foreground">
          {existingKey.keyPrefix}••••••••
        </code>
      </Field>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Created</p>
          <p>{formatDate(existingKey.createdAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Last used</p>
          <p>{existingKey.lastUsedAt ? formatRelativeDate(existingKey.lastUsedAt) : "Never"}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <IconLoader2 className="size-4 animate-spin" />
          ) : (
            <IconRefresh className="size-4" />
          )}
          Regenerate
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive"
          onClick={() => setShowRevokeConfirm(true)}
          disabled={revokeMutation.isPending}
        >
          {revokeMutation.isPending ? (
            <IconLoader2 className="size-4 animate-spin" />
          ) : (
            <IconTrash className="size-4" />
          )}
          Revoke
        </Button>
      </div>
      <RevokeConfirmDialog
        open={showRevokeConfirm}
        onOpenChange={setShowRevokeConfirm}
        onConfirm={handleRevoke}
      />
    </div>
  );
}

function RevokeConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to revoke your API key? Any applications using
            this key will lose access immediately. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Revoke Key
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}

function BillingTab({ profile }: { profile: ProfileData }) {
  const [isBillingPending, setIsBillingPending] = useState(false);

  const hasProAccess = hasActiveProAccess(
    profile.plan,
    profile.subscriptionStatus,
    profile.subscriptionCurrentPeriodEnd,
  );

  const isCancelled =
    profile.subscriptionStatus === "canceled" && hasProAccess;

  const isFree = !hasProAccess;

  const handleUpgrade = () => {
    const billingCycle =
      process.env.NEXT_PUBLIC_DEFAULT_BILLING_CYCLE === "monthly"
        ? ("monthly" as const)
        : ("yearly" as const);
    setIsBillingPending(true);
    startCheckout({ billingCycle, source: "settings_billing" }).finally(() =>
      setIsBillingPending(false),
    );
  };

  const handleManageBilling = async () => {
    setIsBillingPending(true);
    try {
      const { error } = await authClient.customer.portal({ redirect: true });
      if (error) {
        toast.error(error.message || "Unable to open billing portal");
      }
    } finally {
      setIsBillingPending(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <p className="text-sm font-medium">Current Plan</p>
        <div className="flex items-center gap-2">
          {hasProAccess ? (
            <Badge
              variant="outline"
              className="h-5 rounded-md px-1.5 text-[10px]"
            >
              Pro
            </Badge>
          ) : (
            <span className="text-sm text-foreground">Free</span>
          )}
        </div>
      </div>
      {hasProAccess && !isCancelled && profile.subscriptionCurrentPeriodEnd && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Next Renewal</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(profile.subscriptionCurrentPeriodEnd)}
          </p>
        </div>
      )}
      {isCancelled && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Subscription Ending</p>
          <p className="text-sm text-muted-foreground">
            Pro until {formatDate(profile.subscriptionCurrentPeriodEnd)}
          </p>
          <p className="text-xs text-muted-foreground">
            Your subscription will not renew after this date.
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {isFree && (
          <Button
            variant="default"
            className="h-8 rounded-lg gap-1.5"
            onClick={handleUpgrade}
            disabled={isBillingPending}
          >
            {isBillingPending ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconRocket className="h-4 w-4" />
            )}
            Upgrade to Pro
          </Button>
        )}
        {hasProAccess && (
          <Button
            variant="outline"
            className="h-8 rounded-lg gap-1.5"
            onClick={handleManageBilling}
            disabled={isBillingPending}
          >
            {isBillingPending ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconCreditCard className="h-4 w-4" />
            )}
            Manage Billing
          </Button>
        )}
      </div>
    </div>
  );
}

async function responseError(
  response: Response,
  fallback: string,
): Promise<Error> {
  const data = (await response.json().catch(() => null)) as {
    message?: string;
  } | null;
  return new Error(data?.message ?? fallback);
}

function AvatarOverlayIcon({
  isUploading,
  hasAvatar,
}: {
  isUploading: boolean;
  hasAvatar: boolean;
}) {
  if (isUploading) return <IconLoader2 className="size-4 animate-spin" />;
  if (hasAvatar) return <IconX className="size-4" />;
  return <ImagePlusIcon className="size-4" />;
}

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function getStatus(
  username: string,
  debouncedUsername: string,
  parseResult: ReturnType<typeof usernameSchema.safeParse>,
  availabilityQuery: { isPending: boolean; data?: unknown },
): UsernameStatus {
  if (!username) return "idle";
  if (!parseResult.success) return "invalid";
  if (username !== debouncedUsername) return "checking";
  if (availabilityQuery.isPending) return "checking";
  const data = availabilityQuery.data as { available?: boolean } | undefined;
  if (data?.available) return "available";
  return "taken";
}

function UsernameStatusIcon({ status }: { status: UsernameStatus }) {
  switch (status) {
    case "checking":
      return (
        <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      );
    case "available":
      return <IconCheck className="h-4 w-4 text-green-600" />;
    case "taken":
      return <IconX className="h-4 w-4 text-destructive" />;
    default:
      return null;
  }
}

