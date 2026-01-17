import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/dio_client.dart';

final attendanceServiceProvider = Provider<AttendanceService>((ref) {
  final dio = ref.watch(dioClientProvider).dio;
  return AttendanceService(dio);
});

class AttendanceService {
  final Dio _dio;

  AttendanceService(this._dio);

  Future<Map<String, dynamic>> clockIn(int userId) async {
    try {
      final response = await _dio.post(
        '/attendance/clock-in',
        data: {'userId': userId},
      );
      return response.data;
    } on DioException catch (e) {
      throw e.response?.data['message'] ?? 'Failed to clock in';
    }
  }

  Future<Map<String, dynamic>> clockOut(int userId) async {
    try {
      final response = await _dio.post(
        '/attendance/clock-out',
        data: {'userId': userId},
      );
      return response.data;
    } on DioException catch (e) {
      throw e.response?.data['message'] ?? 'Failed to clock out';
    }
  }

  Future<Map<String, dynamic>> getTodayStatus(int userId) async {
    try {
      debugPrint('Fetching attendance for userId: $userId');
      final response = await _dio.get(
        '/attendance/today',
        queryParameters: {'userId': userId},
      );

      debugPrint('Raw response data: ${response.data}');

      // Backend returns List<Attendance> desc by time
      final List<dynamic> records = response.data;

      String? lastClockIn;
      String? lastClockOut;
      String? lastRecordType;

      if (records.isNotEmpty) {
        lastRecordType = records[0]['type'];
      }

      // Find LATEST clock in (for display)
      // Since list is DESC, the first CLOCK_IN we find is the latest.
      for (var record in records) {
        if (record['type'] == 'CLOCK_IN') {
          if (lastClockIn == null) lastClockIn = record['time'];
        }
        if (record['type'] == 'CLOCK_OUT') {
          if (lastClockOut == null) lastClockOut = record['time'];
        }
      }

      final result = {
        'clockIn': lastClockIn,
        'clockOut': lastClockOut,
        'lastRecordType': lastRecordType,
      };

      debugPrint('Parsed status: $result');
      return result;
    } on DioException catch (e) {
      debugPrint('DioError: ${e.response?.data}');
      throw e.response?.data['message'] ?? 'Failed to fetch status';
    } catch (e, stack) {
      debugPrint('Error parsing attendance: $e\n$stack');
      rethrow;
    }
  }
}
