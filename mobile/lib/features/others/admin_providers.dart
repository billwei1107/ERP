import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/auth_service.dart';
import 'admin_service.dart';

// Service Provider
final adminServiceProvider = Provider((ref) {
  final dio = ref.watch(dioProvider);
  return AdminService(dio);
});

// Admin Check Provider
final isAdminProvider = FutureProvider<bool>((ref) async {
  final authService = ref.read(authServiceProvider);
  return await authService.isAdmin();
});

// Users List Provider
final usersListProvider =
    FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final adminService = ref.read(adminServiceProvider);
  return await adminService.getAllUsers();
});

// All Attendance Provider (Simple list)
final adminAttendanceListProvider =
    FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final adminService = ref.read(adminServiceProvider);
  return await adminService.getAllAttendance();
});
