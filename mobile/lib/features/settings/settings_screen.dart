import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/auth_service.dart';
import 'settings_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    final userAsync = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('個人設定')),
      body: ListView(
        children: [
          // User Profile Section
          userAsync.when(
            data: (user) => UserAccountsDrawerHeader(
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor,
              ),
              accountName: Text(
                user?['name'] ?? 'Guest',
                style:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              accountEmail: Text(user?['email'] ?? ''),
              currentAccountPicture: CircleAvatar(
                backgroundColor: Colors.white,
                child: Text(
                  (user?['name'] ?? 'G').substring(0, 1).toUpperCase(),
                  style: TextStyle(
                      fontSize: 24, color: Theme.of(context).primaryColor),
                ),
              ),
            ),
            loading: () => const LinearProgressIndicator(),
            error: (_, __) => const SizedBox.shrink(),
          ),

          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text('外觀',
                style:
                    TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
          ),

          RadioListTile<ThemeMode>(
            title: const Text('跟隨系統'),
            value: ThemeMode.system,
            groupValue: themeMode,
            onChanged: (val) => ref.read(themeProvider.notifier).setTheme(val!),
          ),
          RadioListTile<ThemeMode>(
            title: const Text('淺色模式'),
            value: ThemeMode.light,
            groupValue: themeMode,
            onChanged: (val) => ref.read(themeProvider.notifier).setTheme(val!),
          ),
          RadioListTile<ThemeMode>(
            title: const Text('深色模式'),
            value: ThemeMode.dark,
            groupValue: themeMode,
            onChanged: (val) => ref.read(themeProvider.notifier).setTheme(val!),
          ),

          // Logout moved to Others screen
        ],
      ),
    );
  }
}
