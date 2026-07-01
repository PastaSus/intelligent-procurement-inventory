export interface SearchParams {
  page?: string;
  search?: string;
  room_id?: string;
  sort?: 'unitName' | 'roomName' | 'componentCount' | 'updated_at';
  order?: 'asc' | 'desc';
}
