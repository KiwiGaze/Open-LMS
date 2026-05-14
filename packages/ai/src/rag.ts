import { z } from 'zod';

export const RagSourceType = z.enum([
  'course_page',
  'assignment',
  'rubric',
  'syllabus',
  'teacher_example',
  'reading_material',
  'video_transcript',
  'faq',
  'announcement',
  'scorm_package',
]);
export type RagSourceType = z.infer<typeof RagSourceType>;

export const RagVisibility = z.enum(['student_visible', 'teacher_only']);
export type RagVisibility = z.infer<typeof RagVisibility>;

export const RagAccessPolicy = z.enum(['public', 'course_member', 'course_staff']);
export type RagAccessPolicy = z.infer<typeof RagAccessPolicy>;

export const RagContentSource = z
  .object({
    tenantId: z.string().min(1),
    courseId: z.string().min(1),
    moduleId: z.string().min(1).nullable().default(null),
    unitId: z.string().min(1).nullable().default(null),
    sourceType: RagSourceType,
    sourceId: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    visibility: RagVisibility,
    sourceVersion: z.string().min(1),
    language: z.string().min(2).default('en'),
    accessPolicy: RagAccessPolicy.default('course_member'),
    learningObjectiveIds: z.array(z.string().min(1)),
    updatedAt: z.date(),
  })
  .strict();
export type RagContentSource = z.input<typeof RagContentSource>;

export const RagChunk = z
  .object({
    id: z.string().min(1),
    tenantId: z.string().min(1),
    courseId: z.string().min(1),
    moduleId: z.string().min(1).nullable(),
    unitId: z.string().min(1).nullable(),
    sourceType: RagSourceType,
    sourceId: z.string().min(1),
    sourceTitle: z.string().min(1),
    chunkIndex: z.number().int().nonnegative(),
    content: z.string().min(1),
    visibility: RagVisibility,
    sourceVersion: z.string().min(1),
    language: z.string().min(2),
    accessPolicy: RagAccessPolicy,
    learningObjectiveIds: z.array(z.string().min(1)),
    embedding: z.array(z.number()).length(8),
    embeddingModel: z.string().min(1),
    embeddingModelVersion: z.string().min(1),
    chunkingStrategyVersion: z.string().min(1),
    sourceUpdatedAt: z.date(),
    indexedAt: z.date(),
  })
  .strict();
export type RagChunk = z.infer<typeof RagChunk>;

export type RagRetrievalResult = {
  chunk: RagChunk;
  relevanceScore: number;
};

export type BuildRagChunksOptions = {
  maxChunkCharacters?: number;
  embeddingModel?: string;
  embeddingModelVersion?: string;
  chunkingStrategyVersion?: string;
  indexedAt?: Date;
};

const BuildRagChunksOptionsSchema = z
  .object({
    maxChunkCharacters: z.number().int().positive().optional(),
    embeddingModel: z.string().min(1).optional(),
    embeddingModelVersion: z.string().min(1).optional(),
    chunkingStrategyVersion: z.string().min(1).optional(),
    indexedAt: z.date().optional(),
  })
  .strict();

export type RetrieveRelevantChunksInput = {
  query: string;
  queryEmbedding?: number[];
  tenantId: string;
  courseId: string;
  allowedVisibilities: RagVisibility[];
  allowedAccessPolicies: RagAccessPolicy[];
  chunks: RagChunk[];
  limit: number;
};

const defaultMaxChunkCharacters = 1200;
const embeddingDimensions = 8;

const RetrieveRelevantChunksInputSchema = z
  .object({
    query: z.string().min(1),
    queryEmbedding: z.array(z.number()).length(embeddingDimensions).optional(),
    tenantId: z.string().min(1),
    courseId: z.string().min(1),
    allowedVisibilities: z.array(RagVisibility),
    allowedAccessPolicies: z.array(RagAccessPolicy),
    chunks: z.array(RagChunk),
    limit: z.number().int().positive(),
  })
  .strict();

const splitParagraphs = (body: string, maxChunkCharacters: number): string[] => {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if (!current) {
      current = paragraph;
      continue;
    }

    const next = `${current}\n\n${paragraph}`;
    if (next.length <= maxChunkCharacters) {
      current = next;
      continue;
    }

    chunks.push(current);
    current = paragraph;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.flatMap((chunk) => {
    if (chunk.length <= maxChunkCharacters) {
      return [chunk];
    }

    const slices: string[] = [];
    for (let start = 0; start < chunk.length; start += maxChunkCharacters) {
      slices.push(chunk.slice(start, start + maxChunkCharacters).trim());
    }
    return slices.filter((slice) => slice.length > 0);
  });
};

