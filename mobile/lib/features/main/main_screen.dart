import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/features/chat/chat_providers.dart';
import 'package:mobile/features/chat/chat_service.dart';
import 'package:mobile/features/chat/chat_user_list_screen.dart';
import 'package:mobile/features/dashboard/dashboard_screen.dart';

class MainScreen extends ConsumerStatefulWidget {
  const MainScreen({super.key});

  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen>
    with WidgetsBindingObserver {
  int _currentIndex = 0;
  final _storage = const FlutterSecureStorage();
  int? _myId;

  // Pages
  List<Widget> _pages = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _init();
  }

  void _init() async {
    final idStr = await _storage.read(key: 'userId');
    if (idStr != null) {
      _myId = int.parse(idStr);
      _connectSocket();
      _fetchUnreadCount();
    }
  }

  void _connectSocket() {
    if (_myId == null) return;
    final chatService = ref.read(chatServiceProvider);
    final socket = chatService.connect(_myId!);

    // Listen for global messages to update badge
    socket.on('receiveMessage', (data) {
      // Check if message is for me
      if (data['receiverId'] == _myId) {
        // Increment badge
        // In a real app, check if we are currently viewing this chat
        ref.read(unreadCountProvider.notifier).state++;

        // Also refresh the chat list if we are on that tab?
        // We can use a Stream or just let the user pull to refresh.
        // Or invalidate provider:
        ref.invalidate(chatUserListProvider);
      }
    });
  }

  Future<void> _fetchUnreadCount() async {
    if (_myId == null) return;
    final chatService = ref.read(chatServiceProvider);
    final count = await chatService.getUnreadCount(_myId!);
    ref.read(unreadCountProvider.notifier).state = count;
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    // Don't disconnect socket here if we want persistence,
    // but usually MainScreen disposal means App Exit.
    // chatService.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Lazy load pages or keep state
    final pages = [
      const DashboardScreen(), // Make sure DashboardScreen doesn't assume it's the only scaffold
      const ChatUserListScreen(),
    ];

    final unreadCount = ref.watch(unreadCountProvider);

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
          if (index == 1 && _myId != null) {
            // Refresh list when entering chat tab
            ref.refresh(chatUserListProvider(_myId!));
          }
        },
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: '儀表板',
          ),
          BottomNavigationBarItem(
            icon: Badge(
              isLabelVisible: unreadCount > 0,
              label: Text('$unreadCount'),
              child: const Icon(Icons.chat),
            ),
            label: '即時通訊',
          ),
        ],
      ),
    );
  }
}
