import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/core/dio_client.dart';
// ignore: library_prefixes
import 'package:socket_io_client/socket_io_client.dart' as IO;

final chatServiceProvider = Provider((ref) {
  final dioClient = ref.read(dioClientProvider);
  return ChatService(dioClient.dio);
});

class ChatService {
  final Dio _dio;
  IO.Socket? _socket;

  // Stream to expose messages to UI
  // We can use a StreamController, but for simplicity let's stick to existing pattern
  // or return the socket to listen to.
  // Better: Create a stream that emits received messages.

  ChatService(this._dio);

  // 1. Fetch Users with Metadata (Unread/Sort)
  Future<List<dynamic>> getChatUsers(int myId) async {
    try {
      final response = await _dio.get('/chat/users/$myId');
      return response.data as List<dynamic>;
    } catch (e) {
      // Fallback
      return getUsers();
    }
  }

  // Legacy (keep for backup)
  Future<List<dynamic>> getUsers() async {
    try {
      final response = await _dio.get('/users');
      return response.data as List<dynamic>;
    } catch (e) {
      throw Exception('Failed to load users: $e');
    }
  }

  // Mark as Read
  Future<void> markAsRead(int myId, int otherUserId) async {
    try {
      await _dio.get('/chat/read/$myId/$otherUserId');
    } catch (e) {
      debugPrint('Failed to mark read: $e');
    }
  }

  // Get Global Unread
  Future<int> getUnreadCount(int myId) async {
    try {
      final response = await _dio.get('/chat/unread/$myId');
      return response.data['count'] as int;
    } catch (e) {
      return 0;
    }
  }

  // 2. Fetch Chat History (REST - Unchanged)
  Future<List<dynamic>> getHistory(int myId, int otherUserId) async {
    try {
      final response = await _dio.get('/chat/history/$myId/$otherUserId');
      return response.data as List<dynamic>;
    } catch (e) {
      throw Exception('Failed to load history: $e');
    }
  }

  // 3. Connect Socket.IO
  IO.Socket connect(int userId) {
    // If socket exists, reuse it (even if connecting)
    if (_socket != null) {
      if (!_socket!.connected) {
        _socket!.connect();
      }
      return _socket!;
    }

    _socket = IO.io(
      'http://54.255.186.244:8080/chat', // Nginx Port + Namespace
      IO.OptionBuilder()
          .setTransports(['websocket', 'polling']) // Allow polling fallback
          .setPath('/api/socket.io')
          .setQuery({'userId': userId.toString()}) // Explicit string
          .disableAutoConnect()
          .build(),
    );

    _socket!.connect();

    _socket!.onConnect((_) {
      debugPrint('Socket Connected');
    });

    _socket!.onDisconnect((_) => debugPrint('Socket Disconnected'));
    _socket!
        .onConnectError((data) => debugPrint('Socket Connect Error: $data'));
    _socket!.onError((data) => debugPrint('Socket Error: $data'));

    return _socket!;
  }

  // 4. Send Message
  void sendMessage(int myId, int receiverId, String content) {
    if (_socket != null) {
      // payload matches ChatGateway.handleMessage expectations
      // @MessageBody() payload: { senderId: number; receiverId: number; content: string }
      final payload = {
        'senderId': myId,
        'receiverId': receiverId,
        'content': content,
      };
      _socket!.emit('sendMessage', payload);
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
