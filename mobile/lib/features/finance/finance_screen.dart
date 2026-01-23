import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'tabs/finance_dashboard_tab.dart';
import 'tabs/finance_list_tab.dart';
import 'finance_providers.dart';
import '../../core/file_service.dart';
import 'screens/add_transaction_screen.dart';

class FinanceScreen extends ConsumerWidget {
  const FinanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('財務管理'),
          actions: [
            PopupMenuButton<String>(
              onSelected: (value) => _handleMenuSelection(context, ref, value),
              itemBuilder: (context) => [
                const PopupMenuItem(
                    value: 'export_xlsx', child: Text('匯出 Excel')),
                const PopupMenuItem(
                    value: 'download_template', child: Text('下載範本')),
                const PopupMenuItem(value: 'import', child: Text('匯入收支')),
              ],
            ),
          ],
          bottom: const TabBar(
            tabs: [
              Tab(text: '概覽'),
              Tab(text: '明細'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            FinanceDashboardTab(),
            FinanceListTab(),
          ],
        ),
        floatingActionButton: FloatingActionButton(
          child: const Icon(Icons.add),
          onPressed: () {
            Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => const AddTransactionScreen()));
          },
        ),
      ),
    );
  }

  Future<void> _handleMenuSelection(
      BuildContext context, WidgetRef ref, String value) async {
    final fileService = ref.read(fileServiceProvider);
    final financeService = ref.read(financeServiceProvider);

    try {
      if (value == 'export_xlsx') {
        final bytes = await financeService.exportTransactions();
        await fileService.saveAndShareFile(
            'finance_export_${DateTime.now().millisecondsSinceEpoch}.xlsx',
            bytes);
      } else if (value == 'download_template') {
        final bytes = await financeService.downloadTemplate();
        await fileService.saveAndShareFile('finance_template.xlsx', bytes);
      } else if (value == 'import') {
        final file = await fileService.pickFile();
        if (file != null) {
          await financeService.importTransactions(file);
          // Refresh providers
          ref.invalidate(transactionsProvider);
          ref.invalidate(financeSummaryProvider);
          ref.invalidate(monthlyStatsProvider);

          if (context.mounted) {
            ScaffoldMessenger.of(context)
                .showSnackBar(const SnackBar(content: Text('匯入成功')));
          }
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('操作失敗: $e')));
      }
    }
  }
}
