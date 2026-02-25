export const EVENT_IMAGE_BUCKET = "event-images";
export const EVENT_IMAGE_FOLDER = "events";

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, "-").toLowerCase();
}

export function buildEventImagePath(userId: string, filename: string) {
  const safeName = sanitizeFilename(filename);
  return `${userId}/${EVENT_IMAGE_FOLDER}/${Date.now()}-${safeName}`;
}
