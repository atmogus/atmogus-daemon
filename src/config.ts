import type { AtpSessionData } from '@atcute/client';
import { KVS } from 'sqlite-kvs-ts';

interface Config {
    bskySession: AtpSessionData;
}

const kvs = new KVS<keyof Config, Config[keyof Config]>('config.db', 'config');

export function getConfigItem<K extends keyof Config>(key: K): Config[K] {
    return kvs.get(key);
}

export function setConfigItem<K extends keyof Config>(key: K, value: Config[K]): void {
    kvs.set(key, value);
}
