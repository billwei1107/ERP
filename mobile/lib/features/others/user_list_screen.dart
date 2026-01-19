import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'admin_providers.dart';
import 'add_user_screen.dart';

class UserListScreen extends ConsumerWidget {
  const UserListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usersAsync = ref.watch(usersListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('帳號管理')),
      body: usersAsync.when(
        data: (users) {
          if (users.isEmpty) return const Center(child: Text('無使用者資料'));

          return ListView.separated(
            itemCount: users.length,
            separatorBuilder: (_, __) => const Divider(),
            itemBuilder: (context, index) {
              final user = users[index];
              final isAdmin = user['role'] == 'ADMIN';

              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: isAdmin ? Colors.purple : Colors.blue,
                  child: Icon(
                    isAdmin ? Icons.admin_panel_settings : Icons.person,
                    color: Colors.white,
                  ),
                ),
                title: Text('${user['name']} (${user['empId']})'),
                subtitle: Text(isAdmin ? '管理員' : '一般員工'),
                trailing: IconButton(
                  icon: const Icon(Icons.delete, color: Colors.grey),
                  onPressed: () => _confirmDelete(context, ref, user),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const AddUserScreen()),
          ).then((_) => ref.refresh(usersListProvider));
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, dynamic user) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('刪除帳號'),
        content: Text('確定要刪除 ${user['name']} 嗎？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await ref.read(adminServiceProvider).deleteUser(user['id']);
                ref.refresh(usersListProvider);
                ScaffoldMessenger.of(context)
                    .showSnackBar(const SnackBar(content: Text('刪除成功')));
              } catch (e) {
                ScaffoldMessenger.of(context)
                    .showSnackBar(SnackBar(content: Text('刪除失敗: $e')));
              }
            },
            child: const Text('刪除', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
