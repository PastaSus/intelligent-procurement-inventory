export interface SearchParams {
  page?: string;
  search?: string;
  component_type?: string;
  status?: 'all' | 'low' | 'critical' | 'normal';
  sort?: 'sku' | 'name' | 'quantity' | 'component_type' | 'updated_at';
  order?: 'asc' | 'desc';
}
