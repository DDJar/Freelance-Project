import { formatNumber } from 'devextreme/localization';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export const formatCurrencyVND = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
};
