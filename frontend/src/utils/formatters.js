const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2
});

const currencyFormatters = new Map();

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatNumber(value, suffix = "", fallback = "-") {
  const parsed = toFiniteNumber(value);
  if (parsed === null) {
    return fallback;
  }

  return `${numberFormatter.format(parsed)}${suffix}`;
}

export function formatCurrency(value, currencyCode = "USD", fallback = "-") {
  const parsed = toFiniteNumber(value);
  if (parsed === null) {
    return fallback;
  }

  if (!currencyFormatters.has(currencyCode)) {
    currencyFormatters.set(
      currencyCode,
      new Intl.NumberFormat(currencyCode === "TRY" ? "tr-TR" : "en-US", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    );
  }

  return currencyFormatters.get(currencyCode).format(parsed);
}
