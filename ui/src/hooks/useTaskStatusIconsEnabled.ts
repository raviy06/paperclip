import { useContext } from "react";
import { QueryClient, QueryClientContext, useQuery } from "@tanstack/react-query";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Fallback client for hosts that render gated components without a
 * QueryClientProvider (isolated unit-test mounts, storybook-style renders).
 * The query is disabled in that case, so this client never fetches — it only
 * keeps `useQuery` from throwing. Created lazily so app code never pays for it.
 */
let detachedClient: QueryClient | null = null;
function getDetachedClient(): QueryClient {
  detachedClient ??= new QueryClient();
  return detachedClient;
}

/**
 * Task Status Icons experimental flag (PAP-234 / PAP-237).
 *
 * Wraps the shared experimental-settings query so gated call sites don't
 * repeat the boilerplate. `enabled` stays false while the query is in
 * flight (no flash of gated UI, same as `useConferenceRoomChatEnabled`);
 * `loaded` lets call sites avoid swapping presentation before the flag
 * value is actually known.
 *
 * Renders without a QueryClientProvider resolve to the flag-off default
 * (`{ enabled: false, loaded: true }`) instead of throwing, so widely shared
 * leaf components like StatusIcon stay mountable in isolation.
 *
 * Flag OFF = today's behavior, unchanged. Adoption lands in PAP-234's 3c.
 */
export function useTaskStatusIconsEnabled(): { enabled: boolean; loaded: boolean } {
  const contextClient = useContext(QueryClientContext);
  const { data, isFetched } = useQuery(
    {
      queryKey: queryKeys.instance.experimentalSettings,
      queryFn: () => instanceSettingsApi.getExperimental(),
      enabled: contextClient != null,
    },
    contextClient ?? getDetachedClient(),
  );
  if (!contextClient) {
    return { enabled: false, loaded: true };
  }
  return { enabled: data?.enableTaskStatusIcons === true, loaded: isFetched };
}
