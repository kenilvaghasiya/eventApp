import { format } from "date-fns";

export function formatEventDate(input: string): string {
  return format(new Date(input), "PPP p");
}
