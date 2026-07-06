export const SELLER_DEFAULT_MARKUP_PERCENT = 25;

export type SellerShippingContext = {
  flatShippingFee: number;
  freeShippingThreshold: number;
  defaultMarkupPercent: number;
};

export type SellerDeliverySettings = {
  customerPaysDelivery: boolean;
  deliveryFeeZar: number | null;
};

export type SellerPricingSnapshot = {
  costPrice: number;
  markupPercent: number;
  retailPrice: number;
  marginAmount: number;
  marginPercent: number;
  customerDeliveryFee: number;
  customerPaysTotal: number;
  deliveryLabel: string;
};

export function retailFromCost(costPrice: number, markupPercent: number): number {
  return roundCurrency(costPrice * (1 + markupPercent / 100));
}

export function marginFromPrices(costPrice: number, retailPrice: number) {
  const marginAmount = roundCurrency(retailPrice - costPrice);
  const marginPercent = costPrice > 0 ? roundPercent((marginAmount / costPrice) * 100) : 0;
  return { marginAmount, marginPercent };
}

export function markupFromPrices(costPrice: number, retailPrice: number): number {
  if (costPrice <= 0) return 0;
  return roundPercent(((retailPrice - costPrice) / costPrice) * 100);
}

export function resolveCustomerDeliveryFee(
  retailPrice: number,
  delivery: SellerDeliverySettings,
  shipping: Pick<SellerShippingContext, "flatShippingFee" | "freeShippingThreshold">,
): number {
  if (!delivery.customerPaysDelivery) return 0;
  if (retailPrice >= shipping.freeShippingThreshold) return 0;
  return delivery.deliveryFeeZar ?? shipping.flatShippingFee;
}

export function buildPricingSnapshot(
  costPrice: number,
  markupPercent: number,
  delivery: SellerDeliverySettings,
  shipping: SellerShippingContext,
  retailOverride?: number,
): SellerPricingSnapshot {
  const retailPrice = retailOverride ?? retailFromCost(costPrice, markupPercent);
  const { marginAmount, marginPercent } = marginFromPrices(costPrice, retailPrice);
  const customerDeliveryFee = resolveCustomerDeliveryFee(retailPrice, delivery, shipping);
  const customerPaysTotal = roundCurrency(retailPrice + customerDeliveryFee);

  let deliveryLabel = "Included — you cover delivery";
  if (delivery.customerPaysDelivery) {
    deliveryLabel =
      customerDeliveryFee === 0
        ? `Free delivery (order over ${formatZar(shipping.freeShippingThreshold)})`
        : `Customer pays ${formatZar(customerDeliveryFee)} delivery`;
  }

  return {
    costPrice,
    markupPercent,
    retailPrice,
    marginAmount,
    marginPercent,
    customerDeliveryFee,
    customerPaysTotal,
    deliveryLabel,
  };
}

export function parseSellerDelivery(metadata: unknown): SellerDeliverySettings {
  if (!metadata || typeof metadata !== "object") {
    return { customerPaysDelivery: true, deliveryFeeZar: null };
  }
  const raw = (metadata as Record<string, unknown>).seller_delivery;
  if (!raw || typeof raw !== "object") {
    return { customerPaysDelivery: true, deliveryFeeZar: null };
  }
  const obj = raw as Record<string, unknown>;
  const fee = typeof obj.fee_zar === "number" ? obj.fee_zar : Number(obj.fee_zar);
  return {
    customerPaysDelivery: obj.customer_pays !== false,
    deliveryFeeZar: Number.isFinite(fee) && fee >= 0 ? fee : null,
  };
}

export function sellerDeliveryMetadata(delivery: SellerDeliverySettings) {
  return {
    seller_delivery: {
      customer_pays: delivery.customerPaysDelivery,
      fee_zar: delivery.deliveryFeeZar,
    },
  };
}

export function aggregateCatalogPricing(products: {
  base_price: number | string;
  retail_price: number | string;
  markup_percent: number | string;
  stock_quantity: number | string;
}[]) {
  if (!products.length) {
    return { avgMarkup: 0, totalMargin: 0, totalRetail: 0, totalCost: 0 };
  }
  const totalCost = products.reduce((sum, p) => sum + Number(p.base_price), 0);
  const totalRetail = products.reduce((sum, p) => sum + Number(p.retail_price), 0);
  const totalMargin = roundCurrency(totalRetail - totalCost);
  const avgMarkup =
    products.reduce((sum, p) => sum + Number(p.markup_percent), 0) / products.length;
  return { avgMarkup: roundPercent(avgMarkup), totalMargin, totalRetail, totalCost };
}

function formatZar(value: number) {
  return `R${value.toFixed(2)}`;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number) {
  return Math.round(value * 10) / 10;
}
