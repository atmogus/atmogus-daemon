import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import type {} from '../lexicon';
import type { ActivityPresenceEvent, DetectedPresence } from '@/types.js';

const app = new Hono();

app.use('*', cors());

let latestPresencePerSource: Record<string, DetectedPresence[]> = {};

app.post('/api/:source/activity', async (c) => {
    const json: ActivityPresenceEvent[] = await c.req.json();

    let source = c.req.param('source');

    if (latestPresencePerSource[source] == null) {
        latestPresencePerSource[source] = [ ];
    }

    json.forEach(activityPresenceEvent => {
        console.log(`Received ${activityPresenceEvent.presence.name} from ${source}`);

        // if detectedActivity for this id doesnt exist, create it
        if (latestPresencePerSource[source].find(detected => detected.id == activityPresenceEvent.presence.name) == null) {
            latestPresencePerSource[source].push({
                id: activityPresenceEvent.presence.name,
                presences: [ ]
            });
        }

        let detectedPresenceIndex = latestPresencePerSource[source].findIndex(detected => detected.id == activityPresenceEvent.presence.name);
        let detectedPresence = latestPresencePerSource[source][detectedPresenceIndex];

        // TODO: better method for filtering? Filtering plugin-side?
        //       concern is for song replays on Spotify; will (might?) get filtered out,
        //       which is undesired.
        if (detectedPresence.presences[0] != activityPresenceEvent) {
            detectedPresence.presences.unshift(activityPresenceEvent);
        }
    });

    return c.json({ ok: true });
});

const server = serve(
    {
        fetch: app.fetch,
        port: 18420,
    },
    (info) => {
        console.log('Atmogus daemon server started', info);
    },
);

export async function fetchLatestHonoPresence(): Promise<DetectedPresence[]> {
    let presences = Object.values(latestPresencePerSource).flat();

    latestPresencePerSource = { };
    
    return Promise.resolve(presences);
}