import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/auth_service.dart';
import 'admin_providers.dart';
import 'user_list_screen.dart';
import 'attendance_admin_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../features/settings/settings_provider.dart';

class OthersScreen extends ConsumerWidget {
  const OthersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAdminAsync = ref.watch(isAdminProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('其他功能')),
      body: ListView(
        children: [
          // Admin Features
          isAdminAsync.when(
            data: (isAdmin) {
              if (!isAdmin) return const SizedBox.shrink();
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('管理員功能',
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue)),
                  ),
                  ListTile(
                    leading: const Icon(Icons.people_alt, color: Colors.blue),
                    title: const Text('帳號管理'),
                    subtitle: const Text('管理員工帳號'),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const UserListScreen())),
                  ),
                  const Divider(),
                  ListTile(
                    leading: const Icon(Icons.access_time_filled,
                        color: Colors.green),
                    title: const Text('考勤管理'),
                    subtitle: const Text('查看員工考勤'),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const AttendanceAdminScreen())),
                  ),
                  const Divider(),
                ],
              );
            },
            loading: () => const LinearProgressIndicator(),
            error: (_, __) => const SizedBox.shrink(),
          ),

          // Common User Features
          ListTile(
            leading: const Icon(Icons.settings),
            title: const Text('個人設定'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const SettingsScreen())),
          ),

          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('登出', style: TextStyle(color: Colors.red)),
            onTap: () async {
              await ref.read(authServiceProvider).logout();
              ref.invalidate(isAdminProvider);
              ref.invalidate(currentUserProvider);
              // Reset theme to system default
              await ref.read(themeProvider.notifier).reset();

              if (context.mounted) {
                // Assuming '/' is login or redirects to login
                context.go('/');
              }
            },
          ),
        ],
      ),
    );
  }
}
