import type { Order } from "@/types";

export const orders: Order[] = [
  {
    id: "o1",
    code: "TZ482913",
    createdAt: "2026-06-01T10:20:00+07:00",
    status: "delivered",
    customerName: "Nguyễn Văn A",
    phone: "0901234567",
    shippingAddress: "12 Nguyễn Huệ, Q.1, TP.HCM",
    total: 26_990_000,
    items: [
      {
        productId: "p1",
        name: "MacBook Air 13\" M3 8GB/256GB",
        qty: 1,
        unitPrice: 26_990_000,
      },
    ],
  },
  {
    id: "o2",
    code: "TZ591027",
    createdAt: "2026-06-18T14:05:00+07:00",
    status: "shipping",
    customerName: "Nguyễn Văn A",
    phone: "0901234567",
    shippingAddress: "12 Nguyễn Huệ, Q.1, TP.HCM",
    total: 33_990_000,
    items: [
      {
        productId: "p3",
        name: "ASUS ROG Strix G16 i7/RTX 4060",
        qty: 1,
        unitPrice: 33_990_000,
      },
    ],
  },
  {
    id: "o3",
    code: "TZ603441",
    createdAt: "2026-07-02T09:40:00+07:00",
    status: "confirmed",
    customerName: "Nguyễn Văn A",
    phone: "0901234567",
    shippingAddress: "45 Lê Lợi, Q.1, TP.HCM",
    total: 46_480_000,
    items: [
      {
        productId: "p6",
        name: "Dell Inspiron 15 3530 i5/8GB/512GB",
        qty: 1,
        unitPrice: 14_490_000,
      },
      {
        productId: "p11",
        name: "MSI Katana 15 i7/RTX 4060",
        qty: 1,
        unitPrice: 29_990_000,
      },
    ],
  },
  {
    id: "o4",
    code: "TZ610882",
    createdAt: "2026-07-10T16:15:00+07:00",
    status: "pending",
    customerName: "Nguyễn Văn A",
    phone: "0901234567",
    shippingAddress: "12 Nguyễn Huệ, Q.1, TP.HCM",
    total: 21_990_000,
    items: [
      {
        productId: "p13",
        name: "Acer Nitro V 15 i5/RTX 4050",
        qty: 1,
        unitPrice: 21_990_000,
      },
    ],
  },
];

export function getOrderById(id: string): Order | undefined {
  return orders.find((o) => o.id === id);
}