const tokenize = (value: string): Set<string> =>
  new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(' ')
      .filter((token) => token.length >= 3),
  );

const hashToken = (token: string): number => {
  let hash = 0;
  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) >>> 0;
  }
  return hash;
};

export const buildLexicalEmbedding = (value: string): number[] => {
  const vector = Array.from({ length: embeddingDimensions }, () => 0);
  for (const token of tokenize(value)) {
    const dimension = hashToken(token) % embeddingDimensions;
    vector[dimension] = (vector[dimension] ?? 0) + 1;
  }

  const magnitude = Math.hypot(...vector);
  if (magnitude === 0) {
    return vector;
  }

  return vector.map((component) => Number((component / magnitude).toFixed(6)));
};

const cosineSimilarity = (left: number[], right: number[]): number => {
  if (left.length !== right.length || left.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  for (let index = 0; index < left.length; index += 1) {
    dotProduct += (left[index] ?? 0) * (right[index] ?? 0);
  }

  return dotProduct;
};

const scoreChunk = (query: string, chunk: RagChunk): number => {
  const queryTokens = tokenize(query);
  const chunkTokens = tokenize(`${chunk.sourceTitle} ${chunk.content}`);
  let matches = 0;

  for (const token of queryTokens) {
    if (chunkTokens.has(token)) {
      matches += 1;
    }
  }

  return queryTokens.size === 0 ? 0 : matches / queryTokens.size;
};

const scoreRetrievedChunk = (query: string, queryEmbedding: number[], chunk: RagChunk): number =>
  Math.max(scoreChunk(query, chunk), cosineSimilarity(queryEmbedding, chunk.embedding));

export const buildRagChunks = (
  sources: RagContentSource[],
  options: BuildRagChunksOptions = {},
): RagChunk[] => {
  const parsedOptions = BuildRagChunksOptionsSchema.parse(options);
  const maxChunkCharacters = parsedOptions.maxChunkCharacters ?? defaultMaxChunkCharacters;
  const embeddingModel = parsedOptions.embeddingModel ?? 'lexical-dev';
  const embeddingModelVersion = parsedOptions.embeddingModelVersion ?? '2026-05-10';
  const chunkingStrategyVersion = parsedOptions.chunkingStrategyVersion ?? 'paragraph-v1';
  const indexedAt = parsedOptions.indexedAt ?? new Date();

  return sources.flatMap((source) => {
    const parsed = RagContentSource.parse(source);
    return splitParagraphs(parsed.body, maxChunkCharacters).map((content, chunkIndex) =>
      RagChunk.parse({
        id: `${parsed.sourceId}:${parsed.sourceVersion}:${chunkIndex}`,
        tenantId: parsed.tenantId,
        courseId: parsed.courseId,
        moduleId: parsed.moduleId,
        unitId: parsed.unitId,
        sourceType: parsed.sourceType,
        sourceId: parsed.sourceId,
        sourceTitle: parsed.title,
        chunkIndex,
        content,
        visibility: parsed.visibility,
        sourceVersion: parsed.sourceVersion,
        language: parsed.language,
        accessPolicy: parsed.accessPolicy,
        learningObjectiveIds: parsed.learningObjectiveIds,
        embedding: buildLexicalEmbedding(`${parsed.title}\n\n${content}`),
        embeddingModel,
        embeddingModelVersion,
        chunkingStrategyVersion,
        sourceUpdatedAt: parsed.updatedAt,
        indexedAt,
      }),
    );
  });
};

export const retrieveRelevantChunks = (
  input: RetrieveRelevantChunksInput,
): RagRetrievalResult[] => {
  const parsed = RetrieveRelevantChunksInputSchema.parse(input);

  return parsed.chunks
    .filter((chunk) => chunk.tenantId === parsed.tenantId)
    .filter((chunk) => chunk.courseId === parsed.courseId)
    .filter((chunk) => parsed.allowedVisibilities.includes(chunk.visibility))
    .filter((chunk) => parsed.allowedAccessPolicies.includes(chunk.accessPolicy))
    .map((chunk) => ({
      chunk,
      relevanceScore: scoreRetrievedChunk(
        parsed.query,
        parsed.queryEmbedding ?? buildLexicalEmbedding(parsed.query),
        chunk,
      ),
    }))
    .filter((result) => result.relevanceScore > 0)
    .sort((left, right) => {
      if (right.relevanceScore !== left.relevanceScore) {
        return right.relevanceScore - left.relevanceScore;
      }
      return left.chunk.id.localeCompare(right.chunk.id);
    })
    .slice(0, parsed.limit);
};
