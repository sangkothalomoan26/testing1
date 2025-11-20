export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculateAutoSellPrice = (costPrice: number): number => {
  if (costPrice <= 0) {
    return 0;
  }
  
  const rawSellPrice = costPrice + 3000;
  
  // Get the base value by flooring to the nearest thousand
  const base = Math.floor(rawSellPrice / 1000) * 1000;
  
  // Get the remainder (the hundreds part)
  const remainder = rawSellPrice % 1000;

  // Apply the specific rounding rule:
  // - If remainder is 501 or more, round up to the next thousand.
  // - Otherwise (if remainder is 500 or less), round down (which is the 'base' value).
  if (remainder > 500) {
    return base + 1000;
  } else {
    return base;
  }
};

export const formatNumberWithSeparators = (value: string | number): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value).replace(/\D/g, '');
  if (stringValue === '') return '';
  return new Intl.NumberFormat('id-ID').format(Number(stringValue));
};

export const parseFormattedNumber = (value: string): number => {
  if (!value) return 0;
  return Number(String(value).replace(/\./g, ''));
};
