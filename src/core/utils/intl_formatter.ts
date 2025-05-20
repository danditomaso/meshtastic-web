export const numFormatter = (
  locale: Intl.LocaleOptions["language"] = "en-US",
  options: Intl.NumberFormatOptions = {},
) =>
  new Intl.NumberFormat(locale, {
    useGrouping: false,
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
    ...options,
  });

export const pluralFormatter = (
  locale: Intl.LocaleOptions["language"] = "en-US",
  options: Intl.PluralRulesOptions = {},
) =>
  new Intl.PluralRules(locale, {
    type: "cardinal",
    ...options,
  });
