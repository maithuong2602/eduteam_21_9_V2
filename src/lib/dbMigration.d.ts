export interface MigrationOptions {
  sourcePath?: string;
  targetPath?: string;
  isTestMode?: boolean;
  forceRunInTest?: boolean;
}

export interface MigrationResult {
  status: string;
  skipped?: boolean;
  conflict?: boolean;
  presCount?: number;
  actCount?: number;
  targetPath?: string;
}

export function runStartupMigration(options?: MigrationOptions): MigrationResult;
export function hasDbData(db: any): boolean;
