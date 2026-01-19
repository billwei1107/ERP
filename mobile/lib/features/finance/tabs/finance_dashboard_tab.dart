import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
    if (stats.isEmpty)
      return const SizedBox(height: 100, child: Center(child: Text('無資料')));

    return Column(
      children: stats.map((monthData) {
        final month = monthData['month'];
        final inc = monthData['income'] ?? 0;
        final exp = monthData['expense'] ?? 0;
        final max = (inc > exp ? inc : exp).toDouble();

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(month, style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              _buildBar(inc, max, Colors.green, '收入'),
              const SizedBox(height: 4),
              _buildBar(exp, max, Colors.red, '支出'),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildBar(num value, double max, Color color, String label) {
    return Row(
      children: [
        SizedBox(
            width: 30,
            child: Text(label,
                style: const TextStyle(fontSize: 10, color: Colors.grey))),
        Expanded(
          child: Stack(
            children: [
              Container(height: 8, color: Colors.grey.shade100),
              FractionallySizedBox(
                widthFactor: max == 0 ? 0 : (value / max),
                child: Container(height: 8, color: color),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
            width: 40,
            child: Text('\$${value}', style: const TextStyle(fontSize: 10))),
      ],
    );
  }
}
