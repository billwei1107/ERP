import 'package:dio/dio.dart';

class AdminService {
  final Dio _dio;

  AdminService(this._dio);

  // --- User Management ---

  Future<List<dynamic>> getAllUsers() async {
    final response = await _dio.get('/users');
    return response.data as List<dynamic>;
  }

  Future<void> createUser(Map<String, dynamic> data) async {
    await _dio.post('/users', data: data);
  }

  Future<void> updateUser(int id, Map<String, dynamic> data) async {
    await _dio.patch('/users/$id', data: data);
  }

  Future<void> deleteUser(int id) async {
    await _dio.delete('/users/$id');
  }

  // --- Attendance Management ---

  Future<List<dynamic>> getAllAttendance() async {
    // API endpoint based on backend verification
    final response = await _dio.get('/attendance/all');
    return response.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> getMonthlyAttendance(
      {int? userId, required int year, required int month}) async {
    final query = {
      'year': year,
      'month': month,
    };
    if (userId != null) query['userId'] = userId;

    final response =
        await _dio.get('/attendance/month', queryParameters: query);
    return response.data as Map<String, dynamic>;
  }
}
