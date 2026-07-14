export function formatVnd(amount: number): string {
  const formatted = Math.round(amount).toLocaleString("vi-VN");
  return `${formatted}₫`;
}
