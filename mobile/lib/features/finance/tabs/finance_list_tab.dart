import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../finance_providers.dart';

class FinanceListTab extends ConsumerWidget {
  const FinanceListTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactionsAsync = ref.watch(transactionsProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.refresh(transactionsProvider),
      child: transactionsAsync.when(
        data: (transactions) {
          if (transactions.isEmpty) return const Center(child: Text('無交易紀錄'));

          return ListView.separated(
            padding: const EdgeInsets.only(bottom: 80), // Fab space
            itemCount: transactions.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final t = transactions[index];
              final isIncome = t['type'] == 'INCOME';
              final date = DateFormat('MM/dd HH:mm')
                  .format(DateTime.parse(t['date']).toLocal());

              return ListTile(
                leading: CircleAvatar(
                  backgroundColor:
                      isIncome ? Colors.green.shade50 : Colors.red.shade50,
                  child: Icon(
                      isIncome ? Icons.arrow_downward : Icons.arrow_upward,
                      color: isIncome ? Colors.green : Colors.red,
                      size: 20),
                ),
                title: Text(t['category']?['name'] ?? '未知分類'),
                subtitle: Text('$date • ${t['description'] ?? ''}'),
                trailing: Text(
                  '${isIncome ? '+' : '-'}\$${t['amount']}',
                  style: TextStyle(
                      color: isIncome ? Colors.green : Colors.red,
                      fontWeight: FontWeight.bold,
                      fontSize: 16),
                ),
                onLongPress: () => _deleteTransaction(context, ref, t['id']),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  void _deleteTransaction(BuildContext context, WidgetRef ref, int id) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('刪除紀錄'),
        content: const Text('確定要刪除此筆交易嗎？'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context), child: const Text('取消')),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(financeServiceProvider).deleteTransaction(id);
              ref.refresh(transactionsProvider);
              ref.invalidate(financeSummaryProvider);
            },
            child: const Text('刪除', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
