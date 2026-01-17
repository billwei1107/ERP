import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'chat_service.dart';

final unreadCountProvider = StateProvider<int>((ref) => 0);

final chatUserListProvider =
    FutureProvider.family<List<dynamic>, int>((ref, myId) async {
  final chatService = ref.read(chatServiceProvider);
  return chatService.getChatUsers(myId);
});
