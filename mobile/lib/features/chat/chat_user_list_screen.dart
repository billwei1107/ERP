import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/auth/auth_service.dart';
import 'chat_service.dart';
import 'chat_screen.dart';

class ChatUserListScreen extends ConsumerStatefulWidget {
  const ChatUserListScreen({super.key});

  @override
  ConsumerState<ChatUserListScreen> createState() => _ChatUserListScreenState();
}

class _ChatUserListScreenState extends ConsumerState<ChatUserListScreen> {
  List<dynamic> _users = [];
  bool _isLoading = true;
  int? _currentUserId;

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    try {
      final authService = ref.read(authServiceProvider);
      final currentUser = await authService.getUser();
      if (currentUser != null) {
        _currentUserId = currentUser['id'] is int
            ? currentUser['id']
            : int.parse(currentUser['id'].toString());
      }

      final chatService = ref.read(chatServiceProvider);
      final users = await chatService.getUsers();

      if (mounted) {
        setState(() {
          // Filter out current user
          _users = users.where((u) => u['id'] != _currentUserId).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('載入用戶失敗: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('通訊錄')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _users.isEmpty
              ? const Center(child: Text('沒有其他用戶'))
              : ListView.builder(
                  itemCount: _users.length,
                  itemBuilder: (context, index) {
                    final user = _users[index];
                    return ListTile(
                      leading: CircleAvatar(
                        child: Text(user['name']?[0] ?? '?'),
                      ),
                      title: Text(user['name'] ?? 'Unknown'),
                      subtitle: Text(user['email'] ?? ''),
                      onTap: () {
                        if (_currentUserId != null) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ChatScreen(
                                myId: _currentUserId!,
                                otherUser: user,
                              ),
                            ),
                          );
                        }
                      },
                    );
                  },
                ),
    );
  }
}
