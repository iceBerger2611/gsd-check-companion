import {
  getCareLinkByIdSafe,
  listPendingCareLinks,
  markCareLinkFailed,
  markCareLinkSynced,
  upsertCareLinkFromRemote,
} from "@/repos/local/careLinks.repo";
import {
  getFollowupByIdSafe,
  listPendingFollowups,
  markFollowupFailed,
  markFollowupSynced,
  upsertFollowupFromRemote,
} from "@/repos/local/followups.repo";
import {
  getProfileByIdSafe,
  listPendingProfiles,
  markProfileFailed,
  markProfileSynced,
  upsertProfileFromRemote,
} from "@/repos/local/profiles.repo";
import {
  getReadingByIdSafe,
  listPendingReadings,
  markReadingFailed,
  markReadingSynced,
  upsertReadingFromRemote,
} from "@/repos/local/readings.repo";
import { getSyncCursor, setSyncCursor } from "@/repos/local/syncState.repo";
import {
  getThresholdRuleByIdSafe,
  listPendingThresholdRules,
  markThresholdRuleFailed,
  markThresholdRuleSynced,
  upsertThresholdRuleFromRemote,
} from "@/repos/local/thresholdRules.repo";
import {
  fetchRemoteCareLinksChangedSince,
  upsertRemoteCareLink,
} from "@/repos/remote/careLinks.remote";
import {
  fetchRemoteFollowupsChangedSince,
  upsertRemoteFollowup,
} from "@/repos/remote/followups.remote";
import {
  fetchRemoteProfilesChangedSince,
  upsertRemoteProfile,
} from "@/repos/remote/profiles.remote";
import {
  fetchRemoteReadingsChangedSince,
  upsertRemoteReading,
} from "@/repos/remote/readings.remote";
import {
  fetchRemoteThresholdRulesChangedSince,
  upsertRemoteThresholdRule,
} from "@/repos/remote/thresholdRules.remote";
import {
  getErrorMessage,
  mapLocalCareLinkToRemote,
  mapLocalFollowupToRemote,
  mapLocalProfileToRemote,
  mapLocalReadingToRemote,
  mapLocalThresholdRuleToRemote,
  mapRemoteCareLinkToLocal,
  mapRemoteFollowupToLocal,
  mapRemoteProfileToLocal,
  mapRemoteReadingToLocal,
  mapRemoteThresholdRuleToLocal,
} from "@/repos/utils";
import { SyncCursorKeys } from "./schema";

export type PushPendingResult = {
  attempted: number;
  succeeded: number;
  failed: number;
};

export const pushPendingReadings = async (): Promise<PushPendingResult> => {
  const pendingRows = await listPendingReadings();

  const result: PushPendingResult = {
    attempted: 0,
    failed: 0,
    succeeded: 0,
  };

  for (const row of pendingRows) {
    result.attempted++;
    try {
      const payload = mapLocalReadingToRemote(row);
      await upsertRemoteReading(payload);
      result.succeeded++;
      await markReadingSynced(row.id);
    } catch (error) {
      result.failed++;
      await markReadingFailed(row.id, getErrorMessage(error));
    }
  }

  return result;
};

export const pushPendingFollowups = async (): Promise<PushPendingResult> => {
  const pendingRows = await listPendingFollowups();

  const result: PushPendingResult = {
    attempted: 0,
    failed: 0,
    succeeded: 0,
  };

  for (const row of pendingRows) {
    result.attempted++;
    try {
      const payload = mapLocalFollowupToRemote(row);
      await upsertRemoteFollowup(payload);
      result.succeeded++;
      await markFollowupSynced(row.id);
    } catch (error) {
      result.failed++;
      await markFollowupFailed(row.id, getErrorMessage(error));
    }
  }

  return result;
};

export const pushPendingThresholdRules =
  async (): Promise<PushPendingResult> => {
    const pendingRows = await listPendingThresholdRules();

    const result: PushPendingResult = {
      attempted: 0,
      failed: 0,
      succeeded: 0,
    };

    for (const row of pendingRows) {
      result.attempted++;
      try {
        const payload = mapLocalThresholdRuleToRemote(row);
        await upsertRemoteThresholdRule(payload);
        result.succeeded++;
        await markThresholdRuleSynced(row.id);
      } catch (error) {
        result.failed++;
        await markThresholdRuleFailed(row.id, getErrorMessage(error));
      }
    }

    return result;
  };

export const pushPendingCareLinks = async (): Promise<PushPendingResult> => {
  const pendingRows = await listPendingCareLinks();

  const result: PushPendingResult = {
    attempted: 0,
    failed: 0,
    succeeded: 0,
  };

  for (const row of pendingRows) {
    result.attempted++;
    try {
      const payload = mapLocalCareLinkToRemote(row);
      await upsertRemoteCareLink(payload);
      result.succeeded++;
      await markCareLinkSynced(row.id);
    } catch (error) {
      result.failed++;
      await markCareLinkFailed(row.id, getErrorMessage(error));
    }
  }

  return result;
};

