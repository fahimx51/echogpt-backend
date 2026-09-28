import {
    BadGatewayException,
    InternalServerErrorException,
} from '@nestjs/common';

export interface SerperResult {
    title: string;
    link: string;
    snippet: string;
}

const SERPER_URL = 'https://google.serper.dev/search';
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RESULTS = 5;

export async function searchWeb(query: string): Promise<SerperResult[]> {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
        throw new InternalServerErrorException('Web search is not configured');
    }

    let response: Response;
    try {
        response = await fetch(SERPER_URL, {
            method: 'POST',
            headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: query }),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
    } catch {
        throw new BadGatewayException('Search provider request failed or timed out');
    }

    if (!response.ok) {
        throw new BadGatewayException(
            `Search provider returned an error (status ${response.status})`,
        );
    }

    let data: { organic?: Array<Partial<SerperResult>> };
    try {
        data = await response.json();
    } catch {
        throw new BadGatewayException('Search provider returned an invalid response');
    }

    return (data.organic ?? []).slice(0, MAX_RESULTS).map((r) => ({
        title: r.title ?? '',
        link: r.link ?? '',
        snippet: r.snippet ?? '',
    }));
}