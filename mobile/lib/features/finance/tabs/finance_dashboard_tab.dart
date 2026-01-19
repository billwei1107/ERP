import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../finance_providers.dart';

class FinanceDashboardTab extends ConsumerWidget {
  const FinanceDashboardTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(financeSummaryProvider);
    final statsAsync = ref.watch(monthlyStatsProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(financeSummaryProvider);
        ref.invalidate(monthlyStatsProvider);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          summaryAsync.when(
            data: (data) => _buildSummaryCards(data),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Text('Error: $e'),
          ),
          const SizedBox(height: 24),
          const Text('月度收支',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          statsAsync.when(
            data: (data) => _buildStatsChart(data),
            loading: () => const SizedBox(
                height: 200, child: Center(child: CircularProgressIndicator())),
            error: (e, _) => Text('Error: $e'),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCards(Map<String, dynamic> data) {
    final income = data['totalIncome'] ?? 0;
    final expense = data['totalExpense'] ?? 0;
    final net = data['netProfit'] ?? 0;

    return Row(
      children: [
        _buildCard('收入', income, Colors.green),
        const SizedBox(width: 8),
        _buildCard('支出', expense, Colors.red),
        const SizedBox(width: 8),
        _buildCard('淨利', net, net >= 0 ? Colors.blue : Colors.orange),
      ],
    );
  }

  Widget _buildCard(String title, num amount, Color color) {
    return Expanded(
      child: Card(
        color: color.withOpacity(0.1),
        elevation: 0,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: color.withOpacity(0.3))),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          child: Column(
            children: [
              Text(title,
                  style: TextStyle(color: color, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              FittedBox(
                child: Text(
                  '\$${amount.toStringAsFixed(0)}',
                  style: TextStyle(
                      fontSize: 20, fontWeight: FontWeight.bold, color: color),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsChart(List<dynamic> stats) {
    if (stats.isEmpty) {
      return const SizedBox(height: 100, child: Center(child: Text('無資料')));
    }

    // Parse data points
    final incomeSpots = <FlSpot>[];
    final expenseSpots = <FlSpot>[];
    double maxY = 0;

    for (int i = 0; i < stats.length; i++) {
      final monthData = stats[i];
      final inc = (monthData['income'] ?? 0).toDouble();
      final exp = (monthData['expense'] ?? 0).toDouble();

      incomeSpots.add(FlSpot(i.toDouble(), inc));
      expenseSpots.add(FlSpot(i.toDouble(), exp));

      if (inc > maxY) maxY = inc;
      if (exp > maxY) maxY = exp;
    }

    // Add buffer to Y axis
    maxY = maxY * 1.2;
    if (maxY == 0) maxY = 100;

    return Container(
      height: 300,
      padding: const EdgeInsets.only(right: 16, top: 16),
      child: LineChart(
        LineChartData(
          gridData: FlGridData(
            show: true,
            drawVerticalLine: true,
            getDrawingHorizontalLine: (value) =>
                FlLine(color: Colors.grey.shade200, strokeWidth: 1),
            getDrawingVerticalLine: (value) =>
                FlLine(color: Colors.grey.shade200, strokeWidth: 1),
          ),
          titlesData: FlTitlesData(
            show: true,
            rightTitles:
                const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles:
                const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 30,
                interval: 1,
                getTitlesWidget: (value, meta) {
                  final index = value.toInt();
                  if (index >= 0 && index < stats.length) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: Text(stats[index]['month'],
                          style: const TextStyle(fontSize: 10)),
                    );
                  }
                  return const Text('');
                },
              ),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                interval: maxY / 5,
                reservedSize: 42,
                getTitlesWidget: (value, meta) {
                  if (value == 0)
                    return const Text('0', style: TextStyle(fontSize: 10));
                  return Text(
                    value >= 1000
                        ? '${(value / 1000).toStringAsFixed(1)}k'
                        : value.toStringAsFixed(0),
                    style: const TextStyle(fontSize: 10, color: Colors.grey),
                  );
                },
              ),
            ),
          ),
          borderData: FlBorderData(show: false),
          minX: 0,
          maxX: (stats.length - 1).toDouble(),
          minY: 0,
          maxY: maxY,
          lineBarsData: [
            // Income Line
            LineChartBarData(
              spots: incomeSpots,
              isCurved: true,
              color: Colors.green,
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
              belowBarData:
                  BarAreaData(show: true, color: Colors.green.withOpacity(0.1)),
            ),
            // Expense Line
            LineChartBarData(
              spots: expenseSpots,
              isCurved: true,
              color: Colors.red,
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
            ),
          ],
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              tooltipBgColor: Colors.blueGrey.withOpacity(0.8),
              getTooltipItems: (touchedSpots) {
                return touchedSpots.map((spot) {
                  final isIncome = spot.barIndex == 0;
                  return LineTooltipItem(
                    '${isIncome ? "收入" : "支出"}: \$${spot.y.toStringAsFixed(0)}',
                    TextStyle(
                        color: isIncome ? Colors.greenAccent : Colors.redAccent,
                        fontWeight: FontWeight.bold),
                  );
                }).toList();
              },
            ),
          ),
        ),
      ),
    );
  }
}
