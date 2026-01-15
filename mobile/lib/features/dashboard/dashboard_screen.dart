import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // In a real app, you might fetch user name from provider
    // final user = ref.watch(userProvider);

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
              '早安，User', // Placeholder name
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
            _buildAttendanceCard(context),

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

  Widget _buildAttendanceCard(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    const Text('上班打卡', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 4),
                    Text('--:--',
                        style: Theme.of(context).textTheme.titleLarge),
                  ],
                ),
                Container(width: 1, height: 40, color: Colors.grey[300]),
                Column(
                  children: [
                    const Text('下班打卡', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 4),
                    Text('--:--',
                        style: Theme.of(context).textTheme.titleLarge),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {}, // Implement Clock In
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('上班'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {}, // Implement Clock Out
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('下班'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTodoPreview() {
    // Mock Data
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
