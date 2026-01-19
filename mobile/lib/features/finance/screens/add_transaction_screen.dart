import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../finance_providers.dart';

class AddTransactionScreen extends ConsumerStatefulWidget {
  const AddTransactionScreen({super.key});

  @override
  ConsumerState<AddTransactionScreen> createState() =>
      _AddTransactionScreenState();
}

class _AddTransactionScreenState extends ConsumerState<AddTransactionScreen> {
  final _formKey = GlobalKey<FormState>();
  String _type = 'EXPENSE';
  int? _categoryId;
  final _amountController = TextEditingController();
  final _descController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('新增記帳')),
      body: categoriesAsync.when(
        data: (categories) {
          final filteredCategories =
              categories.where((c) => c['type'] == _type).toList();

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  // Type Toggle
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(
                          value: 'INCOME',
                          label: Text('收入'),
                          icon: Icon(Icons.arrow_downward)),
                      ButtonSegment(
                          value: 'EXPENSE',
                          label: Text('支出'),
                          icon: Icon(Icons.arrow_upward)),
                    ],
                    selected: {_type},
                    onSelectionChanged: (Set<String> newSelection) {
                      setState(() {
                        _type = newSelection.first;
                        _categoryId = null; // Reset category
                      });
                    },
                    style: ButtonStyle(backgroundColor:
                        MaterialStateProperty.resolveWith((states) {
                      if (states.contains(MaterialState.selected)) {
                        return _type == 'INCOME'
                            ? Colors.green.shade100
                            : Colors.red.shade100;
                      }
                      return null;
                    })),
                  ),
                  const SizedBox(height: 20),

                  // Amount
                  TextFormField(
                    controller: _amountController,
                    decoration: const InputDecoration(
                        labelText: '金額', prefixText: '\$'),
                    keyboardType: TextInputType.number,
                    validator: (val) =>
                        (val == null || val.isEmpty) ? '請輸入金額' : null,
                  ),
                  const SizedBox(height: 16),

                  // Category
                  DropdownButtonFormField<int>(
                    decoration: const InputDecoration(labelText: '分類'),
                    value: _categoryId,
                    items: filteredCategories.map<DropdownMenuItem<int>>((c) {
                      return DropdownMenuItem(
                          value: c['id'], child: Text(c['name']));
                    }).toList(),
                    onChanged: (val) => setState(() => _categoryId = val),
                    validator: (val) => val == null ? '請選擇分類' : null,
                  ),
                  const SizedBox(height: 16),

                  // Description
                  TextFormField(
                    controller: _descController,
                    decoration: const InputDecoration(labelText: '備註 (選填)'),
                  ),
                  const SizedBox(height: 32),

                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _submit,
                      child: _isLoading
                          ? const CircularProgressIndicator()
                          : const Text('儲存'),
                    ),
                  )
                ],
              ),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      await ref.read(financeServiceProvider).createTransaction({
        'type': _type,
        'amount': double.parse(_amountController.text),
        'categoryId': _categoryId,
        'description': _descController.text,
        'date': DateTime.now().toIso8601String(),
      });

      if (mounted) {
        ref.invalidate(transactionsProvider);
        ref.invalidate(financeSummaryProvider);
        ref.invalidate(monthlyStatsProvider);
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}
