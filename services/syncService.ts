import { RunSyncResult, SyncStateAtom } from "@/hooks/sync";
import { getErrorMessage, nowIso } from "@/repos/utils";
import { store } from "@/store";
import { pullChanges } from "@/syncEngine/pull";
import { pushPendingChanges } from "@/syncEngine/push";

const syncWork = async (): Promise<RunSyncResult> => {
  const pushed = await pushPendingChanges();
  const pulled = await pullChanges();

  console.log(pushed, pulled);
  return { pushed, pulled };
};

let syncPromise: Promise<RunSyncResult> | null = null;

export const runSync = async () => {
  if (syncPromise) return syncPromise;
  store.set(SyncStateAtom, {
    isSyncing: true,
    lastSyncError: null,
    lastSyncAt: null,
    lastSyncResult: null,
  });

  syncPromise = syncWork()
    .then((result) => {
      store.set(SyncStateAtom, {
        isSyncing: false,
        lastSyncAt: nowIso(),
        lastSyncError: null,
        lastSyncResult: {
          pulled: result.pulled,
          pushed: result.pushed,
        },
      });
      return result;
    })
    .catch((error) => {
      const errorMessage = getErrorMessage(error);
      store.set(SyncStateAtom, {
        isSyncing: false,
        lastSyncAt: null,
        lastSyncError: errorMessage,
        lastSyncResult: null,
      });
      throw error;
    })
    .finally(() => {
      syncPromise = null;
    });
};
