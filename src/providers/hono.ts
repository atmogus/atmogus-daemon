import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import type {} from '../lexicon';
import type { Brand, LolAtmogusDefsActivity } from '@atcute/client/lexicons';

const app = new Hono();

app.use('*', cors());

const latestPresencePerSource: Record<string, Brand.Union<LolAtmogusDefsActivity.Presence>[]> = {};

app.post('/api/:source/activity', async (c) => {
    const json: Brand.Union<LolAtmogusDefsActivity.Presence>[] = await c.req.json();

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

export async function fetchLatestHonoPresence(): Promise<Brand.Union<LolAtmogusDefsActivity.Presence>[]> {
    return Promise.resolve(Object.values(latestPresencePerSource).flat());
}