import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../inventory_providers.dart';

class ProductListTab extends ConsumerWidget {
  const ProductListTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(productsProvider);

    return productsAsync.when(
      data: (products) {
        if (products.isEmpty) {
          return const Center(child: Text('沒有商品資料'));
        }
        return ListView.separated(
          itemCount: products.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (context, index) {
            final product = products[index];
            return ListTile(
              title: Text(product['name'] ?? 'Unknown',
                  style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('SKU: ${product['sku'] ?? '-'}'),
              trailing: Chip(
                label: Text('${product['stockQuantity'] ?? 0}'),
                backgroundColor: (product['stockQuantity'] ?? 0) <=
                        (product['minStockLevel'] ?? 0)
                    ? Colors.red[100]
                    : Colors.green[100],
                labelStyle: TextStyle(
                  color: (product['stockQuantity'] ?? 0) <=
                          (product['minStockLevel'] ?? 0)
                      ? Colors.red[900]
                      : Colors.green[900],
                ),
              ),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, stack) => Center(child: Text('載入失敗: $err')),
    );
  }
}
