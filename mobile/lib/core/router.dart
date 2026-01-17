import 'package:go_router/go_router.dart';
import 'package:mobile/features/auth/login_screen.dart';
import 'package:mobile/features/dashboard/dashboard_screen.dart';
import 'package:mobile/features/chat/chat_user_list_screen.dart';
import 'package:mobile/features/finance/finance_screen.dart';
import 'package:mobile/features/inventory/inventory_screen.dart';
import 'package:mobile/features/others/others_screen.dart';
import 'package:mobile/features/home/scaffold_with_nav_bar.dart';

final router = GoRouter(
  initialLocation: '/login', // Start at login
  routes: [
    GoRoute(
      path: '/',
      redirect: (_, __) => '/login',
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    // Shell Route for Bottom Navigation
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return ScaffoldWithNavBar(navigationShell: navigationShell);
      },
      branches: [
        // Tab 1: Home (Dashboard)
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const DashboardScreen(),
            ),
          ],
        ),
        // Tab 2: Chat
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/chat',
              builder: (context, state) => const ChatUserListScreen(),
            ),
          ],
        ),
        // Tab 3: Inventory
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/inventory',
              builder: (context, state) => const InventoryScreen(),
            ),
          ],
        ),
        // Tab 4: Finance
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/finance',
              builder: (context, state) => const FinanceScreen(),
            ),
          ],
        ),
        // Tab 5: Others
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/others',
              builder: (context, state) => const OthersScreen(),
            ),
          ],
        ),
      ],
    ),
  ],
);
