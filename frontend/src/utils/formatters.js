const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

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

export function formatCurrency(value, fallback = "-") {
  const parsed = toFiniteNumber(value);
  if (parsed === null) {
    return fallback;
  }

  return currencyFormatter.format(parsed);
}

