export interface CreateServiceDto {
  userId: number;
  name: string;
  description?: string;
  duration: number;
  price: number;
  categoryId: number;
}

export interface UpdateServiceDto {
  userId?: number;
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  categoryId: number;
}
