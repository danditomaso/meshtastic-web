import { ZodError, ZodSchema } from "zod";

export function validateSchema<T>(
  schema: ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: ZodError["issues"] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error.issues };
  }
}

interface NumericInputOptions {
  allowDecimal: boolean;
  allowNegative: boolean;
}

export function isAllowedNumericInput(
  event: React.KeyboardEvent<HTMLInputElement>,
  options: NumericInputOptions,
): boolean {
  const key = event.key;
  const inputElement = event.target as HTMLInputElement;
  const currentValue = inputElement.value;
  const selectionStart = inputElement.selectionStart;

  if (
    key.startsWith("Arrow") ||
    key === "Tab" ||
    key === "Backspace" ||
    key === "Delete" ||
    key === "Home" ||
    key === "End" ||
    (event.ctrlKey || event.metaKey)
  ) {
    return true;
  }

  if (key.length === 1 && key >= "0" && key <= "9") {
    return true;
  }

  if (options.allowNegative && key === "-") {
    if (selectionStart === 0 && currentValue.indexOf("-") === -1) {
      return true;
    }
  }

  if (options.allowDecimal && key === ".") {
    if (currentValue.indexOf(".") === -1) {
      return true;
    }
  }

  return false;
}
