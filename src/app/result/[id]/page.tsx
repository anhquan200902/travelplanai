"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { TripResponse } from "@/types";

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 20, marginBottom: 10 },
  day: { marginBottom: 10 },
  activity: { fontSize: 12 },
});

const MyDoc = ({ data }: { data: TripResponse }) => (
  <Document>
    <Page style={styles.page}>
      <Text style={styles.title}>Your AI Trip Plan</Text>
      {data.itinerary.map((d) => (
        <View key={d.day} style={styles.day}>
          <Text>
            Day {d.day} – {d.date}
          </Text>
          {d.activities.map((a, idx) => (
            <Text key={idx} style={styles.activity}>
              • {a.time} {a.title}
            </Text>
          ))}
        </View>
      ))}
      <Text>Packing list: {data.packing_list.join(", ")}</Text>
    </Page>
  </Document>
);

export default function ResultPage() {
  const { id: _ } = useParams();
  const search = useSearchParams();
  const [data, setData] = useState<TripResponse | null>(null);

  useEffect(() => {
    const payload = JSON.parse(search.get("payload") || "{}");
    fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then(setData);
  }, [search]);

  if (!data) return <p className="p-4">Loading…</p>;

  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your AI Trip Plan</h1>

      {data.itinerary.map((d) => (
        <section key={d.day} className="mb-6">
          <h2 className="text-xl font-semibold">Day {d.day}</h2>
          <ul className="list-disc list-inside space-y-1">
            {d.activities.map((a) => (
              <li key={a.time + a.title}>
                <strong>{a.time}</strong> – {a.title}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section>
        <h2 className="text-xl font-semibold mb-2">Packing List</h2>
        <ul className="list-disc list-inside">
          {data.packing_list.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </section>

      <div className="mt-6">
        <PDFDownloadLink
          document={<MyDoc data={data} />}
          fileName="itinerary.pdf"
        >
          {({ loading }) => (loading ? "Preparing PDF…" : "📥 Download PDF")}
        </PDFDownloadLink>
      </div>
    </main>
  );
}