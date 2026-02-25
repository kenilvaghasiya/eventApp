import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventWithVenues } from "@/db/types";

type EventRowData = {
  id: string;
  user_id: string;
  name: string;
  sport_type: string;
  event_at: string;
  description: string | null;
  image_url: string | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
};

type VenueRowData = {
  id: string;
  user_id: string;
  name: string;
  address: string;
  created_at: string;
  updated_at: string;
};

type EventVenueRowData = {
  event_id: string;
  venue_id: string;
};

type SportRowData = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export const DEFAULT_SPORT_TYPES = ["Soccer", "Basketball", "Tennis", "Cricket", "Baseball", "Volleyball"];

export async function getEvents(params?: { search?: string; sport?: string; date?: string; location?: string }) {
  const supabase = (await createSupabaseServerClient()) as unknown as SupabaseClient;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return [] as EventWithVenues[];
  }

  let query = supabase
    .from("events")
    .select("id, user_id, name, sport_type, event_at, description, image_url, image_path, created_at, updated_at")
    .eq("user_id", user.id)
    .order("event_at", { ascending: true });

  if (params?.sport) {
    query = query.eq("sport_type", params.sport);
  }

  const { data: events, error } = await query;

  if (error || !events) {
    return [] as EventWithVenues[];
  }

  const eventRows = events as EventRowData[];
  const eventIds = eventRows.map((event) => event.id);
  if (eventIds.length === 0) {
    return eventRows.map((event) => ({ ...event, venues: [] })) as EventWithVenues[];
  }

  const { data: eventVenueRows } = await supabase
    .from("event_venues")
    .select("event_id, venue_id")
    .in("event_id", eventIds);

  const typedEventVenueRows = (eventVenueRows ?? []) as EventVenueRowData[];
  const venueIds = Array.from(new Set(typedEventVenueRows.map((row) => row.venue_id)));

  const { data: venues } = venueIds.length
    ? await supabase.from("venues").select("id, user_id, name, address, created_at, updated_at").in("id", venueIds)
    : { data: [] };

  const typedVenues = (venues ?? []) as VenueRowData[];
  const venueById = new Map(typedVenues.map((venue) => [venue.id, venue]));

  const venuesByEvent = new Map<string, VenueRowData[]>();
  typedEventVenueRows.forEach((row) => {
    const venue = venueById.get(row.venue_id);
    if (!venue) return;
    const list = venuesByEvent.get(row.event_id) ?? [];
    list.push(venue);
    venuesByEvent.set(row.event_id, list);
  });

  let results = eventRows.map((event) => ({ ...event, venues: venuesByEvent.get(event.id) ?? [] })) as EventWithVenues[];

  if (params?.search) {
    const term = params.search.toLowerCase();
    results = results.filter((event) => event.name.toLowerCase().includes(term));
  }

  if (params?.date) {
    const dateTerm = params.date;
    results = results.filter((event) => event.event_at.startsWith(dateTerm));
  }

  if (params?.location) {
    const locationTerm = params.location.toLowerCase();
    results = results.filter((event) =>
      event.venues.some(
        (venue) =>
          venue.name.toLowerCase().includes(locationTerm) || venue.address.toLowerCase().includes(locationTerm)
      )
    );
  }

  return results;
}

export async function getEventById(id: string) {
  const events = await getEvents();
  return events.find((event) => event.id === id) ?? null;
}

export async function getSportTypes() {
  const events = await getEvents();
  return Array.from(new Set(events.map((event) => event.sport_type))).sort();
}

export async function getSportOptions() {
  const supabase = (await createSupabaseServerClient()) as unknown as SupabaseClient;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return DEFAULT_SPORT_TYPES;
  }

  const [{ data: sportsRows }, events] = await Promise.all([
    supabase.from("sports").select("id, user_id, name, created_at").eq("user_id", user.id).order("name"),
    getEvents()
  ]);

  const fromSportsTable = ((sportsRows ?? []) as SportRowData[]).map((row) => row.name);
  const fromEvents = events.map((event) => event.sport_type);
  return Array.from(new Set([...DEFAULT_SPORT_TYPES, ...fromSportsTable, ...fromEvents])).sort((a, b) =>
    a.localeCompare(b)
  );
}
