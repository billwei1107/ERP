import 'dart:io';
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

  Future<void> updateProduct(int id, Map<String, dynamic> data) async {
    try {
      await _dio.patch('/inventory/products/$id', data: data);
    } catch (e) {
      throw Exception('Failed to update product: $e');
    }
  }

  Future<void> deleteProduct(int id) async {
    try {
      await _dio.delete('/inventory/products/$id');
    } catch (e) {
      throw Exception('Failed to delete product: $e');
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

  Future<void> createMovement(Map<String, dynamic> data) async {
    try {
      await _dio.post('/inventory/movements', data: data);
    } catch (e) {
      throw Exception('Failed to create movement: $e');
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

  Future<void> createStockTake(Map<String, dynamic> data) async {
    try {
      await _dio.post('/inventory/stock-takes', data: data);
    } catch (e) {
      throw Exception('Failed to create stock take: $e');
    }
  }

  Future<void> submitStockTake(int id, List<dynamic> items) async {
    try {
      await _dio
          .post('/inventory/stock-takes/$id/submit', data: {'items': items});
    } catch (e) {
      throw Exception('Failed to submit stock take: $e');
    }
  }

  Future<void> updateStockTakeItems(int id, List<dynamic> items) async {
    try {
      await _dio
          .patch('/inventory/stock-takes/$id/items', data: {'items': items});
    } catch (e) {
      throw Exception('Failed to update stock take items: $e');
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

  // 5. Import / Export
  Future<List<int>> exportInventory() async {
    try {
      final response = await _dio.get(
        '/inventory/export',
        options: Options(responseType: ResponseType.bytes),
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to export inventory: $e');
    }
  }

  Future<List<int>> downloadTemplate() async {
    try {
      final response = await _dio.get(
        '/inventory/template',
        options: Options(responseType: ResponseType.bytes),
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to download template: $e');
    }
  }

  Future<void> importInventory(File file) async {
    try {
      String fileName = file.path.split('/').last;
      FormData formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path, filename: fileName),
      });

      await _dio.post('/inventory/import', data: formData);
    } catch (e) {
      throw Exception('Failed to import inventory: $e');
    }
  }
}
