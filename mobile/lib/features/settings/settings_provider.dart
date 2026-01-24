import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../features/auth/auth_service.dart';

// Theme Mode Provider with persistence
final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>((ref) {
  return ThemeNotifier(ref);
});

class ThemeNotifier extends StateNotifier<ThemeMode> {
  final Ref _ref;
  final _storage = const FlutterSecureStorage();
  static const _key = 'theme_mode';

  ThemeNotifier(this._ref) : super(ThemeMode.system) {
    _loadTheme();
    _listenToUserChanges();
  }

  void _listenToUserChanges() {
    _ref.listen<AsyncValue<Map<String, dynamic>?>>(currentUserProvider,
        (previous, next) {
      next.whenData((user) {
        if (user != null && user['settings'] != null) {
          final settings = user['settings'];
          if (settings['theme'] != null) {
            final theme = settings['theme'];
            if (theme == 'dark')
              state = ThemeMode.dark;
            else if (theme == 'light')
              state = ThemeMode.light;
            else
              state = ThemeMode.system;

            // Sync local storage
            _storage.write(key: _key, value: theme);
            return;
          }
        }

        // If we reach here, it means:
        // 1. User is null (Logged out?) -> wait, if logged out, this provider might not unmount.
        // 2. User has no settings -> Revert to System?
        // Let's rely on reset() being called on logout.
        // But if user logs in and HAS NO params, we should reset to system.
        if (user != null) {
          // Only force reset if user is active but has no theme
          state = ThemeMode.system;
          _storage.write(key: _key, value: 'system');
        }
      });
    });
  }

  Future<void> _loadTheme() async {
    final saved = await _storage.read(key: _key);
    if (saved != null) {
      if (saved == 'dark')
        state = ThemeMode.dark;
      else if (saved == 'light')
        state = ThemeMode.light;
      else
        state = ThemeMode.system;
    }
  }

  // Called on Logout to clear preference
  Future<void> reset() async {
    state = ThemeMode.system;
    await _storage.delete(key: _key);
  }

  Future<void> setTheme(ThemeMode mode) async {
    state = mode;
    String val = 'system';
    if (mode == ThemeMode.dark) val = 'dark';
    if (mode == ThemeMode.light) val = 'light';

    // 1. Update Local Storage (Device Default)
    await _storage.write(key: _key, value: val);

    // 2. Update Backend (User Preference)
    final user = _ref.read(currentUserProvider).value;
    if (user != null) {
      final authService = _ref.read(authServiceProvider);
      // Merge with existing settings
      final currentSettings = user['settings'] ?? {};
      currentSettings['theme'] = val;

      try {
        await authService.updateUserSettings(user['id'], currentSettings);
      } catch (e) {
        debugPrint('Sync Theme Error: $e');
      }
    }
  }
}
