const PROHIBITED_KEYWORDS = ['tobacco', 'cigarette', 'vape', 'alcohol', 'prescription', 'rx'];

export async function checkProhibitedItems(params: { productDescription: string }) {
  const lowerDesc = params.productDescription.toLowerCase();
  const isProhibited = PROHIBITED_KEYWORDS.some((keyword) => lowerDesc.includes(keyword));
  return {
    prohibited: isProhibited,
    reason: isProhibited ? 'Item contains prohibited keywords' : null,
  };
}
