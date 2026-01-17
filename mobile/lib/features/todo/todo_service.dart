import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/dio_client.dart';
import 'todo_model.dart';

final todoServiceProvider = Provider<TodoService>((ref) {
  final dioClient = ref.read(dioClientProvider);
  return TodoService(dioClient.dio);
});

class TodoService {
  final Dio _dio;

  TodoService(this._dio);

  Future<List<Todo>> getTodos(int userId) async {
    try {
      final response =
          await _dio.get('/todos', queryParameters: {'userId': userId});
      final List<dynamic> data = response.data;
      return data.map((json) => Todo.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch todos: $e');
    }
  }

  Future<Todo> createTodo(int userId, String title,
      {String? description, DateTime? dueAt}) async {
    try {
      final response = await _dio.post('/todos', data: {
        'userId': userId,
        'title': title,
        'description': description,
        'dueAt': dueAt?.toIso8601String(),
      });
      return Todo.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to create todo: $e');
    }
  }

  Future<Todo> updateTodo(int id, Map<String, dynamic> data) async {
    try {
      final response = await _dio.patch('/todos/$id', data: data);
      return Todo.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to update todo: $e');
    }
  }

  Future<void> deleteTodo(int id) async {
    try {
      await _dio.delete('/todos/$id');
    } catch (e) {
      throw Exception('Failed to delete todo: $e');
    }
  }
}
