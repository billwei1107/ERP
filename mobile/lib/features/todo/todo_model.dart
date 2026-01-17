class Todo {
  final int id;
  final int userId;
  final String title;
  final String? description;
  final DateTime? dueAt;
  final bool isCompleted;
  final DateTime createdAt;

  Todo({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    this.dueAt,
    required this.isCompleted,
    required this.createdAt,
  });

  factory Todo.fromJson(Map<String, dynamic> json) {
    return Todo(
      id: json['id'],
      userId: json['userId'],
      title: json['title'],
      description: json['description'],
      dueAt: json['dueAt'] != null ? DateTime.parse(json['dueAt']) : null,
      isCompleted: json['isCompleted'] ?? false,
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'title': title,
      'description': description,
      'dueAt': dueAt?.toIso8601String(),
      'isCompleted': isCompleted,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
