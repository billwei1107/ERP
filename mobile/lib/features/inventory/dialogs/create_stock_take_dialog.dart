import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../inventory_service.dart';
import '../inventory_providers.dart';

class CreateStockTakeDialog extends ConsumerStatefulWidget {
  const CreateStockTakeDialog({super.key});

  @override
  ConsumerState<CreateStockTakeDialog> createState() =>
      _CreateStockTakeDialogState();
}

class _CreateStockTakeDialogState extends ConsumerState<CreateStockTakeDialog> {
  final _noteController = TextEditingController();
  final List<String> _selectedLocations = [];
  bool _isLoading = false;

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _isLoading = true);

    try {
      final inventoryService = ref.read(inventoryServiceProvider);

      final Map<String, dynamic> payload = {
        'note': _noteController.text,
      };
      if (_selectedLocations.isNotEmpty) {
        payload['targetLocations'] = _selectedLocations;
      }

      await inventoryService.createStockTake(payload);

      if (mounted) {
        ref.invalidate(stockTakesProvider);
        Navigator.of(context).pop();
        // Ideally we would get the ID back and navigate to detail, but API just returns void or object.
        // For simplicity, just close and let user tap on list.
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('盤點單建立成功'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('建立失敗: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productsProvider);

    // Extract unique locations from products
    final uniqueLocations = <String>{};
    productsAsync.whenData((products) {
      for (var p in products) {
        if (p['locations'] != null) {
          for (var l in p['locations']) {
            if (l['location'] != null && l['location'].toString().isNotEmpty) {
              uniqueLocations.add(l['location']);
            }
          }
        }
      }
    });
    final sortedLocations = uniqueLocations.toList()..sort();

    return AlertDialog(
      title: const Text('建立盤點單'),
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _noteController,
              decoration: const InputDecoration(labelText: '盤點備註'),
            ),
            const SizedBox(height: 16),
            const Text('選擇盤點區域 (留空則為全庫存)',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 8),
            Container(
              height: 200,
              decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(4)),
              child: productsAsync.when(
                data: (data) => sortedLocations.isEmpty
                    ? const Center(child: Text('無可用儲位'))
                    : ListView.builder(
                        shrinkWrap: true,
                        itemCount: sortedLocations.length,
                        itemBuilder: (context, index) {
                          final loc = sortedLocations[index];
                          return CheckboxListTile(
                            title: Text(loc),
                            value: _selectedLocations.contains(loc),
                            onChanged: (bool? checked) {
                              setState(() {
                                if (checked == true) {
                                  _selectedLocations.add(loc);
                                } else {
                                  _selectedLocations.remove(loc);
                                }
                              });
                            },
                            dense: true,
                            contentPadding: EdgeInsets.zero,
                            controlAffinity: ListTileControlAffinity.leading,
                          );
                        },
                      ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, s) => Center(child: Text('Error: $e')),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Text(
                _selectedLocations.isEmpty
                    ? '未選擇: 全庫存盤點'
                    : '已選擇 ${_selectedLocations.length} 個區域',
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('取消')),
        ElevatedButton(
          onPressed: _isLoading ? null : _submit,
          child: _isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('建立'),
        ),
      ],
    );
  }
}
