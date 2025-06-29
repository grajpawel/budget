import { fixPolishChars } from "./fixPolishChars";
import type { Transaction } from "../types/Transaction";

export const normalizePkoBp = (raw: any): Transaction => ({
  operationDate: raw["Data operacji"],
  currencyDate: raw["Data waluty"],
  transactionType: fixPolishChars(raw["Typ transakcji"]),
  amount: parseFloat(raw["Kwota"].replace(",", ".")),
  currency: raw["Waluta"],
  balanceAfter: parseFloat(raw["Saldo po transakcji"].replace(/[+,]/g, "")),
  description: fixPolishChars(raw["Opis transakcji"]),
  category: "",
});