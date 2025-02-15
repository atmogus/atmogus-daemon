import type { Brand, ComAtprotoRepoApplyWrites, LolAtmogusActivityPresences, LolAtmogusDefsActivity } from '@atcute/client/lexicons';
import { getLoggedInAgent } from './atproto.js';
import { now as tidNow } from '@atcute/tid';
import type { DetectedPresence } from './types.js';


function createRecordFromPresences(presences: DetectedPresence, createdAt: Date) {
    console.log("CREATE PRESENCES FROM RECORD !!");

    for (let rec in presences.presences) {
        console.log("found activity", rec);
    }

    // create activity record
    const record: LolAtmogusActivityPresences.Record = {
        $type: 'lol.atmogus.activity.presences',
        presences: presences.presences,
        createdAt: createdAt.toISOString()
    };

    console.info('Created presences record', record);

    return record;
}

let presencesHistory: DetectedPresence[] = [];

let lastPresences: DetectedPresence[] = [];

export async function writeActivity(presences: DetectedPresence[]) {
    if (deepEqual(presences, lastPresences)) {
        console.info('Presences are the same as last time; skipping write');
        return;
    }

    if (presences.length < 1 && lastPresences.length > 0) {
        console.info('Presences is empty; skipping write');
        return;
    }

    lastPresences = presences;

    let records: LolAtmogusActivityPresences.Record[] = [];

    const batches: Brand.Union<ComAtprotoRepoApplyWrites.Create | ComAtprotoRepoApplyWrites.Update>[] = [];

    for (let i = 0; i < presences.length; i++) {
        let p = presences[i];
        let histPresence = presencesHistory.find(ph => p.id == ph.id);

        if (p.presences != null && p.presences.length > 0) {
            let record = createRecordFromPresences(p, new Date());
            let hasTid = histPresence?.tid != null;
            
            if (!hasTid) {
                p.tid = tidNow();

                histPresence = p;
                presencesHistory.push(p);
            }

            batches.push({
                $type: hasTid ? 'com.atproto.repo.applyWrites#update' : 'com.atproto.repo.applyWrites#create',
                collection: 'lol.atmogus.activity.presences',
                rkey: histPresence?.tid ?? tidNow(),
                value: record,
            });

            records.push(record);
        }
    };

    const { agent, user } = await getLoggedInAgent();

    console.log("Found", batches.length, "batches")

    agent.batchWrite({
        repo: user,
        writes: batches
    });

    console.info('Created activity records', createRecordFromPresences);
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
