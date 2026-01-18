import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/features/chat/chat_providers.dart';
import 'package:mobile/features/chat/chat_service.dart';

class ScaffoldWithNavBar extends ConsumerStatefulWidget {
  const ScaffoldWithNavBar({
    required this.navigationShell,
    super.key,
  });

  final StatefulNavigationShell navigationShell;

  @override
  ConsumerState<ScaffoldWithNavBar> createState() => _ScaffoldWithNavBarState();
}

class _ScaffoldWithNavBarState extends ConsumerState<ScaffoldWithNavBar> {
  final _storage = const FlutterSecureStorage();
  int? _myId;

  @override
  void initState() {
    super.initState();
    _init();
  }

  void _init() async {
    final idStr = await _storage.read(key: 'userId');
    if (idStr != null) {
      _myId = int.parse(idStr);
      _connectSocket();
      _fetchUnreadCount();

      // Also refresh the user list initially to get sorts right
      ref.read(chatUserListProvider(_myId!));
    }
  }

  void _connectSocket() {
    if (_myId == null) return;
    final chatService = ref.read(chatServiceProvider);
    final socket = chatService.connect(_myId!);

    socket.on('receiveMessage', (data) {
      // If I am the receiver
      if (data['receiverId'] == _myId) {
        // Increment global badge
        ref.read(unreadCountProvider.notifier).state++;
        // Refresh list to re-sort
        ref.invalidate(chatUserListProvider(_myId!));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('收到新訊息! 未讀: ${ref.read(unreadCountProvider)}'),
              duration: const Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    });

    // Debug Ping
    _socket?.emit('ping', {'userId': _myId});

    // Also listen to 'messagesRead' if we implement it for cross-device sync
  }

  Future<void> _fetchUnreadCount() async {
    if (_myId == null) return;
    final chatService = ref.read(chatServiceProvider);
    final count = await chatService.getUnreadCount(_myId!);
    ref.read(unreadCountProvider.notifier).state = count;
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = ref.watch(unreadCountProvider);

    return Scaffold(
      body: widget.navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: widget.navigationShell.currentIndex,
        onDestinationSelected: (int index) {
          widget.navigationShell.goBranch(
            index,
            initialLocation: index == widget.navigationShell.currentIndex,
          );

          // If going to Chat Tab, refresh list
          if (index == 1 && _myId != null) {
            ref.invalidate(chatUserListProvider(_myId!));
          }
        },
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: '首頁',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: unreadCount > 0,
              label: Text('$unreadCount'),
              child: const Icon(Icons.chat_bubble_outline),
            ),
            selectedIcon: Badge(
              isLabelVisible: unreadCount > 0,
              label: Text('$unreadCount'),
              child: const Icon(Icons.chat_bubble),
            ),
            label: '即時通訊',
          ),
          const NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2),
            label: '庫存',
          ),
          const NavigationDestination(
            icon: Icon(Icons.attach_money),
            selectedIcon: Icon(Icons.attach_money),
            label: '財務',
          ),
          const NavigationDestination(
            icon: Icon(Icons.menu),
            selectedIcon: Icon(Icons.menu),
            label: '其他',
          ),
        ],
      ),
    );
  }
}
