export type SeatDto = {
  id: string;
  row: string;
  number: number;
  type: string; // NORMAL | VIP | COUPLE
  isActive: boolean;
};

export type ShowtimeDto = {
  id: string;
  startsAt: string;
  format: string;
  basePrice: number;
  movie: {
    title: string;
    slug: string;
    posterUrl: string;
    durationMin: number;
    ageRating: string;
  };
  cinema: { name: string; address: string; city: string };
  room: { name: string; rows: number; cols: number };
};

export type TicketTypeDto = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceModifier: number;
};

export type ComboDto = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  price: number;
  category: string;
};
