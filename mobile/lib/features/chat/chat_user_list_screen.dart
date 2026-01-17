import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/auth/auth_service.dart';

import 'chat_screen.dart';
import 'package:mobile/features/chat/chat_providers.dart';

class ChatUserListScreen extends ConsumerStatefulWidget {
  const ChatUserListScreen({super.key});

  @override
  ConsumerState<ChatUserListScreen> createState() => _ChatUserListScreenState();
}

class _ChatUserListScreenState extends ConsumerState<ChatUserListScreen> {
  int? _currentUserId;

  @override
  void initState() {
    super.initState();
    _loadCurrentUser();
  }

  Future<void> _loadCurrentUser() async {
    final authService = ref.read(authServiceProvider);
    final currentUser = await authService.getUser();
    if (currentUser != null && mounted) {
      setState(() {
        _currentUserId = currentUser['id'] is int
            ? currentUser['id']
            : int.parse(currentUser['id'].toString());
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_currentUserId == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final usersAsync = ref.watch(chatUserListProvider(_currentUserId!));

    return Scaffold(
      appBar: AppBar(title: const Text('即時通訊')),
      body: usersAsync.when(
        data: (users) {
          if (users.isEmpty) {
            return const Center(child: Text('沒有其他用戶'));
          }
          return ListView.builder(
            itemCount: users.length,
            itemBuilder: (context, index) {
              final user = users[index];
              final unread = user['unreadCount'] ?? 0;

              return ListTile(
                leading: CircleAvatar(
                  child: Text(user['name']?[0] ?? '?'),
                ),
                title: Text(user['name'] ?? 'Unknown'),
                subtitle: Text(user['email'] ?? ''),
                trailing: unread > 0
                    ? Badge(
                        label: Text('$unread'),
                        child: const Icon(Icons.message,
                            color: Colors.transparent), // invisible anchor
                      )
                    : null,
                onTap: () async {
                  // Mark as read immediately purely for UI snappy feel (optional)
                  // Navigate
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ChatScreen(
                        myId: _currentUserId!,
                        otherUser: user,
                      ),
                    ),
                  );
                  // Refresh list when coming back
                  ref.invalidate(chatUserListProvider(_currentUserId));

                  // Refresh global badge by fetching real count
                  ref
                      .read(chatServiceProvider)
                      .getUnreadCount(_currentUserId!)
                      .then((count) {
                    if (context.mounted) {
                      ref.read(unreadCountProvider.notifier).state = count;
                    }
                  });
                },
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('載入失敗: $err')),
      ),
    );
  }
}
