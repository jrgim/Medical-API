export interface DBQueryResult {
  rows: Array<any>;
  rowCount: number;
  lastID?: number;
}