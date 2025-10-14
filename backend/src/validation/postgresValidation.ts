interface PostgresError {
  code: string;
  detail: string;
}

export function isPostgresError(e: any): e is PostgresError {
  return e && typeof e.code === 'string' && typeof e.detail === 'string';
}
