import { z } from 'zod';

export const CommonCartridgeFormat = z.enum(['imscc_1_3']);
export type CommonCartridgeFormat = z.infer<typeof CommonCartridgeFormat>;

export const CommonCartridgeFile = z
  .object({
    path: z.string().min(1).max(500),
    contentType: z.string().min(1).max(120),
    content: z.string().max(1_000_000),
  })
  .strict();
export type CommonCartridgeFile = z.infer<typeof CommonCartridgeFile>;

export const CommonCartridgeCourseExport = z
  .object({
    format: CommonCartridgeFormat,
    exportedAt: z.date(),
    manifestXml: z.string().min(1).max(1_000_000),
    files: z.array(CommonCartridgeFile).max(2_000),
  })
  .strict();
export type CommonCartridgeCourseExport = z.infer<typeof CommonCartridgeCourseExport>;

export const CommonCartridgeImportRequest = z
  .object({
    format: CommonCartridgeFormat,
    manifestXml: z.string().min(1).max(1_000_000),
    files: z.array(CommonCartridgeFile).max(2_000),
  })
  .strict();
export type CommonCartridgeImportRequest = z.infer<typeof CommonCartridgeImportRequest>;

export const CommonCartridgeImportResult = z
  .object({
    format: CommonCartridgeFormat,
    learningObjectivesRestored: z.number().int().nonnegative(),
    modulesRestored: z.number().int().nonnegative(),
    unitsRestored: z.number().int().nonnegative(),
    pagesRestored: z.number().int().nonnegative(),
    resourcesRestored: z.number().int().nonnegative(),
  })
  .strict();
export type CommonCartridgeImportResult = z.infer<typeof CommonCartridgeImportResult>;
