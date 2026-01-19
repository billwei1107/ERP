import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'tabs/product_list_tab.dart';
import 'tabs/movement_list_tab.dart';
import 'tabs/stock_take_list_tab.dart';
import 'inventory_providers.dart';
import 'inventory_service.dart';
import '../../core/file_service.dart';

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
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) => _handleMenuSelection(context, ref, value),
            itemBuilder: (context) => [
              const PopupMenuItem(
                  value: 'export_xlsx', child: Text('匯出 Excel')),
              const PopupMenuItem(
                  value: 'download_template', child: Text('下載範本')),
              const PopupMenuItem(value: 'import', child: Text('匯入商品')),
            ],
          ),
        ],
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

  Future<void> _handleMenuSelection(
      BuildContext context, WidgetRef ref, String value) async {
    final fileService = ref.read(fileServiceProvider);
    final inventoryService = ref.read(inventoryServiceProvider);

    try {
      if (value == 'export_xlsx') {
        final bytes = await inventoryService.exportInventory();
        await fileService.saveAndShareFile(
            'inventory_export_${DateTime.now().millisecondsSinceEpoch}.xlsx',
            bytes);
      } else if (value == 'download_template') {
        final bytes = await inventoryService.downloadTemplate();
        await fileService.saveAndShareFile('inventory_template.xlsx', bytes);
      } else if (value == 'import') {
        final file = await fileService.pickFile();
        if (file != null) {
          await inventoryService.importInventory(file);
          ref.refresh(productsProvider); // Refresh list
          if (mounted) {
            ScaffoldMessenger.of(context)
                .showSnackBar(const SnackBar(content: Text('匯入成功')));
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('操作失敗: $e')));
      }
    }
  }
}
