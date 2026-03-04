export type ActionCode = "VALIDATION" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "UNKNOWN";

export type ActionResult<T> =
  | { ok: true; data: T; message?: string }
  | { ok: false; code: ActionCode; error: string };

export const actionOk = <T>(data: T, message?: string): ActionResult<T> => ({ ok: true, data, message });
export const actionErr = (error: string, code: ActionCode = "UNKNOWN"): ActionResult<never> => ({
  ok: false,
  code,
  error
});

export async function safeAction<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    return actionErr(e instanceof Error ? e.message : "Unexpected server error");
  }
}
