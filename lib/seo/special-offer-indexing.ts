export type SpecialOfferIndexingState = {
  noindex: boolean;
  expirationDate?: string | null;
};

export function isSpecialOfferIndexable({ noindex }: SpecialOfferIndexingState): boolean {
  return !noindex;
}
