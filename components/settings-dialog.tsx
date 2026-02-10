"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { client, orpc } from "@/lib/orpc";
import type { ProfileData } from "@/components/dashboard-content";
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
} from "@tabler/icons-react";
import { ImagePlusIcon } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { usernameSchema, updateProfileSchema } from "@/lib/schema";

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
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.image);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    if (!open) return;
    setName(user.name);
    setAvatarUrl(user.image);
  }, [open, user.name, user.image]);

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

    toast.success("Name updated");
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your account settings.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="profile">Public Profile</TabsTrigger>
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
                  <ChromeIcon />
                  <span>Get the Chrome Extension</span>
                </a>
              </Field>
              {onExport && (
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
              )}
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
