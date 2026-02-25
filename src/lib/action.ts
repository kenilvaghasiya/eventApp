export type ActionErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNKNOWN";

export type ActionResult<TData = void> =
  | { ok: true; data: TData; message?: string }
  | { ok: false; error: string; code: ActionErrorCode };

export function ok<TData>(data: TData, message?: string): ActionResult<TData> {
  return { ok: true, data, message };
}

export function err(error: string, code: ActionErrorCode = "UNKNOWN"): ActionResult<never> {
  return { ok: false, error, code };
}

export async function createSafeAction<TData>(
  action: () => Promise<ActionResult<TData>>
): Promise<ActionResult<TData>> {
  try {
    return await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return err(message, "UNKNOWN");
  }
}
