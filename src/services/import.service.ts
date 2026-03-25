import mongoose from 'mongoose';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ImportBatch, { IImportBatch, IImportBatchError } from '@/models/ImportBatch';
import ExampleSentence from '@/models/ExampleSentence';
import Vocabulary from '@/models/Vocabulary';
import Grammar from '@/models/Grammar';
import Conversation from '@/models/Conversation';
import { ApiError } from '@/utils/ApiError';
import { createAuditLog } from '@/utils/auditLogger';
import { LEVELS, SUPPORTED_LANGUAGES } from '@/utils/constants';
import { normalizeText } from '@/utils/normalizeText';

export type ImportContentType = 'vocabulary' | 'grammar' | 'conversation' | 'exampleSentence';
export type ImportFileType = 'csv' | 'xlsx';
export type PreviewStatus = 'valid' | 'invalid' | 'duplicate';

export interface ImportPreviewRow {
  row: number;
  data: Record<string, unknown>;
  status: PreviewStatus;
  errors: IImportBatchError[];
}

export interface UploadPreviewResult {
  batch: IImportBatch;
  preview: ImportPreviewRow[];
}

interface ParsedRow {
  rowNumber: number;
  raw: Record<string, unknown>;
}

interface RowValidationResult {
  rowNumber: number;
  data: Record<string, unknown>;
  errors: IImportBatchError[];
  dedupeKey?: string;
}

const IMPORT_CONTENT_TYPES: ImportContentType[] = [
  'vocabulary',
  'grammar',
  'conversation',
  'exampleSentence',
];

const DEFAULT_LEVEL = 'beginner';
const DEFAULT_TOPIC = 'general';

const toStringValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  return String(value).trim();
};

const toNumberValue = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const parsed = Number(toStringValue(value));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseJsonArray = (value: unknown): { data?: unknown[]; error?: string } => {
  if (value === null || value === undefined || value === '') {
    return { data: [] };
  }

  if (Array.isArray(value)) {
    return { data: value };
  }

  if (typeof value !== 'string') {
    return { error: 'JSON 배열 형식이어야 합니다.' };
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return { error: 'JSON 배열 형식이어야 합니다.' };
    }
    return { data: parsed };
  } catch (err) {
    return { error: 'JSON 파싱에 실패했습니다.' };
  }
};

const isSupportedLanguage = (value: string): boolean => {
  return SUPPORTED_LANGUAGES.includes(value as (typeof SUPPORTED_LANGUAGES)[number]);
};

const isSupportedLevel = (value: string): boolean => {
  return LEVELS.includes(value as (typeof LEVELS)[number]);
};

const parseCsvBuffer = (buffer: Buffer): ParsedRow[] => {
  const result = Papa.parse<Record<string, unknown>>(buffer.toString('utf8'), {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors && result.errors.length > 0) {
    const message = result.errors.map((error) => error.message).join(', ');
    throw ApiError.badRequest(`CSV 파싱 실패: ${message}`);
  }

  return (result.data || []).map((row, index) => ({
    rowNumber: index + 2,
    raw: row || {},
  }));
};

const parseXlsxBuffer = (buffer: Buffer): ParsedRow[] => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw ApiError.badRequest('XLSX 시트가 비어 있습니다.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
  });

  return rows.map((row, index) => ({
    rowNumber: index + 2,
    raw: row || {},
  }));
};

const parseFileBuffer = (buffer: Buffer, fileType: ImportFileType): ParsedRow[] => {
  if (fileType === 'csv') {
    return parseCsvBuffer(buffer);
  }

  return parseXlsxBuffer(buffer);
};

const addError = (
  errors: IImportBatchError[],
  rowNumber: number,
  field: string,
  message: string,
): void => {
  errors.push({ row: rowNumber, field, message });
};

