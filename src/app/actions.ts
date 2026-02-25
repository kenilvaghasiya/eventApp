"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSafeAction, err, ok, type ActionResult } from "@/lib/action";
import { getPexelsImageByQuery } from "@/lib/pexels";
import { EVENT_IMAGE_BUCKET, buildEventImagePath } from "@/lib/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authSchema, eventSchema, type AuthInput, type EventInput } from "@/lib/validations";

type EventVenueLink = { venue_id: string };
type EventImageRow = { image_path: string | null };

function toUserFriendlyError(message: string, fallback: string) {
  const text = message.toLowerCase();

  if (text.includes("invalid input value for enum")) return "Please choose a valid sport type.";
  if (text.includes("duplicate key")) return "This item already exists. Please try a different value.";
  if (text.includes("violates row-level security")) return "You do not have permission to perform this action.";
  if (text.includes("jwt") || text.includes("not authenticated")) return "Your session expired. Please login again.";
  if (text.includes("invalid login credentials")) return "Invalid email or password. Please try again.";
  if (text.includes("email not confirmed")) return "Please verify your email before logging in.";
  if (text.includes("network")) return "Network issue detected. Please try again.";

  return fallback;
}

export async function signUpAction(input: AuthInput): Promise<ActionResult<null>> {
  return createSafeAction(async () => {
    const parsed = authSchema.safeParse(input);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Invalid form values", "VALIDATION_ERROR");
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password
    });

    if (error) {
      return err(toUserFriendlyError(error.message, "We could not create your account right now."), "UNKNOWN");
    }

    return ok(null, "Account created. Please check your inbox to verify your email.");
  });
}

export async function loginAction(input: AuthInput): Promise<ActionResult<null>> {
  return createSafeAction(async () => {
    const parsed = authSchema.safeParse(input);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Invalid form values", "VALIDATION_ERROR");
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password
    });

    if (error) {
      return err(toUserFriendlyError(error.message, "Login failed. Please check your credentials."), "UNAUTHORIZED");
    }

    return ok(null, "Welcome back.");
  });
}

export async function loginWithGoogleAction(): Promise<ActionResult<{ url: string }>> {
  return createSafeAction(async () => {
    const supabase = await createSupabaseServerClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
    });

    if (error || !data.url) {
      return err(toUserFriendlyError(error?.message ?? "", "Unable to initialize Google sign-in."), "UNKNOWN");
    }

    return ok({ url: data.url });
  });
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}

export async function uploadEventImageAction(formData: FormData): Promise<ActionResult<{ imageUrl: string; imagePath: string }>> {
  return createSafeAction(async () => {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return err("Please login again", "UNAUTHORIZED");
    }

    const image = formData.get("image");
    if (!(image instanceof File)) {
      return err("Image file is required", "VALIDATION_ERROR");
    }

    if (image.size > 5 * 1024 * 1024) {
      return err("Image must be up to 5MB", "VALIDATION_ERROR");
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      return err("Only JPG, PNG, and WEBP images are allowed", "VALIDATION_ERROR");
    }

    const imagePath = buildEventImagePath(user.id, image.name);
    const { error: uploadError } = await supabase.storage.from(EVENT_IMAGE_BUCKET).upload(imagePath, image, {
      cacheControl: "3600",
      upsert: false
    });

    if (uploadError) {
      return err(toUserFriendlyError(uploadError.message, "Image upload failed. Please try another image."), "UNKNOWN");
    }

    const { data } = supabase.storage.from(EVENT_IMAGE_BUCKET).getPublicUrl(imagePath);
    return ok({ imageUrl: data.publicUrl, imagePath }, "Image uploaded");
  });
}

