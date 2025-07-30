
export interface SFLField {
  topic: string;
  taskType: string;
  domainSpecifics: string;
  keywords: string; // comma-separated
}

export interface SFLTenor {
  aiPersona: string;
  targetAudience: string[];
  desiredTone: string;
  interpersonalStance: string;
}

export interface SFLMode {
  outputFormat: string;
  rhetoricalStructure: string;
  lengthConstraint: string;
  textualDirectives: string;
}

export interface PromptSFL {
  id: string;
  title: string;
  promptText: string;
  sflField: SFLField;
  sflTenor: SFLTenor;
  sflMode: SFLMode;
  exampleOutput?: string;
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  geminiResponse?: string;
  geminiTestError?: string;
  isTesting?: boolean;
}

export interface Filters {
  searchTerm: string;
  topic: string;
  taskType: string;
  aiPersona: string;
  outputFormat: string;
}

export enum ModalType {
  NONE,
  CREATE_EDIT_PROMPT,
  VIEW_PROMPT_DETAIL,
  WIZARD,
  HELP,
}