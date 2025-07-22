import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { TripResponse } from "@/types";
import { formatCurrency } from "@/lib/cost-utils";

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica" },
  title: { fontSize: 24, textAlign: "center", marginBottom: 20 },
  day: { marginBottom: 15 },
  dayTitle: { fontSize: 18, marginBottom: 5, fontWeight: "bold" },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dailyCost: { fontSize: 14, color: "#059669" },
  activity: { marginLeft: 10, marginBottom: 5 },
  activityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: "bold" },
  activityCost: { fontSize: 12, color: "#059669", marginLeft: 10 },
  costSummary: { marginTop: 20, marginBottom: 20 },
  costSummaryTitle: { fontSize: 18, marginBottom: 10, fontWeight: "bold" },
  costRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  costLabel: { fontSize: 12 },
  costValue: { fontSize: 12, fontWeight: "bold" },
  budgetSection: { marginTop: 10, padding: 10, backgroundColor: "#f3f4f6" },
  packingList: { marginTop: 20 },
  packingListTitle: { fontSize: 18, marginBottom: 5, fontWeight: "bold" },
  packingListItem: { marginLeft: 10 },
});

const PDFExport = ({ data }: { data: TripResponse }) => (
  <Document>
    <Page style={styles.page}>
      <Text style={styles.title}>Your Travel Itinerary</Text>
      
      {/* Cost Summary */}
      {data.costSummary && (
        <View style={styles.costSummary}>
          <Text style={styles.costSummaryTitle}>Cost Summary</Text>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Total Trip Cost:</Text>
            <Text style={styles.costValue}>{formatCurrency(data.costSummary.totalCostUSD)}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Daily Average:</Text>
            <Text style={styles.costValue}>{formatCurrency(data.costSummary.dailyAverageCostUSD)}</Text>
          </View>
          
          {data.costSummary.budgetComparisonUSD && (
            <View style={styles.budgetSection}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Budget:</Text>
                <Text style={styles.costValue}>
                  {formatCurrency(data.costSummary.budgetComparisonUSD.originalBudgetAmount, data.costSummary.budgetComparisonUSD.originalCurrency)}
                </Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>
                  {data.costSummary.budgetComparisonUSD.isOverBudget ? 'Over Budget:' : 'Under Budget:'}
                </Text>
                <Text style={styles.costValue}>
                  {formatCurrency(Math.abs(data.costSummary.budgetComparisonUSD.differenceUSD))}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Daily Itinerary */}
      {data.itinerary.map((d) => (
        <View key={d.day} style={styles.day}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>
              Day {d.day} - {d.date}
            </Text>
            {d.dailyCostUSD && (
              <Text style={styles.dailyCost}>
                {formatCurrency(d.dailyCostUSD)}
              </Text>
            )}
          </View>
          {d.activities.map((a, i) => (
            <View key={i} style={styles.activity}>
              <View style={styles.activityRow}>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    {a.time} - {a.title}
                  </Text>
                  <Text>{a.details}</Text>
                  {a.durationMinutes && (
                    <Text style={{ fontSize: 10, color: "#6b7280" }}>
                      Duration: {Math.floor(a.durationMinutes / 60)}h {a.durationMinutes % 60}m
                    </Text>
                  )}
                </View>
                {a.costUSD !== undefined && a.costUSD > 0 && (
                  <Text style={styles.activityCost}>
                    {formatCurrency(a.costUSD)}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      ))}

      {/* Packing List */}
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