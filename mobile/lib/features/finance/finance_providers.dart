import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/dio_client.dart';
import 'package:dio/dio.dart';

// Services
final financeServiceProvider = Provider((ref) {
  final dio = ref.read(dioClientProvider).dio;
  return FinanceService(dio);
});

class FinanceService {
  final Dio _dio;
  FinanceService(this._dio);

  Future<Map<String, dynamic>> getSummary() async {
    final response = await _dio.get('/finance/summary');
    return response.data;
  }

  Future<List<dynamic>> getTransactions() async {
    final response = await _dio.get('/finance/transactions');
    return response.data as List<dynamic>;
  }

  Future<List<dynamic>> getCategories() async {
    final response = await _dio.get('/finance/categories');
    return response.data as List<dynamic>;
  }

  Future<List<dynamic>> getMonthlyStats() async {
    final response = await _dio.get('/finance/stats/monthly');
    return response.data as List<dynamic>;
  }

  Future<void> createTransaction(Map<String, dynamic> data) async {
    await _dio.post('/finance/transactions', data: data);
  }

  Future<void> deleteTransaction(int id) async {
    await _dio.delete('/finance/transactions/$id');
  }
}

// Providers
final financeSummaryProvider = FutureProvider.autoDispose((ref) async {
  return ref.watch(financeServiceProvider).getSummary();
});

final transactionsProvider = FutureProvider.autoDispose((ref) async {
  return ref.watch(financeServiceProvider).getTransactions();
});

final categoriesProvider = FutureProvider.autoDispose((ref) async {
  return ref.watch(financeServiceProvider).getCategories();
});

final monthlyStatsProvider = FutureProvider.autoDispose((ref) async {
  return ref.watch(financeServiceProvider).getMonthlyStats();
});
