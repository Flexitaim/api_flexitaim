import { utcSqlToArIso } from "./time";

type RecordWithTimestamps = Record<string, any> & {
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export function withLocalTimestamps<T extends RecordWithTimestamps>(row: T) {
  return {
    ...row,
    createdAtLocal: utcSqlToArIso(row.createdAt ?? null),
    updatedAtLocal: utcSqlToArIso(row.updatedAt ?? null),
  };
}

export function mapWithLocal<T extends RecordWithTimestamps>(rows: T[]) {
  return rows.map(withLocalTimestamps);
}