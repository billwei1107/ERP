import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../inventory_providers.dart';
import '../inventory_service.dart';
import '../dialogs/add_product_dialog.dart';

class ProductListTab extends ConsumerWidget {
  const ProductListTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(productsProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          showDialog(
            context: context,
            builder: (context) => const AddProductDialog(),
          );
        },
        child: const Icon(Icons.add),
      ),
      body: productsAsync.when(
        data: (products) {
          if (products.isEmpty) {
            return const Center(child: Text('沒有商品資料'));
          }
          return ListView.separated(
            itemCount: products.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final product = products[index];
              final totalStock = product['totalStock'] ?? 0;
              final safetyStock = product['safetyStock'] ?? 0;

              return ListTile(
                title: Text(product['name'] ?? 'Unknown',
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('SKU: ${product['sku'] ?? '-'}'),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Chip(
                      label: Text('$totalStock'),
                      backgroundColor: totalStock <= safetyStock
                          ? Colors.red[100]
                          : Colors.green[100],
                      labelStyle: TextStyle(
                        color: totalStock <= safetyStock
                            ? Colors.red[900]
                            : Colors.green[900],
                      ),
                    ),
                    PopupMenuButton<String>(
                      onSelected: (value) async {
                        if (value == 'edit') {
                          showDialog(
                            context: context,
                            builder: (context) =>
                                AddProductDialog(product: product),
                          );
                        } else if (value == 'delete') {
                          final confirmed = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('確認刪除'),
                              content: const Text('確定要刪除此商品嗎？'),
                              actions: [
                                TextButton(
                                    onPressed: () => Navigator.pop(ctx, false),
                                    child: const Text('取消')),
                                TextButton(
                                    onPressed: () => Navigator.pop(ctx, true),
                                    style: TextButton.styleFrom(
                                        foregroundColor: Colors.red),
                                    child: const Text('刪除')),
                              ],
                            ),
                          );

                          if (confirmed == true) {
                            try {
                              await ref
                                  .read(inventoryServiceProvider)
                                  .deleteProduct(product['id']);
                              ref.invalidate(productsProvider);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('已刪除')));
                              }
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('刪除失敗: $e')));
                              }
                            }
                          }
                        }
                      },
                      itemBuilder: (BuildContext context) =>
                          <PopupMenuEntry<String>>[
                        const PopupMenuItem<String>(
                          value: 'edit',
                          child: Text('編輯'),
                        ),
                        const PopupMenuItem<String>(
                          value: 'delete',
                          child:
                              Text('刪除', style: TextStyle(color: Colors.red)),
                        ),
                      ],
                    ),
                  ],
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
