import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const venueSchema = z.object({
  name: z.string().min(2, "Venue name is required"),
  address: z.string().min(3, "Venue address is required")
});

export const eventSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Event name is required"),
  sportType: z.string().min(2, "Sport type is required"),
  eventAt: z.string().min(1, "Date and time are required"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  imagePath: z.string().optional(),
  venues: z.array(venueSchema).min(1, "At least one venue is required")
});

export type AuthInput = z.infer<typeof authSchema>;
export type EventInput = z.infer<typeof eventSchema>;
