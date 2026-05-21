// src/utils/phone-format.ts
export const formatPhone = (phoneNumber: string | number): string => {
  const raw = String(phoneNumber || "").replace(/\D/g, "").replace(/^0/, "");

  if (raw.length === 9 || raw.length === 10) {
    return `+84 ${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
  }

  return String(phoneNumber || "");
};
