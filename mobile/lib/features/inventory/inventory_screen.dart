import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'tabs/product_list_tab.dart';
import 'tabs/movement_list_tab.dart';
import 'tabs/stock_take_list_tab.dart';

class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});

  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('庫存管理'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: '商品管理'),
            Tab(text: '庫存異動'),
            Tab(text: '庫存盤點'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          ProductListTab(),
          MovementListTab(),
          StockTakeListTab(),
        ],
      ),
    );
  }
}