const validateVocabularyRow = (
  row: ParsedRow,
  targetLanguage: string,
): RowValidationResult => {
  const errors: IImportBatchError[] = [];
  const raw = row.raw;

  const word = toStringValue(raw.word);
  const meaning = toStringValue(raw.meaning);
  const pronunciation = toStringValue(raw.pronunciation);
  const partOfSpeech = toStringValue(raw.partOfSpeech);
  const exampleSentence = toStringValue(raw.exampleSentence);
  const exampleTranslation = toStringValue(raw.exampleTranslation);
  const level = toStringValue(raw.level) || DEFAULT_LEVEL;
  const chapter = toNumberValue(raw.chapter) ?? 1;
  const order = toNumberValue(raw.order) ?? 0;
  const source = toStringValue(raw.source);
  const license = toStringValue(raw.license);

  if (!word) addError(errors, row.rowNumber, 'word', '단어는 필수입니다.');
  if (!meaning) addError(errors, row.rowNumber, 'meaning', '의미는 필수입니다.');
  if (!partOfSpeech) addError(errors, row.rowNumber, 'partOfSpeech', '품사는 필수입니다.');
  if (!level) addError(errors, row.rowNumber, 'level', '레벨은 필수입니다.');
  if (level && !isSupportedLevel(level)) {
    addError(errors, row.rowNumber, 'level', '지원하지 않는 레벨입니다.');
  }
  if (!Number.isInteger(chapter) || chapter < 1) {
    addError(errors, row.rowNumber, 'chapter', 'chapter는 1 이상의 정수여야 합니다.');
  }
  if (!Number.isInteger(order) || order < 0) {
    addError(errors, row.rowNumber, 'order', 'order는 0 이상의 정수여야 합니다.');
  }

  const data = {
    targetLanguage,
    word,
    meaning,
    pronunciation,
    partOfSpeech,
    level,
    chapter,
    exampleSentence,
    exampleTranslation,
    audioUrl: '',
    order,
    sourceReference: source || undefined,
    license: license || undefined,
  };

  const dedupeKey = word ? `${targetLanguage}:${word}` : undefined;

  return { rowNumber: row.rowNumber, data, errors, dedupeKey };
};

const validateGrammarRow = (
  row: ParsedRow,
  targetLanguage: string,
): RowValidationResult => {
  const errors: IImportBatchError[] = [];
  const raw = row.raw;

  const title = toStringValue(raw.title);
  const description = toStringValue(raw.description);
  const structure = toStringValue(raw.structure);
  const level = toStringValue(raw.level) || DEFAULT_LEVEL;
  const source = toStringValue(raw.source);
  const license = toStringValue(raw.license);

  if (!title) addError(errors, row.rowNumber, 'title', '제목은 필수입니다.');
  if (!description) addError(errors, row.rowNumber, 'description', '설명은 필수입니다.');
  if (!level) addError(errors, row.rowNumber, 'level', '레벨은 필수입니다.');
  if (level && !isSupportedLevel(level)) {
    addError(errors, row.rowNumber, 'level', '지원하지 않는 레벨입니다.');
  }

  const examplesResult = parseJsonArray(raw.examples);
  if (examplesResult.error) {
    addError(errors, row.rowNumber, 'examples', examplesResult.error);
  }

  const examples = (examplesResult.data || []).map((item) => {
    const entry = item as Record<string, unknown>;
    return {
      sentence: toStringValue(entry.sentence),
      translation: toStringValue(entry.translation),
      highlight: toStringValue(entry.highlight),
    };
  });

  const data = {
    targetLanguage,
    title,
    subtitle: '',
    englishTitle: '',
    icon: '📝',
    level,
    order: 0,
    formula: structure,
    formulaExample: '',
    explanation: description,
    examples,
    quizzes: [],
    sourceReference: source || undefined,
    license: license || undefined,
  };

  const dedupeKey = title ? `${targetLanguage}:${title}` : undefined;

  return { rowNumber: row.rowNumber, data, errors, dedupeKey };
};

