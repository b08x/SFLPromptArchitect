export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  body: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Frontend PromptSFL types for data mapping
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
  sourceDocument?: {
    name: string;
    content: string;
  };
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  graph_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}
