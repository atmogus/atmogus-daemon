import type { Brand, LolAtmogusDefsActivity } from '@atcute/client/lexicons';
import { JSDOM } from 'jsdom';

async function getSteamRichPresence(userId: string) {
    // userID type 3. <id3> = <id64> - 76561197960265728
    const url = `https://steamcommunity.com/miniprofile/${BigInt(userId) - 76561197960265728n}`;
    const { window } = await fetch(url)
        .then((e) => e.text())
        .then((e) => new JSDOM(e));
    const { document } = window;

    const appId = document
        .querySelector('.game_logo')
        ?.getAttribute('src')
        ?.match(/\/steam\/apps\/(\d+)\//)?.[1];

    const gameName = document.querySelector('.game_name')?.textContent;

    const richPresence = document.querySelector('.rich_presence')?.textContent;

    return {
        appId: appId ?? undefined,
        gameName: gameName ?? undefined,
        richPresence: richPresence ?? undefined,
    };
}

// TODO sync this interval to the activity writes interval
export async function fetchLatestSteamPresence(): Promise<Brand.Union<LolAtmogusDefsActivity.Presence>[]> {
    const userId = process.env.STEAMID64!;
    const { appId, gameName, richPresence } = await getSteamRichPresence(userId);

    if (!gameName) return [];

    console.info('Got Steam Rich Presence', { appId, gameName, richPresence });

    return [{
        $type: 'lol.atmogus.defs.activity#presence',
        name: gameName ?? 'Steam',
        state: richPresence,
        type: 'playing',
        source: {
            $type: 'lol.atmogus.defs.activity#steamActivitySource',
            gameName,
            appId: appId ? parseInt(appId) : undefined,
        },
    }] satisfies Brand.Union<LolAtmogusDefsActivity.Presence>[]; 
}