import { BadGatewayException } from '@nestjs/common';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProviderName, Chat } from '../../generated/prisma/client.js';

export interface AIResponse {
    text: string;
    model: string;
}

export async function callAIProvider(
    provider: AIProviderName,
    apiKey: string,
    prompt: string,
    model?: string,
    history: Chat[] = [],
): Promise<AIResponse> {
    try {
        switch (provider) {
            case 'OPENAI':
                return await callOpenAI(apiKey, prompt, model, history);
            case 'CLAUDE':
                return await callClaude(apiKey, prompt, model, history);
            case 'GEMINI':
                return await callGemini(apiKey, prompt, model, history);
            default:
                throw new BadGatewayException(`Unsupported provider: ${provider}`);
        }
    } catch (error: any) {
        throw new BadGatewayException(
            `${provider} request failed: ${error?.message ?? 'Unknown error'}`,
        );
    }
}

async function callOpenAI(
    apiKey: string,
    prompt: string,
    model: string | undefined,
    history: Chat[],
): Promise<AIResponse> {
    const client = new OpenAI({ apiKey });
    const selectedModel = model ?? process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-4o-mini';

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    for (const turn of history) {
        messages.push({ role: 'user', content: turn.prompt });
        messages.push({ role: 'assistant', content: turn.response });
    }
    messages.push({ role: 'user', content: prompt });

    const completion = await client.chat.completions.create({
        model: selectedModel,
        messages,
    });
    return { text: completion.choices[0]?.message?.content ?? '', model: selectedModel };
}

async function callClaude(
    apiKey: string,
    prompt: string,
    model: string | undefined,
    history: Chat[],
): Promise<AIResponse> {
    const client = new Anthropic({ apiKey });
    const selectedModel = model ?? process.env.CLAUDE_DEFAULT_MODEL ?? 'claude-3-5-haiku-20241022';

    const messages: Anthropic.MessageParam[] = [];
    for (const turn of history) {
        messages.push({ role: 'user', content: turn.prompt });
        messages.push({ role: 'assistant', content: turn.response });
    }
    messages.push({ role: 'user', content: prompt });

    const message = await client.messages.create({
        model: selectedModel,
        max_tokens: 1024,
        messages,
    });
    const textBlock = message.content.find((block) => block.type === 'text');
    return {
        text: textBlock?.type === 'text' ? textBlock.text : '',
        model: selectedModel,
    };
}

async function callGemini(
    apiKey: string,
    prompt: string,
    model: string | undefined,
    history: Chat[],
): Promise<AIResponse> {
    const client = new GoogleGenerativeAI(apiKey);
    const selectedModel = model ?? process.env.GEMINI_DEFAULT_MODEL ?? 'gemini-3.5-flash-lite';
    const genModel = client.getGenerativeModel({ model: selectedModel });

    const historyForGemini = history.flatMap((turn) => [
        { role: 'user' as const, parts: [{ text: turn.prompt }] },
        { role: 'model' as const, parts: [{ text: turn.response }] },
    ]);

    const chatSession = genModel.startChat({ history: historyForGemini });
    const result = await chatSession.sendMessage(prompt);
    return { text: result.response.text(), model: selectedModel };
}