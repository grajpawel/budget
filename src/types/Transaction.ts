export type Transaction = {
  id?: string;
  operationDate: string;
  currencyDate: string;
  transactionType: string;
  amount: number;
  currency: string;
  balanceAfter: number;
  description: string;
  category?: string;
};