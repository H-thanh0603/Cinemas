import type { Brand } from "@/types";

export const brands: Brand[] = [
  { id: "apple", name: "Apple" },
  { id: "dell", name: "Dell" },
  { id: "asus", name: "ASUS" },
  { id: "lenovo", name: "Lenovo" },
  { id: "hp", name: "HP" },
  { id: "msi", name: "MSI" },
  { id: "acer", name: "Acer" },
];

export function getBrandName(id: string): string {
  return brands.find((b) => b.id === id)?.name ?? id;
}
