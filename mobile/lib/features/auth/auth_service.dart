import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';
import 'package:mobile/core/dio_client.dart';

// Providers
final storageProvider = Provider((ref) => const FlutterSecureStorage());
final dioProvider = Provider((ref) {
  final storage = ref.watch(storageProvider);
  return DioClient(Dio(), storage).dio;
});

final authServiceProvider = Provider((ref) {
  final dio = ref.watch(dioProvider);
  final storage = ref.watch(storageProvider);
  return AuthService(dio, storage);
});

class AuthService {
  final Dio _dio;
  final FlutterSecureStorage _storage;

  AuthService(this._dio, this._storage);

  Future<Map<String, dynamic>> login(String account, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'account':
            account, // Backend UsersController expects 'account' (Email or EmpID)
        'password': password,
      });

      // Backend returns User object { id, name, empId, role ... }
      final user = response.data;

      // Store simple session data (In real production, use JWT)
      await _storage.write(key: 'user_session', value: jsonEncode(user));
      // Also store ID for future queries
      await _storage.write(key: 'user_id', value: user['id'].toString());

      return user;
    } catch (e) {
      if (e is DioException) {
        if (e.response?.statusCode == 401) {
          throw Exception('帳號或密碼錯誤');
        }
      }
      throw Exception('登入失敗，請檢查網路連線');
    }
  }

  Future<void> logout() async {
    await _storage.deleteAll();
  }

  Future<Map<String, dynamic>?> getUser() async {
    final userStr = await _storage.read(key: 'user_session');
    if (userStr != null) {
      return jsonDecode(userStr);
    }
    return null;
  }

  Future<bool> isAdmin() async {
    final user = await getUser();
    return user != null && user['role'] == 'ADMIN';
  }
}
