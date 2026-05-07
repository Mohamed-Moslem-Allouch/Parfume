type OfferLike = {
  offerType?: string | null;
  offerValue?: number | { toString: () => string } | null;
  offerStart?: Date | string | null;
  offerEnd?: Date | string | null;
};

function toAmount(value: number | { toString: () => string } | null | undefined) {
  if (value == null) return null;
  return typeof value === "number" ? value : Number(value.toString());
}

export function isOfferActive(product: OfferLike, now = new Date()) {
  const value = toAmount(product.offerValue);

  if (!product.offerType || !value || value <= 0) {
    return false;
  }

  const startsAt = product.offerStart ? new Date(product.offerStart) : null;
  const endsAt = product.offerEnd ? new Date(product.offerEnd) : null;

  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;

  return true;
}

export function getOfferPrice(basePrice: number, product: OfferLike, now = new Date()) {
  if (!isOfferActive(product, now)) {
    return basePrice;
  }

  const value = toAmount(product.offerValue) || 0;
  const discounted =
    product.offerType === "PERCENTAGE"
      ? basePrice * (1 - Math.min(value, 100) / 100)
      : basePrice - value;

  return Math.max(0, Math.round(discounted * 1000) / 1000);
}

export function getOfferSummary(product: OfferLike, now = new Date()) {
  const value = toAmount(product.offerValue);

  if (!product.offerType || !value || value <= 0) {
    return null;
  }

  return {
    active: isOfferActive(product, now),
    type: product.offerType,
    value,
    startsAt: product.offerStart ? new Date(product.offerStart).toISOString() : null,
    endsAt: product.offerEnd ? new Date(product.offerEnd).toISOString() : null
  };
}
