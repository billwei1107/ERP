import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'admin_providers.dart';

class AttendanceAdminScreen extends ConsumerWidget {
  const AttendanceAdminScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // For now we load ALL records. Filtering can be added later as an enhancement.
    final attendanceAsync = ref.watch(adminAttendanceListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('考勤管理')),
      body: attendanceAsync.when(
        data: (records) {
          if (records.isEmpty) return const Center(child: Text('無考勤資料'));

          // Sort by date desc (if not already sorted)
          final sorted = List.from(records);
          sorted.sort((a, b) => b['date'].compareTo(a['date']));

          return ListView.separated(
            itemCount: sorted.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final r = sorted[index];
              final user = r['user'] ?? {};
              final date = DateTime.parse(r['date']).toLocal();
              final dateStr = DateFormat('yyyy/MM/dd').format(date);

              final clockIn = r['clockIn'] != null
                  ? DateFormat('HH:mm')
                      .format(DateTime.parse(r['clockIn']).toLocal())
                  : '--:--';
              final clockOut = r['clockOut'] != null
                  ? DateFormat('HH:mm')
                      .format(DateTime.parse(r['clockOut']).toLocal())
                  : '--:--';

              // Calculate work duration if both exist
              String duration = '';
              if (r['clockIn'] != null && r['clockOut'] != null) {
                final start = DateTime.parse(r['clockIn']);
                final end = DateTime.parse(r['clockOut']);
                final diff = end.difference(start);
                final h = diff.inHours;
                final m = diff.inMinutes.remainder(60);
                duration = '${h}h ${m}m';
              }

              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: Colors.blue.shade100,
                  child: Text(user['name']?.substring(0, 1) ?? '?',
                      style: TextStyle(color: Colors.blue.shade800)),
                ),
                title: Text('${user['name']} ($dateStr)'),
                subtitle: Text('上班: $clockIn  |  下班: $clockOut'),
                trailing: Text(duration,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, color: Colors.green)),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
