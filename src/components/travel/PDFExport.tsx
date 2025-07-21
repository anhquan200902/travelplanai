// src/components/travel/PDFExport.tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { TripResponse } from "@/types";

interface PDFProps {
  itinerary: TripResponse["itinerary"];
  packingList: string[];
}

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 20, marginBottom: 10 },
  day: { marginBottom: 8 },
  activity: { fontSize: 12 },
});

const MyDoc = ({ itinerary, packingList }: PDFProps) => (
  <Document>
    <Page style={styles.page}>
      <Text style={styles.title}>Your AI Trip Plan</Text>
      {itinerary.map((d) => (
        <View key={d.day} style={styles.day}>
          <Text>Day {d.day}</Text>
          {d.activities.map((a) => (
            <Text key={a.time} style={styles.activity}>
              • {a.time} {a.title}
            </Text>
          ))}
        </View>
      ))}
      <Text>Packing: {packingList.join(", ")}</Text>
    </Page>
  </Document>
);

export default MyDoc;