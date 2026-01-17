import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

void showAddTodoDialog({
  required BuildContext context,
  required Future<void> Function(
          String title, String? description, DateTime? dueAt)
      onAdd,
}) {
  final titleController = TextEditingController();
  final descController = TextEditingController();
  DateTime? selectedDate;

  showDialog(
    context: context,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) {
        return AlertDialog(
          title: const Text('新增待辦事項'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                decoration: const InputDecoration(labelText: '標題 (必填)'),
              ),
              TextField(
                controller: descController,
                decoration: const InputDecoration(labelText: '描述 (選填)'),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Text(selectedDate == null
                      ? '未選擇日期'
                      : DateFormat('yyyy-MM-dd HH:mm').format(selectedDate!)),
                  const Spacer(),
                  TextButton(
                    onPressed: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (date != null) {
                        if (!context.mounted) return;
                        final time = await showTimePicker(
                          context: context,
                          initialTime: TimeOfDay.now(),
                        );
                        if (time != null) {
                          setState(() {
                            selectedDate = DateTime(
                              date.year,
                              date.month,
                              date.day,
                              time.hour,
                              time.minute,
                            );
                          });
                        }
                      }
                    },
                    child: const Text('選擇截止時間'),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('取消'),
            ),
            ElevatedButton(
              onPressed: () {
                if (titleController.text.isNotEmpty) {
                  onAdd(
                      titleController.text, descController.text, selectedDate);
                  Navigator.pop(context);
                }
              },
              child: const Text('新增'),
            ),
          ],
        );
      },
    ),
  );
}
