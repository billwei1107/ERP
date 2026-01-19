import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../inventory_providers.dart';

class MovementListTab extends ConsumerWidget {
  const MovementListTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final movementsAsync = ref.watch(movementsProvider);

    return movementsAsync.when(
      data: (movements) {
        if (movements.isEmpty) {
          return const Center(child: Text('沒有異動紀錄'));
        }
        return ListView.separated(
          itemCount: movements.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (context, index) {
            final movement = movements[index];
            final isIncoming = movement['type'] == 'IN';
            final date = movement['createdAt'] != null
                ? DateFormat('MM/dd HH:mm')
                    .format(DateTime.parse(movement['createdAt']).toLocal())
                : '-';

            return ListTile(
              leading: Icon(
                isIncoming ? Icons.arrow_circle_down : Icons.arrow_circle_up,
                color: isIncoming ? Colors.green : Colors.orange,
              ),
              title: Text(movement['product']?['name'] ?? 'Unknown Product'),
              subtitle: Text('$date  •  ${movement['reason'] ?? ''}'),
              trailing: Text(
                '${isIncoming ? '+' : '-'}${movement['quantity']}',
                style: TextStyle(
                  color: isIncoming ? Colors.green : Colors.orange,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
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
