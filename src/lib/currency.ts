export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  paystackCurrency: string;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", paystackCurrency: "NGN" },
  { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi", paystackCurrency: "GHS" },
  { code: "USD", symbol: "$", name: "US Dollar", paystackCurrency: "USD" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", paystackCurrency: "KES" },
  { code: "ZAR", symbol: "R", name: "South African Rand", paystackCurrency: "ZAR" },
  { code: "GBP", symbol: "£", name: "British Pound", paystackCurrency: "GBP" },
  { code: "EUR", symbol: "€", name: "Euro", paystackCurrency: "EUR" },
];

export const getCurrency = (code: string): CurrencyConfig => {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
};

export const formatPrice = (amount: number, currencyCode: string): string => {
  const currency = getCurrency(currencyCode);
  return `${currency.symbol}${amount.toLocaleString()}`;
};
