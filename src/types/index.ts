export interface JwtPayload {
  userId: string;
  email: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
