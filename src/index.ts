import 'dotenv/config';

import { fetchLatestHonoPresence } from './providers/hono.js';
import { fetchLatestSteamPresence } from './providers/steam.js';
import type { Brand, LolAtmogusDefsActivity } from '@atcute/client/lexicons';
import { writeActivity } from './activity.js';

setInterval(() => {
    (async () => {
        const presences: Brand.Union<LolAtmogusDefsActivity.Presence>[] = [];

        presences.push(...(await fetchLatestHonoPresence()));
        presences.push(...(await fetchLatestSteamPresence()));

        await writeActivity(presences);
    })().catch(console.error);
}, 1000 * 15);
