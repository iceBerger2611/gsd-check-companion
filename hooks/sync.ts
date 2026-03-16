import { PushPendingResult } from "@/db/sync";
import { atom, createStore } from "jotai";

export type RunSyncResult = {
  pushed: PushPendingResult;
  pulled: number;
};

export type SyncState = {
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  lastSyncResult: {
    pushed: PushPendingResult;
    pulled: number;
  } | null;
};

export const SyncStateAtom = atom<SyncState>({
  isSyncing: false,
  lastSyncAt: null,
  lastSyncError: null,
  lastSyncResult: null,
});

export const store = createStore();
