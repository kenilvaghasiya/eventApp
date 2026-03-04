import { format } from "date-fns";

export function formatDateTime(input: string) {
  return format(new Date(input), "PPP p");
}
