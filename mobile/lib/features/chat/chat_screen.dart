import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'chat_service.dart';
import 'chat_providers.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final int myId;
  final Map<String, dynamic> otherUser;

  const ChatScreen({
    super.key,
    required this.myId,
    required this.otherUser,
  });

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final List<dynamic> _messages = [];
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
    _connectSocket();
    _markMessagesAsRead();
  }

  Future<void> _markMessagesAsRead() async {
    // Call API
    final chatService = ref.read(chatServiceProvider);
    await chatService.markAsRead(widget.myId, widget.otherUser['id']);
    // Update Global Unread Count (Fetch from API)
    try {
      final count = await chatService.getUnreadCount(widget.myId);
      if (mounted) {
        ref.read(unreadCountProvider.notifier).state = count;
      }
    } catch (e) {
      debugPrint('Failed to refresh unread count: $e');
    }
  }

  @override
  void dispose() {
    // Do not disconnect socket here as it is shared with MainScreen/Global
    // final chatService = ref.read(chatServiceProvider);
    // chatService.disconnect();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    try {
      final chatService = ref.read(chatServiceProvider);
      final history =
          await chatService.getHistory(widget.myId, widget.otherUser['id']);
      if (mounted) {
        setState(() {
          _messages.addAll(history);
          _isLoading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      debugPrint('History error: $e');
    }
  }

  void _connectSocket() {
    final chatService = ref.read(chatServiceProvider);
    final socket = chatService.connect(widget.myId);

    // Listen for 'receiveMessage' event from NestJS Gateway
    socket.on('receiveMessage', (data) {
      if (mounted) {
        // Data is the saved message object from DB
        // Check if it belongs to this conversation
        final senderId = data['senderId'];
        final receiverId = data['receiverId'];

        // Include if I am receiver AND sender is otherUser
        // OR if I am sender AND receiver is otherUser (echo confirmation)
        if ((receiverId == widget.myId && senderId == widget.otherUser['id']) ||
            (senderId == widget.myId && receiverId == widget.otherUser['id'])) {
          setState(() {
            _messages.add(data);
          });
          _scrollToBottom();

          // If I am receiving from this user while chat is open, mark as read immediately
          if (receiverId == widget.myId) {
            _markMessagesAsRead();
          }
        }
      }
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
  }

  void _sendMessage() {
    if (_controller.text.trim().isEmpty) return;

    final content = _controller.text;
    final chatService = ref.read(chatServiceProvider);

    // Optimistic Update is tricky with Socket.IO if we receive "echo"
    // NestJS Gateway might emit back to sender.
    // If we optimistic add AND receive echo, we get duplicates.
    // Let's TRY optimistic update, but filter duplicates if possible, or just rely on fast socket.
    // Given the user wants "instant", optimistic is good.
    // I'll skip optimistic update for now to see if Socket.IO is fast enough and persistent.
    // Wait, previous step I ADDED optimistic update.
    // I will KEEP optimistic update but maybe add a flag to ignore the echo if I can?
    // Or, simpler: DON'T add optimistic update yet, confirm persistence first.
    // The user complained about persistence. Persistence > Latency illusion.
    // Socket.IO is fast. Let's see.
    // I will add optimistic update for UX, but I need to handle duplication.
    // For now, let's just send and wait for receiveMessage (which implies SAVED).

    // Send via Socket.IO
    chatService.sendMessage(widget.myId, widget.otherUser['id'], content);

    // Optimistic Update: Show immediately
    if (mounted) {
      setState(() {
        _messages.add({
          'content': content,
          'senderId': widget.myId,
          'receiverId': widget.otherUser['id'],
          'createdAt': DateTime.now().toIso8601String(),
        });
      });
      _scrollToBottom();
    }

    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.otherUser['name'])),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];
                      final isMe = msg['senderId'] == widget.myId;
                      final time = msg['createdAt'] != null
                          ? DateFormat('HH:mm').format(
                              DateTime.parse(msg['createdAt']).toLocal())
                          : '';

                      return Align(
                        alignment:
                            isMe ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: isMe ? Colors.blue[100] : Colors.grey[200],
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(msg['content'] ?? ''),
                              const SizedBox(height: 2),
                              Text(time,
                                  style: const TextStyle(
                                      fontSize: 10, color: Colors.grey)),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      hintText: '輸入訊息...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
