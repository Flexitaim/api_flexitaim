export interface CreateCategoryDto {
  description: string;
}

export interface UpdateCategoryDto {
  description?: string;
  active?: boolean;
}