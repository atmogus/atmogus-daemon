import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import type { Brand, LolAtmogusDefsActivity } from '@atcute/client/lexicons';

const app = new Hono();

app.use('*', cors());

let latestPresence: Brand.Union<LolAtmogusDefsActivity.Presence>[] = [];

app.post('/api/discord/activity', async (c) => {
    const json: Brand.Union<LolAtmogusDefsActivity.Presence>[] = await c.req.json();

    latestPresence = json;

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

export async function fetchLatestDiscordPresence(): Promise<Brand.Union<LolAtmogusDefsActivity.Presence>[]> {
    return Promise.resolve(latestPresence);
}