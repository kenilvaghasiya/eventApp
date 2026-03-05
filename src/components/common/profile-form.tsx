"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { updateProfileAction, uploadProfileAvatarAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { profileSchema, type ProfileInput } from "@/lib/validations";

type Props = {
  defaults: ProfileInput;
  avatarUrl?: string | null;
};

const timezoneOptions = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC"
];

export function ProfileForm({ defaults, avatarUrl = null }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isAvatarPending, startAvatarTransition] = useTransition();
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const router = useRouter();

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults
  });

  const onSubmit = (values: ProfileInput) => {
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Profile updated");
      router.refresh();
    });
  };

  const currentTz = form.watch("timezone") ?? "";
  const selectOptions = timezoneOptions.includes(currentTz) || !currentTz ? timezoneOptions : [currentTz, ...timezoneOptions];
  const previewUrl = selectedAvatar ? URL.createObjectURL(selectedAvatar) : avatarUrl;

  const onAvatarSubmit = () => {
    if (!selectedAvatar) {
      toast.error("Please choose an image first.");
      return;
    }

    startAvatarTransition(async () => {
      const formData = new FormData();
      formData.set("avatar", selectedAvatar);
      const result = await uploadProfileAvatarAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Profile image updated.");
      setSelectedAvatar(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <p className="mb-3 text-sm font-medium text-slate-700">Profile Image</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-20 w-20 overflow-hidden rounded-full border bg-white">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Profile avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-slate-400">
                {defaults.displayName?.slice(0, 1).toUpperCase() || "U"}
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="file"
              accept="image/*"
              className="h-11 rounded-xl"
              onChange={(event) => setSelectedAvatar(event.target.files?.[0] ?? null)}
            />
            <Button type="button" onClick={onAvatarSubmit} disabled={isAvatarPending || !selectedAvatar} className="rounded-xl">
              {isAvatarPending ? "Uploading..." : "Upload Image"}
            </Button>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" className="h-11 rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <FormControl>
                  <Select className="h-11 rounded-xl" {...field}>
                    <option value="">Select timezone</option>
                    {selectOptions.map((timezone) => (
                      <option key={timezone} value={timezone}>
                        {timezone}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea rows={5} className="rounded-xl" placeholder="Write a short intro about yourself..." {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end">
          <Button type="submit" disabled={isPending} className="min-w-32 rounded-xl">
            {isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
        </form>
      </Form>
    </div>
  );
}
