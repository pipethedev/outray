export async function initiateCheckout(
  productId: string,
  organizationId: string,
  customerEmail: string,
  customerName: string,
): Promise<string> {
  const params = new URLSearchParams({
    products: productId,
    customerEmail,
    customerName,
    metadata: JSON.stringify({ organizationId }),
  });

  const checkoutUrl = `/api/checkout/polar?${params.toString()}`;

  return checkoutUrl;
}

export const POLAR_PRODUCT_IDS = {
  ray: import.meta.env.VITE_POLAR_PRODUCT_RAY || "",
  beam: import.meta.env.VITE_POLAR_PRODUCT_BEAM || "",
  pulse: import.meta.env.VITE_POLAR_PRODUCT_PULSE || "",
} as const;
