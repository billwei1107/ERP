import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'tabs/finance_dashboard_tab.dart';
import 'tabs/finance_list_tab.dart';
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
}
