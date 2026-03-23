export type ProviderName = 'bedrock' | 'openai'

export type BedrockModel = 'anthropic.claude-3-7-sonnet-20250219-v1:0' | 'openai.gpt-oss-120b-1:0'

export type OpenAIModelId = 'gpt-5.4-nano' | 'gpt-5.3-codex'

// Source: https://developers.openai.com/api/docs/guides/reasoning + per-model pages
export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'

// Per-model reasoning effort compatibility.
// Sources: https://developers.openai.com/api/docs/models/gpt-5.4-nano
//          https://developers.openai.com/api/docs/models/gpt-5.3-codex
type ModelReasoningSupport = {
  'gpt-5.4-nano': 'none' | 'low' | 'medium' | 'high' | 'xhigh'
  'gpt-5.3-codex': 'low' | 'medium' | 'high' | 'xhigh'
}

/** Type-safe factory for configuring OpenAI models with compatible reasoning efforts. */
export function openaiModelEntry<ModelId extends OpenAIModelId>(config: {
  id: ModelId
  /**
   * When omitted, OpenAI applies its own default reasoning effort for the model,
   * which may not be zero. Use an explicit level to control cost and latency.
   */
  reasoningEffort?: ModelId extends keyof ModelReasoningSupport
    ? ModelReasoningSupport[ModelId]
    : never
}) {
  return config
}

export type OpenAIModelEntry = ReturnType<typeof openaiModelEntry>

/** Default model entry for simple completion endpoints where latency is more important than reasoning. */
export const DEFAULT_COMPLETION_MODEL = openaiModelEntry({
  id: 'gpt-5.4-nano',
  reasoningEffort: 'none',
})

// Models available to all users (free tier).
export const ASSISTANT_MODELS_BASE = [
  openaiModelEntry({ id: 'gpt-5.4-nano', reasoningEffort: 'low' }),
] as const

// Models restricted to users with `assistant.advance_model` entitlement (paid plans).
export const ASSISTANT_MODELS_ADVANCE_ONLY = [
  openaiModelEntry({ id: 'gpt-5.3-codex', reasoningEffort: 'low' }),
] as const

// Single source of truth for all Assistant chat model variants and their reasoning levels.
export const ASSISTANT_MODELS = [
  ...ASSISTANT_MODELS_BASE,
  ...ASSISTANT_MODELS_ADVANCE_ONLY,
] as const

export type AssistantBaseModelId = (typeof ASSISTANT_MODELS_BASE)[number]['id']
export type AssistantModelId = (typeof ASSISTANT_MODELS)[number]['id']

export const DEFAULT_ASSISTANT_BASE_MODEL_ID = 'gpt-5.4-nano' satisfies AssistantBaseModelId

export const DEFAULT_ASSISTANT_ADVANCE_MODEL_ID = 'gpt-5.3-codex' satisfies AssistantModelId

export function defaultAssistantModelId(hasAccessToAdvanceModel: boolean): AssistantModelId {
  return hasAccessToAdvanceModel
    ? DEFAULT_ASSISTANT_ADVANCE_MODEL_ID
    : DEFAULT_ASSISTANT_BASE_MODEL_ID
}

const ASSISTANT_BASE_MODEL_IDS = new Set<string>(ASSISTANT_MODELS_BASE.map((m) => m.id))

const ASSISTANT_ADVANCE_ONLY_MODEL_IDS = new Set<string>(
  ASSISTANT_MODELS_ADVANCE_ONLY.map((m) => m.id)
)

const ASSISTANT_ALL_MODEL_IDS = new Set<string>(ASSISTANT_MODELS.map((m) => m.id))

export function isAssistantBaseModelId(id: string): id is AssistantBaseModelId {
  return ASSISTANT_BASE_MODEL_IDS.has(id)
}

export function isAdvanceOnlyModelId(id: string): boolean {
  return ASSISTANT_ADVANCE_ONLY_MODEL_IDS.has(id)
}

export function isKnownAssistantModelId(id: string): id is AssistantModelId {
  return ASSISTANT_ALL_MODEL_IDS.has(id)
}

export function getAssistantModelEntry(
  id: AssistantModelId
): (typeof ASSISTANT_MODELS)[number] | undefined {
  return ASSISTANT_MODELS.find((m) => m.id === id)
}

export type Model = BedrockModel | OpenAIModelId

export type ProviderModelConfig = {
  /** Optional providerOptions to attach to the system message for this model */
  promptProviderOptions?: Record<string, any>
  /** The default model for this provider (used when limited or no preferred specified) */
  default: boolean
}

export type ProviderRegistry = {
  bedrock: {
    models: Record<BedrockModel, ProviderModelConfig>
    providerOptions?: Record<string, any>
  }
  openai: {
    models: Record<OpenAIModelId, ProviderModelConfig>
    providerOptions?: Record<string, any>
  }
}

export const PROVIDERS: ProviderRegistry = {
  bedrock: {
    models: {
      'anthropic.claude-3-7-sonnet-20250219-v1:0': {
        promptProviderOptions: {
          bedrock: {
            // Always cache the system prompt (must not contain dynamic content)
            cachePoint: { type: 'default' },
          },
        },
        default: false,
      },
      'openai.gpt-oss-120b-1:0': {
        default: true,
      },
    },
  },
  openai: {
    models: {
      'gpt-5.3-codex': { default: false },
      'gpt-5.4-nano': { default: true },
    },
    providerOptions: {
      openai: {
        store: false,
      },
    },
  },
}

export function getDefaultModelForProvider(provider: ProviderName): Model | undefined {
  const models = PROVIDERS[provider]?.models as Record<Model, ProviderModelConfig>
  if (!models) return undefined

  return Object.keys(models).find((id) => models[id as Model]?.default) as Model | undefined
}
