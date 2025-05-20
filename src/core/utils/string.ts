import { numFormatter, pluralFormatter } from "./intl_formatter.ts";

interface PluralForms {
  one: string;
  other: string;
  [key: string]: string;
}

interface FormatOptions {
  locale?: string;
  pluralRules?: Intl.PluralRulesOptions;
  numberFormat?: Intl.NumberFormatOptions;
}

export function formatQuantity(
  value: number,
  forms: PluralForms,
  options: FormatOptions = {},
) {
  const {
    locale = "en-US",
    pluralRules: pluralOptions = { type: "cardinal" },
    numberFormat: numberOptions = {},
  } = options;

  const pluralRules = pluralFormatter(locale, pluralOptions);
  const numberFormat = numFormatter(locale, numberOptions);

  const pluralCategory = pluralRules.select(value);
  const word = forms[pluralCategory];

  return `${numberFormat.format(value)} ${word}`;
}

export interface LengthValidationResult {
  isValid: boolean;
  currentLength: number | null;
}

export function validateMaxByteLength(
  value: string | null | undefined,
  maxByteLength: number,
): LengthValidationResult {
  if (
    typeof maxByteLength !== "number" || !Number.isInteger(maxByteLength) ||
    maxByteLength < 0
  ) {
    console.warn(
      "validateMaxByteLength: maxByteLength must be a non-negative integer.",
    );
    return { isValid: false, currentLength: null }; // Cannot validate with invalid limit
  }

  if (value === null || value === undefined) {
    return { isValid: false, currentLength: null };
  }

  if (typeof TextEncoder === "undefined") {
    console.error(
      "validateMaxByteLength: TextEncoder API is not available in this environment.",
    );
    return { isValid: false, currentLength: null }; // Cannot determine byte length
  }

  try {
    const encoder = new TextEncoder();
    const currentLength = encoder.encode(value).length;
    const isValid = currentLength <= maxByteLength;

    return { isValid, currentLength };
  } catch (error) {
    console.error("validateMaxByteLength: Error encoding string:", error);
    return { isValid: false, currentLength: null }; // Encoding failed
  }
}
