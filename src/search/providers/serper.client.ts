import { BadGatewayException } from '@nestjs/common';

export interface SerperResult {
    title: string;
    link: string;
    snippet: string;
}

export async function searchWeb(query: string): Promise<SerperResult[]> {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
        throw new Error('SERPER_API_KEY is not set in environment variables');
    }

    const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query }),
    });

    if (!response.ok) {
        throw new BadGatewayException(`Serper search failed: ${response.statusText}`);
    }

    const data = await response.json();

    const organic = (data.organic ?? []) as any[];
    return organic.slice(0, 5).map((r) => ({
        title: r.title ?? '',
        link: r.link ?? '',
        snippet: r.snippet ?? '',
    }));
}