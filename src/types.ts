import type { Brand, LolAtmogusDefsActivity } from "@atcute/client/lexicons";

export interface DetectedPresence {
    tid?: string;
    id: string;
    startedAt?: string;
    endedAt?: string;
    presences: Brand.Union<LolAtmogusDefsActivity.Presence>[];
}