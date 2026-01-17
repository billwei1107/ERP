import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/attendance/attendance_service.dart';
import 'package:mobile/features/auth/auth_service.dart';
import 'package:mobile/features/todo/todo_model.dart';
import 'package:mobile/features/todo/todo_service.dart';
import 'package:mobile/features/todo/todo_screen.dart';
import 'package:mobile/features/todo/add_todo_dialog.dart';
import 'package:mobile/features/chat/chat_user_list_screen.dart';
import 'package:intl/intl.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  String? _userName;
  Map<String, dynamic>? _attendanceStatus;
  List<Todo> _recentTodos = [];
  int _remainingTodoCount = 0;
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
        _fetchRecentTodos(userId);
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

  Future<void> _fetchRecentTodos(int userId) async {
    try {
      final service = ref.read(todoServiceProvider);
      final todos = await service.getTodos(userId);
      // Take top 2 uncompleted
      final uncompleted = todos.where((t) => !t.isCompleted).toList();
      final recent = uncompleted.take(2).toList();
      final remaining = uncompleted.length - recent.length;

      if (mounted) {
        setState(() {
          _recentTodos = recent;
          _remainingTodoCount = remaining;
        });
      }
    } catch (e) {
      debugPrint('Error fetching todos in UI: $e');
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

  Future<void> _toggleTodo(Todo todo) async {
    final newState = !todo.isCompleted;

    // 1. Optimistic Update
    setState(() {
      final index = _recentTodos.indexWhere((t) => t.id == todo.id);
      if (index != -1) {
        // Create new object with updated status
        _recentTodos[index] = Todo(
          id: todo.id,
          userId: todo.userId,
          title: todo.title,
          description: todo.description,
          dueAt: todo.dueAt,
          isCompleted: newState,
          createdAt: todo.createdAt,
        );
      }
    });

    try {
      final service = ref.read(todoServiceProvider);
      await service.updateTodo(todo.id, {'isCompleted': newState});

      // 2. If completed, wait 5s then refres (which will remove it since we only fetch uncompleted)
      if (newState) {
        Future.delayed(const Duration(seconds: 5), () {
          if (mounted) {
            // Re-fetching will filter out the completed item
            final userId = _recentTodos
                .firstWhere((t) => t.id == todo.id, orElse: () => todo)
                .userId;
            _fetchRecentTodos(userId);
          }
        });
      }
    } catch (e) {
      // Revert
      final userId = _recentTodos
          .firstWhere((t) => t.id == todo.id, orElse: () => todo)
          .userId;
      _fetchRecentTodos(userId);
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('更新失敗: $e')));
      }
    }
  }

  Future<void> _showQuickAddDialog() async {
    showAddTodoDialog(
      context: context,
      onAdd: (title, description, dueAt) async {
        try {
          final authService = ref.read(authServiceProvider);
          final user = await authService.getUser();
          if (user == null) return;
          final userId =
              user['id'] is int ? user['id'] : int.parse(user['id'].toString());

          final service = ref.read(todoServiceProvider);
          await service.createTodo(userId, title,
              description: description, dueAt: dueAt);

          if (mounted) {
            ScaffoldMessenger.of(context)
                .showSnackBar(const SnackBar(content: Text('新增成功')));
            _fetchRecentTodos(userId); // Refresh preview
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context)
                .showSnackBar(SnackBar(content: Text('新增失敗: $e')));
          }
        }
      },
    );
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
                Row(
                  children: [
                    const Text(
                      '待辦事項',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add_circle, color: Colors.blue),
                      onPressed: _showQuickAddDialog,
                      tooltip: '快速新增',
                    ),
                  ],
                ),
                TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) => const TodoScreen()),
                      ).then((_) {
                        // Refresh when returning from TodoScreen
                        _loadInitialData();
                      });
                    },
                    child: const Text('查看全部')),
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
    if (_recentTodos.isEmpty) {
      return const Card(
        child: ListTile(
          title: Text('目前沒有待辦事項'),
          subtitle: Text('點擊「查看全部」新增第一個待辦'),
        ),
      );
    }

    return Card(
      elevation: 1,
      child: Column(
        children: [
          ..._recentTodos.map((todo) {
            return Column(
              children: [
                ListTile(
                  leading: IconButton(
                    icon: Icon(
                      todo.isCompleted
                          ? Icons.check_circle_outline
                          : Icons.radio_button_unchecked,
                      color: todo.isCompleted ? Colors.green : Colors.grey,
                    ),
                    onPressed: () => _toggleTodo(todo),
                    tooltip: '標記為完成',
                  ),
                  title: Text(
                    todo.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      decoration:
                          todo.isCompleted ? TextDecoration.lineThrough : null,
                    ),
                  ),
                  subtitle: todo.dueAt != null
                      ? Text(
                          DateFormat('MM/dd HH:mm')
                              .format(todo.dueAt!.toLocal()),
                          style: TextStyle(
                              color: todo.dueAt!.isBefore(DateTime.now()) &&
                                      !todo.isCompleted
                                  ? Colors.red
                                  : Colors.grey),
                        )
                      : null,
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => const TodoScreen()),
                    ).then((_) => _loadInitialData());
                  },
                ),
                if (todo != _recentTodos.last || _remainingTodoCount > 0)
                  const Divider(height: 1),
              ],
            );
          }).toList(),
          if (_remainingTodoCount > 0)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(
                '還有 $_remainingTodoCount 個待辦事項沒顯示...',
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
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