async function saveEventToDatabase(input: EventInput): Promise<ActionResult<{ id: string }>> {
  const supabase = (await createSupabaseServerClient()) as unknown as SupabaseClient;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return err("Please login again", "UNAUTHORIZED");
  }

  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid event form values", "VALIDATION_ERROR");
  }

  const payload = {
    user_id: user.id,
    name: parsed.data.name,
    sport_type: parsed.data.sportType.trim(),
    event_at: new Date(parsed.data.eventAt).toISOString(),
    description: parsed.data.description?.trim() || null,
    image_url: parsed.data.imageUrl?.trim() || null,
    image_path: parsed.data.imagePath?.trim() || null
  };

  if (!payload.image_url) {
    const fallbackImage = await getPexelsImageByQuery(`${payload.name} ${payload.sport_type} event`);
    if (fallbackImage) {
      payload.image_url = fallbackImage;
      payload.image_path = null;
    }
  }

  const normalizedSportType = payload.sport_type;

  const { data: existingSportType } = await supabase
    .from("sports")
    .select("id")
    .eq("user_id", user.id)
    .ilike("name", normalizedSportType)
    .maybeSingle();

  if (!existingSportType) {
    await supabase.from("sports").insert({
      user_id: user.id,
      name: normalizedSportType
    });
  }

  let eventId: string | undefined = parsed.data.id;

  if (eventId) {
    const { data: previousEvent } = await supabase
      .from("events")
      .select("image_path")
      .eq("id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: previousJoinRows } = await supabase.from("event_venues").select("venue_id").eq("event_id", eventId);

    const { error } = await supabase.from("events").update(payload).eq("id", eventId).eq("user_id", user.id);

    if (error) {
      return err(toUserFriendlyError(error.message, "We could not update this event."), "UNKNOWN");
    }

    const { error: deleteJoinError } = await supabase.from("event_venues").delete().eq("event_id", eventId);
    if (deleteJoinError) {
      return err(toUserFriendlyError(deleteJoinError.message, "We could not refresh venue links for this event."), "UNKNOWN");
    }

    const oldVenueIds = ((previousJoinRows ?? []) as EventVenueLink[]).map((row) => row.venue_id);
    if (oldVenueIds.length) {
      await supabase.from("venues").delete().in("id", oldVenueIds).eq("user_id", user.id);
    }

    const oldImagePath = (previousEvent as EventImageRow | null)?.image_path;
    if (oldImagePath && oldImagePath !== payload.image_path) {
      await supabase.storage.from(EVENT_IMAGE_BUCKET).remove([oldImagePath]);
    }
  } else {
    const { data, error } = await supabase.from("events").insert(payload).select("id").single();

    if (error || !data) {
      return err(toUserFriendlyError(error?.message ?? "", "We could not create this event."), "UNKNOWN");
    }

    eventId = data.id;
  }

  for (const venue of parsed.data.venues) {
    const { data: venueData, error: venueError } = await supabase
      .from("venues")
      .insert({
        user_id: user.id,
        name: venue.name,
        address: venue.address
      })
      .select("id")
      .single();

    if (venueError || !venueData) {
      return err(toUserFriendlyError(venueError?.message ?? "", "We could not save one of the venues."), "UNKNOWN");
    }

    const { error: joinError } = await supabase.from("event_venues").insert({
      event_id: eventId,
      venue_id: venueData.id
    });

    if (joinError) {
      return err(toUserFriendlyError(joinError.message, "We could not link a venue to this event."), "UNKNOWN");
    }
  }

  if (!eventId) {
    return err("Unable to persist event id", "UNKNOWN");
  }

  revalidatePath("/dashboard");
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/edit`);

  return ok({ id: eventId }, parsed.data.id ? "Event updated" : "Event created");
}

export async function createEventAction(input: EventInput): Promise<ActionResult<{ id: string }>> {
  return createSafeAction(async () => saveEventToDatabase(input));
}

export async function updateEventAction(input: EventInput): Promise<ActionResult<{ id: string }>> {
  return createSafeAction(async () => {
    if (!input.id) {
      return err("Missing event id", "VALIDATION_ERROR");
    }
    return saveEventToDatabase(input);
  });
}

export async function deleteEventAction(eventId: string): Promise<ActionResult<null>> {
  return createSafeAction(async () => {
    const supabase = (await createSupabaseServerClient()) as unknown as SupabaseClient;
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return err("Please login again", "UNAUTHORIZED");
    }

    const [{ data: joinRows }, { data: eventRow }] = await Promise.all([
      supabase.from("event_venues").select("venue_id").eq("event_id", eventId),
      supabase.from("events").select("image_path").eq("id", eventId).eq("user_id", user.id).maybeSingle()
    ]);

    const { error: deleteJoinError } = await supabase.from("event_venues").delete().eq("event_id", eventId);
    if (deleteJoinError) {
      return err(toUserFriendlyError(deleteJoinError.message, "We could not remove venue links for this event."), "UNKNOWN");
    }

    const { error: deleteEventError } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId)
      .eq("user_id", user.id);

    if (deleteEventError) {
      return err(toUserFriendlyError(deleteEventError.message, "We could not delete this event."), "UNKNOWN");
    }

    const venueIds = ((joinRows ?? []) as EventVenueLink[]).map((row) => row.venue_id);
    if (venueIds.length) {
      await supabase.from("venues").delete().in("id", venueIds).eq("user_id", user.id);
    }

    const imagePath = (eventRow as EventImageRow | null)?.image_path;
    if (imagePath) {
      await supabase.storage.from(EVENT_IMAGE_BUCKET).remove([imagePath]);
    }

    revalidatePath("/dashboard");
    return ok(null, "Event deleted");
  });
}
