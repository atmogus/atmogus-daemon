import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import type {} from '../lexicon.js';
import type { DetectedPresence } from "../types.js";

const app = new Hono();

app.use('*', cors());

const latestPresencePerSource: Record<string, DetectedPresence[]> = {};

app.post('/api/:source/activity', async (c) => {
    const json: DetectedPresence[] = await c.req.json();

    latestPresencePerSource[c.req.param('source')] = json;

    return c.json({ ok: true });
});

const server = serve(
    {
        fetch: app.fetch,
        port: 18420,
    },
    (info) => {
        console.log('Discord-daemon server started', info);
    },
);

export async function fetchLatestHonoPresence(): Promise<DetectedPresence[]> {
    return Promise.resolve(Object.values(latestPresencePerSource).flat());
}