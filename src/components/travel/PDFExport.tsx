import { PDFDownloadLink, Document, Page, Text } from "@react-pdf/renderer";

const MyDoc = ({ itinerary, packingList }) => (
  <Document>
    <Page>
      <Text>{JSON.stringify(itinerary, null, 2)}</Text>
      <Text>{packingList.join(", ")}</Text>
    </Page>
  </Document>
);

export const PDFExport = ({ itinerary, packingList }) => (
  <PDFDownloadLink document={<MyDoc {...{ itinerary, packingList }} />} fileName="trip.pdf">
    {({ loading }) => (loading ? "Loading..." : "📥 Download PDF")}
  </PDFDownloadLink>
);