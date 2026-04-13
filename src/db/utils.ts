import { db } from "./client";
import {
  careLinks,
  followups,
  profiles,
  readings,
  thresholdRules,
} from "./schema";

export const identifySupabaseError = (error: any) => {
  if (!error) return null;

  switch (error.code) {
    case "23505":
      return { status: 409, message: "Resource already exists" };

    case "23503":
      return { status: 400, message: "Invalid reference" };

    case "23502":
      return { status: 400, message: "Missing required field" };

    case "23514":
      return { status: 400, message: "Invalid data" };

    case "22P02":
      return { status: 400, message: "Invalid ID format" };

    case "22001":
      return { status: 400, message: "Value too long" };

    default:
      return { status: 500, message: "Database error" };
  }
};

export async function dumpDbState() {
  const readingsRows = await db.select().from(readings);
  const followUpsRows = await db.select().from(followups);
  const profilesRows = await db.select().from(profiles);
  const thresholdsRows = await db.select().from(thresholdRules);
  const careLinksRows = await db.select().from(careLinks);

  console.log("------ DB STATE ------");

  console.log("readings: ");
  console.log(JSON.stringify(readingsRows, null, 2));

  console.log("followUps: ");
  console.log(JSON.stringify(followUpsRows, null, 2));

  console.log("profiles: ");
  console.log(JSON.stringify(profilesRows, null, 2));

  console.log("thresholds: ");
  console.log(JSON.stringify(thresholdsRows, null, 2));

  console.log("careLinks: ");
  console.log(JSON.stringify(careLinksRows, null, 2));
}

export const dumpDbReadings = async () => {
  const readingsRows = await db.select().from(readings);

  console.log("readings: ");
  console.log(JSON.stringify(readingsRows, null, 2));
};

export const dumpDbFollowups = async () => {
  const followUpsRows = await db.select().from(followups);

  console.log("followUps: ");
  console.log(JSON.stringify(followUpsRows, null, 2));
};

export const dumpDbProfiles = async () => {
  const profilesRows = await db.select().from(profiles);

  console.log("profiles: ");
  console.log(JSON.stringify(profilesRows, null, 2));
};

export const dumpDbThresholds = async () => {
  const thresholdsRows = await db.select().from(thresholdRules);

  console.log("thresholds: ");
  console.log(JSON.stringify(thresholdsRows, null, 2));
};

export const dumpDbCareLinks = async () => {
  const careLinksRows = await db.select().from(careLinks);

  console.log("careLinks: ");
  console.log(JSON.stringify(careLinksRows, null, 2));
};