const validateConversationRow = (
  row: ParsedRow,
  targetLanguage: string,
): RowValidationResult => {
  const errors: IImportBatchError[] = [];
  const raw = row.raw;

  const title = toStringValue(raw.title);
  const level = toStringValue(raw.level) || DEFAULT_LEVEL;
  const source = toStringValue(raw.source);
  const license = toStringValue(raw.license);

  if (!title) addError(errors, row.rowNumber, 'title', '제목은 필수입니다.');
  if (!level) addError(errors, row.rowNumber, 'level', '레벨은 필수입니다.');
  if (level && !isSupportedLevel(level)) {
    addError(errors, row.rowNumber, 'level', '지원하지 않는 레벨입니다.');
  }

  const dialogsResult = parseJsonArray(raw.dialogues);
  if (dialogsResult.error) {
    addError(errors, row.rowNumber, 'dialogues', dialogsResult.error);
  }

  const dialogs = (dialogsResult.data || []).map((item) => {
    const entry = item as Record<string, unknown>;
    return {
      speaker: toStringValue(entry.speaker),
      text: toStringValue(entry.text),
      translation: toStringValue(entry.translation),
      isUserRole: Boolean(entry.isUserRole),
      audioUrl: toStringValue(entry.audioUrl),
    };
  });

  dialogs.forEach((dialog, index) => {
    if (!dialog.speaker || !['A', 'B'].includes(dialog.speaker)) {
      addError(errors, row.rowNumber, `dialogues[${index}].speaker`, '화자(A/B)가 필요합니다.');
    }
    if (!dialog.text) {
      addError(errors, row.rowNumber, `dialogues[${index}].text`, '대화 내용이 필요합니다.');
    }
    if (!dialog.translation) {
      addError(errors, row.rowNumber, `dialogues[${index}].translation`, '번역이 필요합니다.');
    }
  });

  const data = {
    targetLanguage,
    title,
    emoji: '💬',
    level,
    order: 0,
    dialogs,
    keyExpressions: [],
    sourceReference: source || undefined,
    license: license || undefined,
  };

  const dedupeKey = title ? `${targetLanguage}:${title}` : undefined;

  return { rowNumber: row.rowNumber, data, errors, dedupeKey };
};

const validateExampleSentenceRow = (
  row: ParsedRow,
  targetLanguage: string,
): RowValidationResult => {
  const errors: IImportBatchError[] = [];
  const raw = row.raw;

  const text = toStringValue(raw.text);
  const translation = toStringValue(raw.translation);
  const difficulty = toStringValue(raw.difficulty) || DEFAULT_LEVEL;
  const topic = toStringValue(raw.topic) || DEFAULT_TOPIC;
  const source = toStringValue(raw.source);
  const license = toStringValue(raw.license);

  if (!text) addError(errors, row.rowNumber, 'text', '예문은 필수입니다.');
  if (!translation) addError(errors, row.rowNumber, 'translation', '번역은 필수입니다.');
  if (!source) addError(errors, row.rowNumber, 'source', '출처는 필수입니다.');
  if (!license) addError(errors, row.rowNumber, 'license', '라이선스는 필수입니다.');
  if (difficulty && !isSupportedLevel(difficulty)) {
    addError(errors, row.rowNumber, 'difficulty', '지원하지 않는 난이도입니다.');
  }

  const data = {
    targetLanguage,
    topic,
    level: difficulty,
    originalText: text,
    translation,
    normalizedKey: text ? normalizeText(text) : '',
    tags: [],
    relatedVocabularyIds: [],
    relatedGrammarIds: [],
    sourceReference: source || undefined,
    license: license || undefined,
  };

  const dedupeKey = text ? `${targetLanguage}:${normalizeText(text)}` : undefined;

  return { rowNumber: row.rowNumber, data, errors, dedupeKey };
};

const getRowValidator = (contentType: ImportContentType) => {
  switch (contentType) {
    case 'vocabulary':
      return validateVocabularyRow;
    case 'grammar':
      return validateGrammarRow;
    case 'conversation':
      return validateConversationRow;
    case 'exampleSentence':
      return validateExampleSentenceRow;
    default:
      return null;
  }
};

const fetchExistingKeys = async (
  contentType: ImportContentType,
  targetLanguage: string,
  keys: string[],
): Promise<Set<string>> => {
  if (keys.length === 0) {
    return new Set<string>();
  }

  const uniqueKeys = Array.from(new Set(keys));

  if (contentType === 'exampleSentence') {
    const normalizedKeys = uniqueKeys.map((key) => key.split(':')[1]);
    const docs = await ExampleSentence.find({
      targetLanguage,
      normalizedKey: { $in: normalizedKeys },
    }).select('normalizedKey');

    return new Set(docs.map((doc) => `${targetLanguage}:${doc.normalizedKey}`));
  }

  if (contentType === 'vocabulary') {
    const words = uniqueKeys.map((key) => key.split(':')[1]);
    const docs = await Vocabulary.find({
      targetLanguage,
      word: { $in: words },
    }).select('word');

    return new Set(docs.map((doc) => `${targetLanguage}:${doc.word}`));
  }

  if (contentType === 'grammar') {
    const titles = uniqueKeys.map((key) => key.split(':')[1]);
    const docs = await Grammar.find({
      targetLanguage,
      title: { $in: titles },
    }).select('title');

    return new Set(docs.map((doc) => `${targetLanguage}:${doc.title}`));
  }

  const titles = uniqueKeys.map((key) => key.split(':')[1]);
  const docs = await Conversation.find({
    targetLanguage,
    title: { $in: titles },
  }).select('title');

  return new Set(docs.map((doc) => `${targetLanguage}:${doc.title}`));
};

