import { listReadingsByPatient, ReadingRow } from "@/repos/readings.repo";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, DataTable } from "react-native-paper";

const RecentHistory = ({ patientId }: { patientId: string }) => {
  const [readings, setReadings] = useState<ReadingRow[] | null>(null);

  useEffect(() => {
    const fetchReadings = async (patientId: string) => {
      const fetchedReadings = await listReadingsByPatient(patientId);
      if (fetchedReadings.length) {
        setReadings(fetchedReadings.slice(0, 4));
      }
    };

    fetchReadings(patientId);
  }, [patientId]);

  return (
    <View style={{ padding: 30 }}>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Value</DataTable.Title>
          <DataTable.Title>Date</DataTable.Title>
          <DataTable.Title>Time</DataTable.Title>
        </DataTable.Header>
        {readings?.map((reading) => (
          <DataTable.Row key={reading.id}>
            <DataTable.Cell>{reading.glucoseValue}</DataTable.Cell>
            <DataTable.Cell>
              {reading.recordedAt
                ? format(new Date(reading.recordedAt), "d/M/y")
                : ""}
            </DataTable.Cell>
            <DataTable.Cell>
              {reading.recordedAt
                ? format(new Date(reading.recordedAt), "H:mm:ss")
                : ""}
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
      <Button mode="contained-tonal">SHOW ALL</Button>
    </View>
  );
};

export default RecentHistory;
