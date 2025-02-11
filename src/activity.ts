import type { Brand, LolAtmogusActivityPresences, LolAtmogusDefsActivity } from '@atcute/client/lexicons';
import { getLoggedInAgent } from './atproto.js';
import { now as tidNow } from '@atcute/tid';

function createRecordFromPresences(presences: Brand.Union<LolAtmogusDefsActivity.Presence>[], createdAt: Date) {
    // create activity record
    const record: LolAtmogusActivityPresences.Record = {
        $type: 'lol.atmogus.activity.presences',
        presences,
        createdAt: createdAt.toISOString(),
    };

    console.info('Created presences record', record);

    return record;
}

let lastPresences: Brand.Union<LolAtmogusDefsActivity.Presence>[] = [];
export async function writeActivity(presences: Brand.Union<LolAtmogusDefsActivity.Presence>[]) {
    if (deepEqual(presences, lastPresences)) {
        console.info('Presences are the same as last time; skipping write');
        return;
    }

    lastPresences = presences;

    const record = createRecordFromPresences(presences, new Date());

    const { agent, user } = await getLoggedInAgent();

    agent.create({
        collection: 'lol.atmogus.activity.presences',
        rkey: tidNow(),
        repo: user,
        record: record,
    });
    console.info('Created activity record', record);
}

// https://stackoverflow.com/a/77278013
function deepEqual<T>(a: T, b: T): boolean {
    if (a === b) {
        return true;
    }

    const bothAreObjects = a && b && typeof a === 'object' && typeof b === 'object';

    return Boolean(
        bothAreObjects &&
            Object.keys(a).length === Object.keys(b).length &&
            Object.entries(a).every(([k, v]) => deepEqual(v, b[k as keyof T])),
    );
}
