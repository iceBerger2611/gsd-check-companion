import * as Crypto from "expo-crypto";
import { DecisionType } from "../db/schema";
import {
  cancelNotificationsOfFollowup,
  getNotificationIdsByEntity,
} from "../notifications/scheduler";
import { getFollowupByIdSafe } from "../repos/local/followups.repo";
import { PatientSettingsRow } from "../repos/local/patientSettings.repo";
import {
  getReadingByIdSafe,
  ReadingInsert,
} from "../repos/local/readings.repo";
import {
  addNotificationsToFollowup,
  createAndSaveFollowup,
  createNewFollowupNotifications,
  createPlanAndSaveReading,
  getPlanFromExistingReading,
  handlePrevFollowupCompletion,
  shouldFollowupHaveNotifications,
} from "./utils";

const MAX_ATTEMPTS = 4;

export const runProcessReading = async (
  reading: ReadingInsert,
  personalSettings: PatientSettingsRow,
  earlyDecision?: DecisionType,
  sourceFollowUpId?: string,
): Promise<{ isSuccessful: true } | { isSuccessful: false; error: string }> => {
  let newFollowupId = Crypto.randomUUID();
  let processStep = 1;
  let currErrorMessage = "";

  const setPropertiesForRetry = (currStep: number, currError: string) => {
    processStep = currStep;
    currErrorMessage = currError;
  };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const processResult = await processReading(
      reading,
      personalSettings,
      newFollowupId,
      processStep,
      earlyDecision,
      sourceFollowUpId,
    );

    if (processResult.isSuccessful) {
      return { isSuccessful: true };
    }

    setPropertiesForRetry(processResult.failedStep, processResult.error);
  }

  return { isSuccessful: false, error: currErrorMessage };
};

const processReading = async (
  reading: ReadingInsert,
  personalSettings: PatientSettingsRow,
  newFollowupId: string,
  processStep: number,
  earlyDecision?: DecisionType,
  sourceFollowUpId?: string,
): Promise<
  | { isSuccessful: true }
  | { isSuccessful: false; error: string; failedStep: number }
> => {
  if (processStep === 1) {
    const saveReadingResult = await createPlanAndSaveReading(
      reading,
      personalSettings,
      earlyDecision,
    );

    if (!saveReadingResult.isSuccessful) {
      return {
        isSuccessful: false,
        failedStep: 1,
        error: saveReadingResult.error,
      };
    }
    processStep++;
  }

  const newReadingRow = await getReadingByIdSafe(reading.id);

  if (!newReadingRow || !newReadingRow.patientId) {
    return {
      isSuccessful: false,
      failedStep: 1,
      error: "an error occured while saving or fetching the reading",
    };
  }

  if (processStep === 2) {
    if (sourceFollowUpId) {
      const handlePrevFollowupResult = await handlePrevFollowupCompletion(
        sourceFollowUpId,
        newReadingRow,
      );
      if (!handlePrevFollowupResult.isSuccessful) {
        return {
          isSuccessful: false,
          failedStep: 2,
          error: handlePrevFollowupResult.error,
        };
      }
    }
    processStep++;
  }

  const nextFollowupPlan = await getPlanFromExistingReading(
    newReadingRow,
    newReadingRow.patientId,
    personalSettings,
    earlyDecision,
  );

  if (processStep === 3) {
    const saveFollowupResult = await createAndSaveFollowup(
      newFollowupId,
      nextFollowupPlan,
      newReadingRow,
    );

    if (!saveFollowupResult.isSuccessful) {
      return {
        isSuccessful: false,
        failedStep: 3,
        error: saveFollowupResult.error,
      };
    }
    processStep++;
  }

  const newFollowup = await getFollowupByIdSafe(newFollowupId);

  if (!newFollowup) {
    return {
      isSuccessful: false,
      failedStep: 3,
      error: "an error occured while creating or fetching the next followup",
    };
  }

  const shouldHaveNotifications = shouldFollowupHaveNotifications(newFollowup);
  const scheduledNotificationIdsForFollowup = await getNotificationIdsByEntity(
    newFollowup.id,
  );

  if (!shouldHaveNotifications) {
    if (scheduledNotificationIdsForFollowup.length) {
      cancelNotificationsOfFollowup(newFollowup.id);
    }
    return { isSuccessful: true };
  }

  if (processStep === 4) {
    if (
      !(
        scheduledNotificationIdsForFollowup.length &&
        newFollowup.scheduledNotificationIds.length &&
        newFollowup.scheduledNotificationIds.every(
          (notificationId) =>
            !!scheduledNotificationIdsForFollowup.find(
              (activeNotification) => activeNotification === notificationId,
            ),
        )
      )
    ) {
      await cancelNotificationsOfFollowup(newFollowup.id);
      const notificationsCreationResult = await createNewFollowupNotifications(
        newReadingRow,
        newFollowup,
        personalSettings,
      );

      if (!notificationsCreationResult.isSuccessful) {
        return {
          isSuccessful: false,
          failedStep: 4,
          error: notificationsCreationResult.error,
        };
      }
    }
    processStep++;
  }

  const activeNotificationIds = await getNotificationIdsByEntity(
    newFollowup.id,
  );

  if (!activeNotificationIds.length) {
    return {
      isSuccessful: false,
      failedStep: 4,
      error:
        "an error occured while creating notifications for the next followup",
    };
  }

  if (processStep === 5) {
    const followupUpsertResult = await addNotificationsToFollowup(
      newFollowup,
      activeNotificationIds,
    );

    if (!followupUpsertResult.isSuccessful) {
      return {
        isSuccessful: false,
        failedStep: 5,
        error: followupUpsertResult.error,
      };
    }
  }

  return { isSuccessful: true };
};
