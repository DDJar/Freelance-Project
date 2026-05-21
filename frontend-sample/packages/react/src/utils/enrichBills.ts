import { Bill } from "../types/bill";
import { Product } from "../types/product";

/**
 * Enrich bills by adding `name` and `category` to each item
 * based on the corresponding productId.
 *
 * @param bills - List of bills to enrich
 * @param products - List of products to use as lookup
 * @returns New list of bills with enriched items
 */
export function enrichBillsWithProductInfo(bills: Bill[], products: Product[]): Bill[] {
  // Map productId → Product for quick lookup
  const productMap = new Map<string, Product>();
  products.forEach((p) => productMap.set(p.id, p));

  // Return enriched bills
  return bills.map((bill) => ({
    ...bill,
    items: bill.items?.map((item) => {
      const product = productMap.get(item.productId);
      return {
        ...item,
        name: product?.name ?? "Unknown",
        category: product?.category ?? "Unknown",
      };
    }) ?? [],
  }));
}

export default enrichBillsWithProductInfo;
