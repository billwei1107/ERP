import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'inventory_service.dart';

final productsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final service = ref.read(inventoryServiceProvider);
  return service.getProducts();
});

final movementsProvider =
    FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final service = ref.read(inventoryServiceProvider);
  return service.getMovements();
});

final stockTakesProvider =
    FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final service = ref.read(inventoryServiceProvider);
  return service.getStockTakes();
});

final inventoryAlertsProvider =
    FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final service = ref.read(inventoryServiceProvider);
  return service.getAlerts();
});
