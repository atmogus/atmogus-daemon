import type { Brand, LolAtmogusDefsActivity } from "@atcute/client/lexicons"

export interface ActivityPresenceEvent {
    activityEndedAt?: string
    //id: string
    presence: Brand.Union<LolAtmogusDefsActivity.Presence>
}

export interface DetectedPresence {
    recordCreatedAt?: Date
    tid?: string
    id: string
    presences: ActivityPresenceEvent[]
}