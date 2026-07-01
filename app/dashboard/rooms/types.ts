export interface SearchParams {
  page?: string;
  search?: string;
  sort?: 'name' | 'unitCount' | 'updated_at';
  order?: 'asc' | 'desc';
}
