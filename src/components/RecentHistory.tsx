import { listReadingsByPatient, ReadingRow } from "@/src/repos/local/readings.repo";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, DataTable, Text } from "react-native-paper";

const RecentHistory = ({ patientId }: { patientId: string }) => {
  const [readings, setReadings] = useState<ReadingRow[] | null>(null);

  useEffect(() => {
    const fetchReadings = async (patientId: string) => {
      const fetchedReadings = await listReadingsByPatient(patientId, 4);
      if (fetchedReadings.length) {
        setReadings(fetchedReadings);
      }
    };

    fetchReadings(patientId);
  }, [patientId]);

  return (
    <View>
      <View style={{ alignItems: "center" }}>
        <Text variant="headlineSmall">RECENT HISTORY</Text>
      </View>
      <View style={{ paddingLeft: 50 }}>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Value</DataTable.Title>
          <DataTable.Title>Date</DataTable.Title>
          <DataTable.Title>Time</DataTable.Title>
        </DataTable.Header>
        {readings?.map((reading) => (
          <DataTable.Row key={reading.id}>
            <DataTable.Cell>{reading.glucoseValue || 'Cornstarch'}</DataTable.Cell>
            <DataTable.Cell>
              {reading.recordedAt
                ? format(new Date(reading.recordedAt), "d/M/y")
                : ""}
            </DataTable.Cell>
            <DataTable.Cell>
              {reading.recordedAt
                ? format(new Date(reading.recordedAt), "H:mm")
                : ""}
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
      <Button mode="contained-tonal" style={{ marginRight: 50 }}>SHOW ALL</Button>
      </View>
    </View>
  );
};

export default RecentHistory;
