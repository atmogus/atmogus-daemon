import type { AtpSessionData } from "@atcute/client";
import { KittyAgent } from "kitty-agent";
import { getConfigItem, setConfigItem } from "./config.js";

let agentPromise: Promise<{ agent: KittyAgent, user: string }> | undefined = undefined;
export async function getLoggedInAgent() {
  agentPromise ??= (async () => {
    const identifier = process.env.BSKY_USERNAME!;
    const password = process.env.BSKY_PASSWORD!;

    const { agent, manager } = await KittyAgent.createPdsWithCredentials(identifier);

    let session = getConfigItem('bskySession');
    if (session) {
      try {
        await manager.resume(session);
        console.info("resumed session");
      } catch (err) {
        console.warn("failed to resume session", err);
        session = await manager.login({ identifier, password });
        setConfigItem('bskySession', session);
      }
    } else {
      session = await manager.login({ identifier, password });
      setConfigItem('bskySession', session);
    }

    return { agent, user: identifier };
  })();

  return agentPromise;
}
