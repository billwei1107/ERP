import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/features/chat/chat_providers.dart';
import 'package:mobile/features/chat/chat_service.dart';
import 'package:mobile/features/chat/chat_user_list_screen.dart';
import 'package:mobile/features/dashboard/dashboard_screen.dart';
import 'package:mobile/features/inventory/inventory_screen.dart';
import 'package:mobile/features/finance/finance_screen.dart';

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

    socket.on('receiveMessage', (data) {
      if (data['receiverId'] == _myId) {
        ref.read(unreadCountProvider.notifier).state++;
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
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      const DashboardScreen(),
      const ChatUserListScreen(),
      const InventoryScreen(),
      const FinanceScreen(),
    ];

    final unreadCount = ref.watch(unreadCountProvider);

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() => _currentIndex = index);
          if (index == 1 && _myId != null) {
            ref.refresh(chatUserListProvider(_myId!));
          }
        },
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: '儀表板',
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
            label: '通訊',
          ),
          const NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2),
            label: '庫存',
          ),
          const NavigationDestination(
            icon: Icon(Icons.attach_money_outlined),
            selectedIcon: Icon(Icons.attach_money),
            label: '財務',
          ),
        ],
      ),
    );
  }
}