const assertContentType = (value: string): ImportContentType => {
  if (!IMPORT_CONTENT_TYPES.includes(value as ImportContentType)) {
    throw ApiError.badRequest('지원하지 않는 콘텐츠 타입입니다.');
  }
  return value as ImportContentType;
};

export const uploadImportFile = async (input: {
  fileName: string;
  fileType: ImportFileType;
  contentType: string;
  targetLanguage: string;
  uploaderId: mongoose.Types.ObjectId;
  buffer: Buffer;
  ipAddress?: string;
}): Promise<UploadPreviewResult> => {
  const { fileName, fileType, contentType, targetLanguage, uploaderId, buffer, ipAddress } = input;

  const resolvedContentType = assertContentType(contentType);

  if (!isSupportedLanguage(targetLanguage)) {
    throw ApiError.badRequest('지원하지 않는 대상 언어입니다.');
  }

  const rows = parseFileBuffer(buffer, fileType);
  const validator = getRowValidator(resolvedContentType);
  if (!validator) {
    throw ApiError.badRequest('지원하지 않는 콘텐츠 타입입니다.');
  }

  const validations = rows.map((row) => validator(row, targetLanguage));
  const candidateKeys = validations
    .filter((row) => row.errors.length === 0 && row.dedupeKey)
    .map((row) => row.dedupeKey!)
    .filter((key) => Boolean(key));

  const existingKeys = await fetchExistingKeys(resolvedContentType, targetLanguage, candidateKeys);
  const seenKeys = new Set<string>();

  const preview: ImportPreviewRow[] = [];
  const errors: IImportBatchError[] = [];
  let validRows = 0;
  let invalidRows = 0;
  let duplicateRows = 0;

  validations.forEach((row) => {
    const rowErrors = [...row.errors];
    let status: PreviewStatus = 'valid';

    if (rowErrors.length > 0) {
      status = 'invalid';
      invalidRows += 1;
    } else if (row.dedupeKey && (seenKeys.has(row.dedupeKey) || existingKeys.has(row.dedupeKey))) {
      status = 'duplicate';
      duplicateRows += 1;
    } else {
      status = 'valid';
      validRows += 1;
      if (row.dedupeKey) {
        seenKeys.add(row.dedupeKey);
      }
    }

    rowErrors.forEach((error) => errors.push(error));

    preview.push({
      row: row.rowNumber,
      data: row.data,
      status,
      errors: rowErrors,
    });
  });

  const batch = await ImportBatch.create({
    fileName,
    fileType,
    contentType: resolvedContentType,
    status: 'staged',
    uploadedBy: uploaderId,
    totalRows: rows.length,
    validRows,
    invalidRows,
    duplicateRows,
    importedRows: 0,
    errors,
    metadata: {
      targetLanguage,
      preview,
    },
  });

  await createAuditLog({
    actor: uploaderId,
    action: 'import',
    entityType: 'ImportBatch',
    entityId: batch._id,
    metadata: {
      action: 'upload',
      contentType,
      fileType,
    },
    ipAddress,
  });

  return { batch, preview };
};

const getPreviewRows = (batch: IImportBatch): ImportPreviewRow[] => {
  const metadata = batch.metadata as { preview?: ImportPreviewRow[] } | undefined;
  if (!metadata?.preview || !Array.isArray(metadata.preview)) {
    return [];
  }

  return metadata.preview;
};

const buildInsertDocuments = (
  rows: ImportPreviewRow[],
  sourceType: 'csv_import' | 'xlsx_import',
  importBatchId: mongoose.Types.ObjectId,
  actorId: mongoose.Types.ObjectId,
): Record<string, unknown>[] => {
  return rows.map((row) => {
    const data = row.data;
    return {
      ...data,
      status: 'draft',
      sourceType,
      createdBy: actorId,
      lastEditedBy: actorId,
      importBatchId,
    };
  });
};

