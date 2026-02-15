export interface RestaurantItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  description?: string;
  image?: string;
}

export interface RestaurantItemsResponse {
  items: RestaurantItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

