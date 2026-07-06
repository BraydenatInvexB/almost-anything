export interface CustomerPaymentMethod {
  id: string;
  provider: string;
  cardType: string | null;
  last4: string;
  expMonth: string | null;
  expYear: string | null;
  isDefault: boolean;
  createdAt: string;
}
