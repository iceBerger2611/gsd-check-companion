import {
  FollowupRow,
  getNextPendingFollowup,
} from "@/src/repos/local/followups.repo";
import { format } from "date-fns";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { SyncStateAtom } from "../hooks/sync";
import { getRelativeDayLabel } from "../repos/utils";

const NextDue = ({ patientId }: { patientId: string }) => {
  const [nextFollowup, setNextFollowup] = useState<FollowupRow | null>(null);
  const syncState = useAtomValue(SyncStateAtom);

  useEffect(() => {
    const fetchFollowup = async (patientId: string) => {
      const result = await getNextPendingFollowup(patientId);
      if (result.dueAt) {
        setNextFollowup(result);
      }
    };

    fetchFollowup(patientId);
  }, [patientId, syncState.lastSyncAt]);

  return (
    <View>
      <View style={{ alignItems: "center" }}>
        {!nextFollowup ? (
          <Text variant="bodyMedium">No action due right now</Text>
        ) : (
          <>
            <Text variant="headlineSmall">NEXT STEP</Text>
            <Text variant="bodyMedium">
              {nextFollowup.type === "drink_cornstarch"
                ? "Drink Cornstarch"
                : "Check Blood Sugar"}
            </Text>
            {nextFollowup.dueAt && (
              <Text variant="bodyMedium">
                Due {getRelativeDayLabel(new Date(nextFollowup.dueAt))} at{" "}
                {format(new Date(nextFollowup.dueAt), "H:mm")}
              </Text>
            )}
          </>
        )}
      </View>
      {/* <DataTable style={{ paddingLeft: 50 }}>
        <DataTable.Header>
          <DataTable.Title>Type</DataTable.Title>
          <DataTable.Title>Date</DataTable.Title>
          <DataTable.Title>Time</DataTable.Title>
        </DataTable.Header>
        {!nextFollowup ? (
          <Text style={{ color: appTheme.colors.secondary }}>No Data</Text>
        ) : (
          <DataTable.Row>
            <DataTable.Cell>
              {nextFollowup.type === "recheck" ? "Check" : "Cornstarch"}
            </DataTable.Cell>
            <DataTable.Cell>
              {nextFollowup.dueAt
                ? format(new Date(nextFollowup.dueAt), "d/M/y")
                : ""}
            </DataTable.Cell>
            <DataTable.Cell>
              {nextFollowup.dueAt
                ? format(new Date(nextFollowup.dueAt), "H:mm")
                : ""}
            </DataTable.Cell>
          </DataTable.Row>
        )}
      </DataTable> */}
    </View>
  );
};

export default NextDue;
