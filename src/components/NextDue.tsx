import { appTheme } from "@/src/lib/theme";
import {
  FollowupRow,
  getNextPendingFollowup,
} from "@/src/repos/local/followups.repo";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { DataTable, Text } from "react-native-paper";

const NextDue = ({ patientId }: { patientId: string }) => {
  const [nextFollowup, setNextFollowup] = useState<FollowupRow | null>(null);

  useEffect(() => {
    const fetchFollowup = async (patientId: string) => {
      const result = await getNextPendingFollowup(patientId);
      if (result.dueAt) {
        setNextFollowup(result);
      }
    };

    fetchFollowup(patientId);
  }, [patientId]);
  return (
    <View>
      <View style={{ alignItems: "center" }}>
        <Text variant="headlineSmall">NEXT INTERACTION</Text>
      </View>
      <DataTable style={{ paddingLeft: 50 }}>
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
      </DataTable>
    </View>
  );
};

export default NextDue;
