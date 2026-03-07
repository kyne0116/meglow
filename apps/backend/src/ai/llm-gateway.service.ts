import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type LlmProvider = "mock" | "openai" | "litellm" | "openai_compatible";

interface LlmProviderConfig {
  provider: LlmProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

@Injectable()
export class LlmGatewayService {
  private readonly logger = new Logger(LlmGatewayService.name);

  constructor(private readonly configService: ConfigService) {}

  async requestJsonObject(
    systemPrompt: string,
    userPrompt: string
  ): Promise<Record<string, unknown> | null> {
    const config = this.resolveProviderConfig();
    if (!config) {
      return null;
    }

    const endpoint = this.buildChatCompletionsEndpoint(config.baseUrl);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        this.logger.warn(
          `[${config.provider}] request failed status=${response.status} endpoint=${endpoint}`
        );
        return null;
      }

      const payload = (await response.json()) as ChatCompletionResponse;
      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        this.logger.warn(`[${config.provider}] empty response content`);
        return null;
      }

      const parsed = this.tryParseJsonObject(content);
      if (!parsed) {
        this.logger.warn(`[${config.provider}] response is not valid JSON object`);
      }
      return parsed;
    } catch (error: unknown) {
      this.logger.warn(`[${config.provider}] request exception: ${String(error)}`);
      return null;
    }
  }

  private resolveProviderConfig(): LlmProviderConfig | null {
    const providerRaw = (this.configService.get<string>("AI_PROVIDER") ?? "mock").toLowerCase();
    const provider: LlmProvider =
      providerRaw === "openai" || providerRaw === "litellm" || providerRaw === "openai_compatible"
        ? providerRaw
        : "mock";
    if (provider === "mock") {
      return null;
    }

    const genericModel = this.configService.get<string>("AI_MODEL") ?? "gpt-4o-mini";
    const genericBaseUrl = this.configService.get<string>("AI_BASE_URL") ?? "";
    const genericApiKey = this.configService.get<string>("AI_API_KEY") ?? "";

    if (provider === "openai") {
      const apiKey = this.configService.get<string>("OPENAI_API_KEY") ?? genericApiKey;
      if (!apiKey) {
        return null;
      }
      const openAiBaseUrl =
        (this.configService.get<string>("OPENAI_BASE_URL") ?? genericBaseUrl) ||
        "https://api.openai.com/v1";
      return {
        provider,
        baseUrl: openAiBaseUrl,
        apiKey,
        model: this.configService.get<string>("OPENAI_MODEL") ?? genericModel
      };
    }

    if (provider === "litellm") {
      const baseUrl = this.configService.get<string>("LITELLM_BASE_URL") ?? genericBaseUrl;
      const apiKey = this.configService.get<string>("LITELLM_API_KEY") ?? genericApiKey;
      if (!baseUrl || !apiKey) {
        return null;
      }
      return {
        provider,
        baseUrl,
        apiKey,
        model: this.configService.get<string>("LITELLM_MODEL") ?? genericModel
      };
    }

    const baseUrl = this.configService.get<string>("OPENAI_COMPAT_BASE_URL") ?? genericBaseUrl;
    const apiKey = this.configService.get<string>("OPENAI_COMPAT_API_KEY") ?? genericApiKey;
    if (!baseUrl || !apiKey) {
      return null;
    }
    return {
      provider,
      baseUrl,
      apiKey,
      model: this.configService.get<string>("OPENAI_COMPAT_MODEL") ?? genericModel
    };
  }

  private buildChatCompletionsEndpoint(baseUrl: string): string {
    const trimmed = baseUrl.replace(/\/+$/, "");
    if (trimmed.endsWith("/v1")) {
      return `${trimmed}/chat/completions`;
    }
    if (trimmed.endsWith("/chat/completions")) {
      return trimmed;
    }
    return `${trimmed}/v1/chat/completions`;
  }

  private tryParseJsonObject(content: string): Record<string, unknown> | null {
    const normalized = content.trim();
    if (!normalized) {
      return null;
    }

    const direct = this.tryParseObject(normalized);
    if (direct) {
      return direct;
    }

    const fenced = normalized.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced && fenced[1]) {
      return this.tryParseObject(fenced[1].trim());
    }

    return null;
  }

  private tryParseObject(raw: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
