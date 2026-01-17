import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/attendance/attendance_service.dart';
import 'package:mobile/features/auth/auth_service.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  String? _userName;
  Map<String, dynamic>? _attendanceStatus;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    try {
      final authService = ref.read(authServiceProvider);
      final user = await authService.getUser();
      debugPrint('Loaded user: $user');

      if (user != null) {
        if (mounted) {
          setState(() => _userName = user['name']);
        }
        // Ensure ID is passed as int
        final userId =
            user['id'] is int ? user['id'] : int.parse(user['id'].toString());
        _fetchAttendanceStatus(userId);
      }
    } catch (e) {
      debugPrint('Error loading initial data: $e');
    }
  }

  Future<void> _fetchAttendanceStatus(int userId) async {
    try {
      debugPrint('Fetching status for userId: $userId');
      final service = ref.read(attendanceServiceProvider);
      final status = await service.getTodayStatus(userId);
      debugPrint('Received status: $status');
      if (mounted) {
        setState(() => _attendanceStatus = status);
      }
    } catch (e) {
      debugPrint('Error fetching attendance in UI: $e');
    }
  }

  Future<void> _handleClockIn() async {
    await _performAttendanceAction(
        (service, userId) => service.clockIn(userId), '上班打卡成功');
  }

  Future<void> _handleClockOut() async {
    await _performAttendanceAction(
        (service, userId) => service.clockOut(userId), '下班打卡成功');
  }

  Future<void> _performAttendanceAction(
      Future<void> Function(AttendanceService, int) action,
      String successMessage) async {
    final authService = ref.read(authServiceProvider);
    final user = await authService.getUser();
    if (user == null) return;

    final userId =
        user['id'] is int ? user['id'] : int.parse(user['id'].toString());

    setState(() => _isLoading = true);
    try {
      final service = ref.read(attendanceServiceProvider);
      await action(service, userId);
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(successMessage)));
        await _fetchAttendanceStatus(userId);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('操作失敗: $e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Show LATEST Clock In time if available
    final clockInTime = _attendanceStatus?['clockIn'] != null
        ? DateTime.parse(_attendanceStatus!['clockIn'])
            .toLocal()
            .toString()
            .substring(11, 16)
        : '--:--';

    // Show LATEST Clock Out time if available
    final clockOutTime = _attendanceStatus?['clockOut'] != null
        ? DateTime.parse(_attendanceStatus!['clockOut'])
            .toLocal()
            .toString()
            .substring(11, 16)
        : '--:--';

    return Scaffold(
      appBar: AppBar(
        title: const Text('儀表板'),
        automaticallyImplyLeading: false, // Hide back button
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Welcome / Date
            Text(
              '${DateTime.now().year}/${DateTime.now().month}/${DateTime.now().day}',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              '早安，${_userName ?? 'User'}',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 24),

            // 2. Attendance Card
            const Text(
              '打卡',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        Column(
                          children: [
                            const Text('上班打卡',
                                style: TextStyle(color: Colors.grey)),
                            const SizedBox(height: 4),
                            Text(clockInTime,
                                style: Theme.of(context).textTheme.titleLarge),
                          ],
                        ),
                        Container(
                            width: 1, height: 40, color: Colors.grey[300]),
                        Column(
                          children: [
                            const Text('下班打卡',
                                style: TextStyle(color: Colors.grey)),
                            const SizedBox(height: 4),
                            Text(clockOutTime,
                                style: Theme.of(context).textTheme.titleLarge),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _isLoading
                        ? const Center(child: CircularProgressIndicator())
                        : Row(
                            children: [
                              Expanded(
                                child: ElevatedButton(
                                  // Enable Clock In if NO record OR Last was CLOCK_OUT
                                  onPressed: (_attendanceStatus == null ||
                                          _attendanceStatus![
                                                  'lastRecordType'] ==
                                              'CLOCK_OUT' ||
                                          _attendanceStatus![
                                                  'lastRecordType'] ==
                                              null)
                                      ? _handleClockIn
                                      : null,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.blue,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 12),
                                  ),
                                  child: const Text('上班'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: ElevatedButton(
                                  // Enable Clock Out if Last was CLOCK_IN
                                  onPressed: (_attendanceStatus != null &&
                                          _attendanceStatus![
                                                  'lastRecordType'] ==
                                              'CLOCK_IN')
                                      ? _handleClockOut
                                      : null,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.orange,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 12),
                                  ),
                                  child: const Text('下班'),
                                ),
                              ),
                            ],
                          ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // 3. Todo Preview
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '待辦事項',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                TextButton(onPressed: () {}, child: const Text('查看全部')),
              ],
            ),
            _buildTodoPreview(),

            const SizedBox(height: 24),

            // 4. Inventory Alerts
            const Text(
              '庫存警示',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            _buildInventoryAlerts(),
          ],
        ),
      ),
    );
  }

  Widget _buildTodoPreview() {
    return Card(
      elevation: 1,
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.check_circle_outline),
            title: const Text('完成庫存盤點'),
            subtitle: const Text('今日 14:00 截止'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.radio_button_unchecked),
            title: const Text('財務報表審核'),
            subtitle: const Text('明日 10:00'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildInventoryAlerts() {
    return Card(
      color: Colors.red[50],
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.red[100]!),
      ),
      child: ListTile(
        leading: const Icon(Icons.warning_amber_rounded, color: Colors.red),
        title: const Text('3 項商品庫存過低'),
        subtitle: const Text('iPhone 15 Pro, MacBook Air...'),
        trailing: const Icon(Icons.arrow_forward, size: 16),
        onTap: () {
          // Navigate to inventory tab
        },
      ),
    );
  }
}
