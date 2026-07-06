import { formatCurrency } from "@/lib/utils/cn";
import {
  buildPricingSnapshot,
  marginFromPrices,
  parseSellerDelivery,
} from "@/lib/seller/product-pricing";
import type { SellerCatalogProduct, SellerCatalogShipping } from "@/types/seller-catalog";

export function formatProductMargin(product: SellerCatalogProduct) {
  const { marginAmount, marginPercent } = marginFromPrices(
    Number(product.base_price),
    Number(product.retail_price),
  );
  return { marginAmount, marginPercent };
}

export function formatProductDelivery(
  product: SellerCatalogProduct,
  shipping: SellerCatalogShipping,
) {
  const delivery = parseSellerDelivery(product.metadata);
  const snapshot = buildPricingSnapshot(
    Number(product.base_price),
    Number(product.markup_percent),
    delivery,
    shipping,
    Number(product.retail_price),
  );
  return snapshot.deliveryLabel;
}

export function formatDeliveryWindow(product: SellerCatalogProduct) {
  return `${product.delivery_days_min}–${product.delivery_days_max} days`;
}

export function formatMarginCell(product: SellerCatalogProduct) {
  const { marginAmount, marginPercent } = formatProductMargin(product);
  return `${formatCurrency(marginAmount, "ZAR")} (${marginPercent}%)`;
}