export const pushPendingProfiles = async (): Promise<PushPendingResult> => {
  const pendingRows = await listPendingProfiles();

  const result: PushPendingResult = {
    attempted: 0,
    failed: 0,
    succeeded: 0,
  };

  for (const row of pendingRows) {
    result.attempted++;
    try {
      const payload = mapLocalProfileToRemote(row);
      await upsertRemoteProfile(payload);
      result.succeeded++;
      await markProfileSynced(row.id);
    } catch (error) {
      result.failed++;
      await markProfileFailed(row.id, getErrorMessage(error));
    }
  }

  return result;
};

export const pushPendingChanges = async (): Promise<PushPendingResult> => {
  const finalResult: PushPendingResult = {
    attempted: 0,
    failed: 0,
    succeeded: 0,
  };

  const profileResults = await pushPendingProfiles();
  const careLinkResults = await pushPendingCareLinks();
  //const thresholdRuleResults = await pushPendingThresholdRules();
  const readingResults = await pushPendingReadings();
  const followupResults = await pushPendingFollowups();

  const results = [
    profileResults,
    careLinkResults,
    //thresholdRuleResults,
    readingResults,
    followupResults,
  ];

  results.forEach((result) => {
    finalResult.attempted += result.attempted;
    finalResult.succeeded += result.succeeded;
    finalResult.failed += result.failed;
  });

  return finalResult;
};

export const pullProfiles = async (): Promise<number> => {
  const lastPulledAt = await getSyncCursor(SyncCursorKeys.profiles);
  const remoteRows = await fetchRemoteProfilesChangedSince(lastPulledAt);

  let applied = 0;
  let maxUpdatedAt = lastPulledAt;

  for (const remoteRow of remoteRows) {
    const localRow = await getProfileByIdSafe(remoteRow.id);

    if (!localRow) {
      await upsertProfileFromRemote(mapRemoteProfileToLocal(remoteRow));
      applied++;

      if (!maxUpdatedAt || remoteRow.updated_at > maxUpdatedAt) {
        maxUpdatedAt = remoteRow.updated_at;
      }
      continue;
    }

    if (localRow.syncStatus === "pending") {
      continue;
    }

    const localUpdatedAt = localRow.updatedAt ?? "";
    const remoteUpdatedAt = remoteRow.updated_at ?? "";

    if (remoteUpdatedAt > localUpdatedAt) {
      await upsertProfileFromRemote(mapRemoteProfileToLocal(remoteRow));
      applied++;
    }

    if (
      !maxUpdatedAt ||
      (remoteRow.updated_at && remoteRow.updated_at > maxUpdatedAt)
    ) {
      maxUpdatedAt = remoteRow.updated_at;
    }
  }

  if (maxUpdatedAt) {
    await setSyncCursor(SyncCursorKeys.profiles, maxUpdatedAt);
  }

  return applied;
};

export const pullCareLinks = async (): Promise<number> => {
  const lastPulledAt = await getSyncCursor(SyncCursorKeys.careLinks);
  const remoteRows = await fetchRemoteCareLinksChangedSince(lastPulledAt);

  let applied = 0;
  let maxUpdatedAt = lastPulledAt;

  for (const remoteRow of remoteRows) {
    const localRow = await getCareLinkByIdSafe(remoteRow.id);

    if (!localRow) {
      await upsertCareLinkFromRemote(mapRemoteCareLinkToLocal(remoteRow));
      applied++;

      if (!maxUpdatedAt || remoteRow.updated_at > maxUpdatedAt) {
        maxUpdatedAt = remoteRow.updated_at;
      }
      continue;
    }

    if (localRow.syncStatus === "pending") {
      continue;
    }

    const localUpdatedAt = localRow.updatedAt ?? "";
    const remoteUpdatedAt = remoteRow.updated_at ?? "";

    if (remoteUpdatedAt > localUpdatedAt) {
      await upsertCareLinkFromRemote(mapRemoteCareLinkToLocal(remoteRow));
      applied++;
    }

    if (
      !maxUpdatedAt ||
      (remoteRow.updated_at && remoteRow.updated_at > maxUpdatedAt)
    ) {
      maxUpdatedAt = remoteRow.updated_at;
    }
  }

  if (maxUpdatedAt) {
    await setSyncCursor(SyncCursorKeys.careLinks, maxUpdatedAt);
  }

  return applied;
};

