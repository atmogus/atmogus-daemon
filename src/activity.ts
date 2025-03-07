import type { Brand, ComAtprotoRepoApplyWrites, LolAtmogusActivityPresences, LolAtmogusDefsActivity } from '@atcute/client/lexicons';
import { getLoggedInAgent } from './atproto.js';
import { now as tidNow } from '@atcute/tid';
import type { ActivityPresenceEvent, DetectedPresence } from './types.js';

/*
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
*/

function createRecordFromPresences(presence: DetectedPresence) {
    console.log(`Creating activity record for ${presence.id}`);

    for (let activityIndex = 0; activityIndex < presence.presences.length; activityIndex++) {
        let activity = presence.presences[activityIndex];

        console.log(`   Found activity ${activity.presence.name}`)
    }

    let lastPresence = presence.presences.find(p => p.activityEndedAt != null);

    const record : LolAtmogusActivityPresences.Record = {
        $type: 'lol.atmogus.activity.presences',
        activityEndedAt: lastPresence?.activityEndedAt ?? undefined,
        presences: presence.presences.flatMap(p => p.presence),
        createdAt: presence.recordCreatedAt?.toISOString() ?? new Date().toISOString()
    }

    console.info('Created activity record', record);

    return record;
}

let presencesHistory : DetectedPresence[] = [];
let lastPresences: DetectedPresence[] = [];

// TODO: presence entries can be duplicated (see: https://purr.mrrp.lol/xrpc/com.atproto.repo.getRecord?repo=did:plc:tshzimytn4vesorvxd45kjn7&collection=lol.atmogus.activity.presences&rkey=3ljrmw63tkkzy)
export async function writeActivity(presences: DetectedPresence[]) {
    console.log(presences, lastPresences);

    if (deepEqual(presences, lastPresences)) {
        console.info('Presences are the same as last time; skipping write');
        return;
    }

    if (presences.length < 1 && lastPresences.length > 0) {
        console.info('Presences is empty; skipping write');
        return;
    }

    lastPresences = presences;

    const batches: Brand.Union<ComAtprotoRepoApplyWrites.Create | ComAtprotoRepoApplyWrites.Update>[] = [];

    let presencesToDelete : DetectedPresence[] = []

    for (let i = 0; i < presences.length; i++) {
        let detectedPresence = presences[i];
        let historicalPresence = presencesHistory.find(histPresence => histPresence.id === detectedPresence.id);
        let lastPresenceIndex = detectedPresence.presences.findIndex(p => p.activityEndedAt != null);

        console.log(`presences ${detectedPresence.id}`);

        // check if the presence has activities
        if (detectedPresence.presences != null && detectedPresence.presences.length > 0) {
            let hasTid = historicalPresence?.tid != null;

            let tid = historicalPresence?.tid ?? tidNow();

            if (!hasTid) {
                console.log(`  creating tid`);

                detectedPresence.tid = tid;

                historicalPresence = detectedPresence;
                historicalPresence.recordCreatedAt = new Date();

                presencesHistory.push(historicalPresence);
            } else {
                console.log(`  adding to presence list`);
                
                let pIndex = presencesHistory.findIndex(histPresence => histPresence.id == detectedPresence.id);

                for (let i = 0; i < detectedPresence.presences.length; i++) {
                    if (presencesHistory[pIndex].presences[0] != detectedPresence.presences[i]) {
                        presencesHistory[pIndex].presences.unshift(detectedPresence.presences[i]);
                    }
                }
            }

            historicalPresence = presencesHistory.find(histPresence => histPresence.id === detectedPresence.id);

            if (historicalPresence != null) {
                let record = createRecordFromPresences(historicalPresence);

                batches.push({
                    $type: hasTid ? 'com.atproto.repo.applyWrites#update' : 'com.atproto.repo.applyWrites#create',
                    collection: 'lol.atmogus.activity.presences',
                    rkey: tid,
                    value: record,
                });

                // presence doesnt exist anymore. mark as delete!
                if (lastPresenceIndex >= 0) {
                    console.log(`  record over !`);

                    presencesToDelete.push(detectedPresence);
                }
            }
        }
    }

    // remove all entries from history that match presencesToDelete
    presencesHistory = presencesHistory.filter(pres => !presencesToDelete.includes(pres));

    const { agent, user } = await getLoggedInAgent();

    console.log(`Found ${batches.length} batches`);

    agent.batchWrite({
        repo: user,
        writes: batches
    });

    console.info('Created activity records', writeActivity);
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
