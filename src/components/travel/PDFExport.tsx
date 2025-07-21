import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { TripResponse } from "@/types";

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica" },
  title: { fontSize: 24, textAlign: "center", marginBottom: 20 },
  day: { marginBottom: 15 },
  dayTitle: { fontSize: 18, marginBottom: 5, fontWeight: "bold" },
  activity: { marginLeft: 10, marginBottom: 5 },
  activityTitle: { fontSize: 14, fontWeight: "bold" },
  packingList: { marginTop: 20 },
  packingListTitle: { fontSize: 18, marginBottom: 5, fontWeight: "bold" },
  packingListItem: { marginLeft: 10 },
});

const PDFExport = ({ data }: { data: TripResponse }) => (
  <Document>
    <Page style={styles.page}>
      <Text style={styles.title}>Your Travel Itinerary</Text>
      {data.itinerary.map((d) => (
        <View key={d.day} style={styles.day}>
          <Text style={styles.dayTitle}>
            Day {d.day} - {d.date}
          </Text>
          {d.activities.map((a, i) => (
            <View key={i} style={styles.activity}>
              <Text style={styles.activityTitle}>
                {a.time} - {a.title}
              </Text>
              <Text>{a.details}</Text>
            </View>
          ))}
        </View>
      ))}
      <View style={styles.packingList}>
        <Text style={styles.packingListTitle}>Packing List</Text>
        {data.packing_list.map((item, i) => (
          <Text key={i} style={styles.packingListItem}>
            - {item}
          </Text>
        ))}
      </View>
    </Page>
  </Document>
);

export default PDFExport;