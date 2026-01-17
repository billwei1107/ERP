import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/auth/auth_service.dart';
import 'todo_model.dart';
import 'todo_service.dart';
import 'package:intl/intl.dart';
import 'add_todo_dialog.dart';

class TodoScreen extends ConsumerStatefulWidget {
  const TodoScreen({super.key});

  @override
  ConsumerState<TodoScreen> createState() => _TodoScreenState();
}

class _TodoScreenState extends ConsumerState<TodoScreen> {
  List<Todo> _todos = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadTodos();
  }

  Future<void> _loadTodos() async {
    try {
      final authService = ref.read(authServiceProvider);
      final user = await authService.getUser();
      if (user == null) return;

      final userId =
          user['id'] is int ? user['id'] : int.parse(user['id'].toString());

      final service = ref.read(todoServiceProvider);
      final todos = await service.getTodos(userId);

      if (mounted) {
        setState(() {
          _todos = todos.where((t) => !t.isCompleted).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading todos: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _addTodo(
      String title, String? description, DateTime? dueAt) async {
    try {
      final authService = ref.read(authServiceProvider);
      final user = await authService.getUser();
      if (user == null) return;
      final userId =
          user['id'] is int ? user['id'] : int.parse(user['id'].toString());

      final service = ref.read(todoServiceProvider);
      await service.createTodo(userId, title,
          description: description, dueAt: dueAt);
      _loadTodos(); // Refresh list
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('新增失敗: $e')));
      }
    }
  }

  Future<void> _toggleTodo(Todo todo) async {
    final newState = !todo.isCompleted;

    // 1. Optimistic Update (Update UI immediately)
    setState(() {
      final index = _todos.indexWhere((t) => t.id == todo.id);
      if (index != -1) {
        // Create new object with updated status
        _todos[index] = Todo(
          id: todo.id,
          userId: todo.userId,
          title: todo.title,
          description: todo.description,
          dueAt: todo.dueAt,
          isCompleted: newState,
          createdAt: todo.createdAt,
        );
      }
    });

    try {
      final service = ref.read(todoServiceProvider);
      await service.updateTodo(todo.id, {'isCompleted': newState});

      // 2. If completed, wait 5s then remove from list
      if (newState) {
        Future.delayed(const Duration(seconds: 5), () {
          if (mounted) {
            setState(() {
              _todos.removeWhere((t) => t.id == todo.id && t.isCompleted);
            });
          }
        });
      }
    } catch (e) {
      // Revert if error
      _loadTodos();
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('更新失敗: $e')));
      }
    }
  }

  Future<void> _deleteTodo(int id) async {
    try {
      final service = ref.read(todoServiceProvider);
      await service.deleteTodo(id);
      _loadTodos();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('刪除失敗: $e')));
      }
    }
  }

  void _showAddTodoDialog() {
    showAddTodoDialog(
      context: context,
      onAdd: _addTodo,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('待辦事項')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _todos.isEmpty
              ? const Center(child: Text('目前沒有待辦事項'))
              : ListView.builder(
                  itemCount: _todos.length,
                  padding: const EdgeInsets.all(16),
                  itemBuilder: (context, index) {
                    final todo = _todos[index];
                    return Dismissible(
                      key: Key(todo.id.toString()),
                      background: Container(color: Colors.red),
                      onDismissed: (_) => _deleteTodo(todo.id),
                      child: Card(
                        child: ListTile(
                          leading: Checkbox(
                            value: todo.isCompleted,
                            onChanged: (_) => _toggleTodo(todo),
                          ),
                          title: Text(
                            todo.title,
                            style: TextStyle(
                              decoration: todo.isCompleted
                                  ? TextDecoration.lineThrough
                                  : null,
                              color: todo.isCompleted ? Colors.grey : null,
                            ),
                          ),
                          subtitle: todo.dueAt != null
                              ? Text(
                                  '截止: ${DateFormat('yyyy-MM-dd HH:mm').format(todo.dueAt!.toLocal())}',
                                  style: TextStyle(
                                    color:
                                        todo.dueAt!.isBefore(DateTime.now()) &&
                                                !todo.isCompleted
                                            ? Colors.red
                                            : Colors.grey,
                                  ),
                                )
                              : null,
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddTodoDialog,
        child: const Icon(Icons.add),
      ),
    );
  }
}