export const pullThresholdRules = async (): Promise<number> => {
  const lastPulledAt = await getSyncCursor(SyncCursorKeys.thresholdRules);
  const remoteRows = await fetchRemoteThresholdRulesChangedSince(lastPulledAt);

  let applied = 0;
  let maxUpdatedAt = lastPulledAt;

  for (const remoteRow of remoteRows) {
    const localRow = await getThresholdRuleByIdSafe(remoteRow.id);

    if (!localRow) {
      await upsertThresholdRuleFromRemote(
        mapRemoteThresholdRuleToLocal(remoteRow),
      );
      applied++;

      if (!maxUpdatedAt || remoteRow.updated_at > maxUpdatedAt) {
        maxUpdatedAt = remoteRow.updated_at;
      }
      continue;
    }

    if (localRow.syncStatus === "pending") {
      continue;
    }

    const localUpdatedAt = localRow.updatedAt ?? "";
    const remoteUpdatedAt = remoteRow.updated_at ?? "";

    if (remoteUpdatedAt > localUpdatedAt) {
      await upsertThresholdRuleFromRemote(
        mapRemoteThresholdRuleToLocal(remoteRow),
      );
      applied++;
    }

    if (
      !maxUpdatedAt ||
      (remoteRow.updated_at && remoteRow.updated_at > maxUpdatedAt)
    ) {
      maxUpdatedAt = remoteRow.updated_at;
    }
  }

  if (maxUpdatedAt) {
    await setSyncCursor(SyncCursorKeys.thresholdRules, maxUpdatedAt);
  }

  return applied;
};

export const pullReadings = async (): Promise<number> => {
  const lastPulledAt = await getSyncCursor(SyncCursorKeys.readings);
  const remoteRows = await fetchRemoteReadingsChangedSince(lastPulledAt);

  let applied = 0;
  let maxUpdatedAt = lastPulledAt;

  for (const remoteRow of remoteRows) {
    const localRow = await getReadingByIdSafe(remoteRow.id);

    if (!localRow) {
      await upsertReadingFromRemote(mapRemoteReadingToLocal(remoteRow));
      applied++;

      if (!maxUpdatedAt || remoteRow.updated_at > maxUpdatedAt) {
        maxUpdatedAt = remoteRow.updated_at;
      }
      continue;
    }

    if (localRow.syncStatus === "pending") {
      continue;
    }

    const localUpdatedAt = localRow.updatedAt ?? "";
    const remoteUpdatedAt = remoteRow.updated_at ?? "";

    if (remoteUpdatedAt > localUpdatedAt) {
      await upsertReadingFromRemote(mapRemoteReadingToLocal(remoteRow));
      applied++;
    }

    if (
      !maxUpdatedAt ||
      (remoteRow.updated_at && remoteRow.updated_at > maxUpdatedAt)
    ) {
      maxUpdatedAt = remoteRow.updated_at;
    }
  }

  if (maxUpdatedAt) {
    await setSyncCursor(SyncCursorKeys.readings, maxUpdatedAt);
  }

  return applied;
};

export const pullFollowups = async (): Promise<number> => {
  const lastPulledAt = await getSyncCursor(SyncCursorKeys.followups);
  const remoteRows = await fetchRemoteFollowupsChangedSince(lastPulledAt);

  let applied = 0;
  let maxUpdatedAt = lastPulledAt;

  for (const remoteRow of remoteRows) {
    const localRow = await getFollowupByIdSafe(remoteRow.id);

    if (!localRow) {
      await upsertFollowupFromRemote(mapRemoteFollowupToLocal(remoteRow));
      applied++;

      if (!maxUpdatedAt || remoteRow.updated_at > maxUpdatedAt) {
        maxUpdatedAt = remoteRow.updated_at;
      }
      continue;
    }

    if (localRow.syncStatus === "pending") {
      continue;
    }

    const localUpdatedAt = localRow.updatedAt ?? "";
    const remoteUpdatedAt = remoteRow.updated_at ?? "";

    if (remoteUpdatedAt > localUpdatedAt) {
      await upsertFollowupFromRemote(mapRemoteFollowupToLocal(remoteRow));
      applied++;
    }

    if (
      !maxUpdatedAt ||
      (remoteRow.updated_at && remoteRow.updated_at > maxUpdatedAt)
    ) {
      maxUpdatedAt = remoteRow.updated_at;
    }
  }

  if (maxUpdatedAt) {
    await setSyncCursor(SyncCursorKeys.followups, maxUpdatedAt);
  }

  return applied;
};

export const pullChanges = async (): Promise<number> => {
  const profilesApplied = await pullProfiles();
  console.log(`profiles applied: ${profilesApplied}`);
  const careLinksApplied = await pullCareLinks();
  console.log(`careLinks applied: ${careLinksApplied}`);
  const thresholdRulesApplied = await pullThresholdRules();
  console.log(`thresholdRules applied: ${thresholdRulesApplied}`);
  const readingsApplied = await pullReadings();
  console.log(`readings applied: ${readingsApplied}`);
  const followupsApplied = await pullFollowups();
  console.log(`followups applied: ${followupsApplied}`);

  return (
    profilesApplied +
    careLinksApplied +
    thresholdRulesApplied +
    readingsApplied +
    followupsApplied
  );
};
