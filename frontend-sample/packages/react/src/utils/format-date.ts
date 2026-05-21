export const formatDate = (
  dateString: string,
  format: "short" | "medium" = "short"
): string => {
  const date = new Date(dateString);
  if (format === "short") {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  }
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};