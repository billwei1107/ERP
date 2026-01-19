import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/dio_client.dart';

final inventoryServiceProvider = Provider((ref) {
  final dioClient = ref.read(dioClientProvider);
  return InventoryService(dioClient.dio);
});

class InventoryService {
  final Dio _dio;

  InventoryService(this._dio);

  // 1. Products
  Future<List<dynamic>> getProducts() async {
    try {
      final response = await _dio.get('/inventory/products');
      return response.data as List<dynamic>;
    } catch (e) {
      throw Exception('Failed to load products: $e');
    }
  }

  Future<void> createProduct(Map<String, dynamic> data) async {
    try {
      await _dio.post('/inventory/products', data: data);
    } catch (e) {
      throw Exception('Failed to create product: $e');
    }
  }

  // 2. Movements
  Future<List<dynamic>> getMovements() async {
    try {
      final response = await _dio.get('/inventory/movements');
      return response.data as List<dynamic>;
    } catch (e) {
      throw Exception('Failed to load movements: $e');
    }
  }

  // 3. Stock Takes
  Future<List<dynamic>> getStockTakes() async {
    try {
      final response = await _dio.get('/inventory/stock-takes');
      return response.data as List<dynamic>;
    } catch (e) {
      throw Exception('Failed to load stock takes: $e');
    }
  }

  // 4. Alerts
  Future<List<dynamic>> getAlerts() async {
    try {
      final response = await _dio.get('/inventory/alerts');
      return response.data as List<dynamic>;
    } catch (e) {
      return []; // Return empty on error to avoid breaking UI
    }
  }
}
