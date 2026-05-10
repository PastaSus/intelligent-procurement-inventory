export interface SearchParams {
  page?: string;
  search?: string;
  category?: string;
  status?: 'all' | 'low' | 'critical' | 'normal';
  sort?: 'sku' | 'name' | 'quantity' | 'category' | 'updated_at';
  order?: 'asc' | 'desc';
}