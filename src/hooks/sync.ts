import { atom } from "jotai";
import { PullResult, PushPendingResult } from "../syncEngine/types";

export type RunSyncResult = {
  pushed: PushPendingResult;
  pulled: PullResult;
};

export type SyncState = {
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  lastSyncResult: {
    pushed: PushPendingResult;
    pulled: PullResult;
  } | null;
};

export const SyncStateAtom = atom<SyncState>({
  isSyncing: false,
  lastSyncAt: null,
  lastSyncError: null,
  lastSyncResult: null,
});