const insertContentDocuments = async (
  contentType: ImportContentType,
  docs: Record<string, unknown>[],
): Promise<number> => {
  if (docs.length === 0) return 0;

  if (contentType === 'vocabulary') {
    const result = await Vocabulary.insertMany(docs, { ordered: false });
    return result.length;
  }

  if (contentType === 'grammar') {
    const result = await Grammar.insertMany(docs, { ordered: false });
    return result.length;
  }

  if (contentType === 'conversation') {
    const result = await Conversation.insertMany(docs, { ordered: false });
    return result.length;
  }

  const result = await ExampleSentence.insertMany(docs, { ordered: false });
  return result.length;
};

export const confirmImportBatch = async (input: {
  batchId: string;
  actorId: mongoose.Types.ObjectId;
  ipAddress?: string;
}): Promise<{ importedRows: number; skippedRows: number; batch: IImportBatch }> => {
  const { batchId, actorId, ipAddress } = input;
  const batch = await ImportBatch.findById(batchId);
  if (!batch) throw ApiError.notFound('임포트 배치를 찾을 수 없습니다.');

  if (batch.status !== 'staged') {
    throw ApiError.badRequest('확정할 수 없는 상태입니다.');
  }

  batch.status = 'importing';
  await batch.save();

  const preview = getPreviewRows(batch);
  const validRows = preview.filter((row) => row.status === 'valid');
  const skippedRows = preview.length - validRows.length;
  const sourceType = batch.fileType === 'csv' ? 'csv_import' : 'xlsx_import';

  const resolvedContentType = assertContentType(batch.contentType);
  const documents = buildInsertDocuments(
    validRows,
    sourceType,
    batch._id,
    actorId,
  );

  const importedRows = await insertContentDocuments(
    resolvedContentType,
    documents,
  );

  batch.status = 'completed';
  batch.importedRows = importedRows;
  batch.completedAt = new Date();
  await batch.save();

  await createAuditLog({
    actor: actorId,
    action: 'import',
    entityType: 'ImportBatch',
    entityId: batch._id,
    metadata: {
      action: 'confirm',
      importedRows,
      skippedRows,
    },
    ipAddress,
  });

  return { importedRows, skippedRows, batch };
};

export const cancelImportBatch = async (input: {
  batchId: string;
  actorId: mongoose.Types.ObjectId;
  ipAddress?: string;
}): Promise<IImportBatch> => {
  const { batchId, actorId, ipAddress } = input;
  const batch = await ImportBatch.findById(batchId);
  if (!batch) throw ApiError.notFound('임포트 배치를 찾을 수 없습니다.');

  if (batch.status === 'completed') {
    throw ApiError.badRequest('완료된 배치는 취소할 수 없습니다.');
  }

  batch.status = 'cancelled';
  await batch.save();

  await createAuditLog({
    actor: actorId,
    action: 'import',
    entityType: 'ImportBatch',
    entityId: batch._id,
    metadata: {
      action: 'cancel',
    },
    ipAddress,
  });

  return batch;
};

export const listImportBatches = async (input: {
  page: number;
  limit: number;
  status?: string;
  contentType?: string;
}): Promise<{ batches: IImportBatch[]; total: number }> => {
  const { page, limit, status, contentType } = input;
  const filter: Record<string, unknown> = {};

  if (status) filter.status = status;
  if (contentType) filter.contentType = contentType;

  const skip = (page - 1) * limit;

  const [batches, total] = await Promise.all([
    ImportBatch.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ImportBatch.countDocuments(filter),
  ]);

  return { batches, total };
};

export const getImportBatchDetail = async (batchId: string): Promise<IImportBatch> => {
  const batch = await ImportBatch.findById(batchId);
  if (!batch) throw ApiError.notFound('임포트 배치를 찾을 수 없습니다.');
  return batch;
};

export const getImportBatchErrors = async (batchId: string): Promise<IImportBatchError[]> => {
  const batch = await ImportBatch.findById(batchId).select('errors');
  if (!batch) throw ApiError.notFound('임포트 배치를 찾을 수 없습니다.');
  return batch.errors || [];
};

export const summarizeBatchErrors = (errors: IImportBatchError[]): Record<string, number> => {
  return errors.reduce<Record<string, number>>((summary, error) => {
    summary[error.field] = (summary[error.field] || 0) + 1;
    return summary;
  }, {});
};
