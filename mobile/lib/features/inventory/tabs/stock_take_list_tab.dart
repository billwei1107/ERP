import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../inventory_providers.dart';
import '../dialogs/create_stock_take_dialog.dart';
import '../screens/stock_take_detail_screen.dart';

class StockTakeListTab extends ConsumerWidget {
  const StockTakeListTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stockTakesAsync = ref.watch(stockTakesProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          showDialog(
            context: context,
            builder: (context) => const CreateStockTakeDialog(),
          );
        },
        child: const Icon(Icons.add),
      ),
      body: stockTakesAsync.when(
        data: (stockTakes) {
          if (stockTakes.isEmpty) {
            return const Center(child: Text('沒有盤點紀錄'));
          }
          return ListView.builder(
            itemCount: stockTakes.length,
            itemBuilder: (context, index) {
              final st = stockTakes[index];
              final status = st['status'] ?? 'DRAFT';
              final date = st['date'] != null
                  ? DateFormat('yyyy/MM/dd HH:mm')
                      .format(DateTime.parse(st['date']).toLocal())
                  : '-';

              Color statusColor = Colors.grey;
              String statusText = status;

              if (status == 'COMPLETED') {
                statusColor = Colors.green;
                statusText = '已完成';
              } else if (status == 'IN_PROGRESS') {
                statusColor = Colors.blue;
                statusText = '進行中';
              } else {
                statusText = '草稿';
              }

              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ListTile(
                  title: Text('盤點 #${st['id']}'),
                  subtitle: Text('建立日期: $date\n備註: ${st['note'] ?? '無'}'),
                  isThreeLine: true,
                  trailing: Chip(
                    label: Text(statusText),
                    backgroundColor: statusColor.withOpacity(0.1),
                    labelStyle: TextStyle(color: statusColor),
                  ),
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => StockTakeDetailScreen(stockTake: st),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('載入失敗: $err')),
      ),
    );
  }
}
