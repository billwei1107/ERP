import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../inventory_service.dart';
import '../inventory_providers.dart';

class StockTakeDetailScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> stockTake;

  const StockTakeDetailScreen({super.key, required this.stockTake});

  @override
  ConsumerState<StockTakeDetailScreen> createState() =>
      _StockTakeDetailScreenState();
}

class _StockTakeDetailScreenState extends ConsumerState<StockTakeDetailScreen> {
  late List<dynamic> _items;
  bool _isLoading = false;
  String? _locationFilter;

  // Controllers map to persist values and avoid ListView mix-up
  final Map<int, TextEditingController> _controllers = {};

  @override
  void initState() {
    super.initState();
    // Deep Copy items
    _items = (widget.stockTake['items'] as List<dynamic>)
        .map((item) => Map<String, dynamic>.from(item))
        .toList();

    // Initialize controllers
    for (int i = 0; i < _items.length; i++) {
      _controllers[i] = TextEditingController(
          text: (_items[i]['actualStock'] ?? 0).toString());
    }
  }

  @override
  void dispose() {
    for (var controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _saveDraft() async {
    setState(() => _isLoading = true);
    try {
      final inventoryService = ref.read(inventoryServiceProvider);

      // Update _items from controllers before saving
      for (int i = 0; i < _items.length; i++) {
        final val = int.tryParse(_controllers[i]?.text ?? '0') ?? 0;
        _items[i]['actualStock'] = val;
        _items[i]['difference'] = val - (_items[i]['systemStock'] ?? 0);
      }

      await inventoryService.updateStockTakeItems(
          widget.stockTake['id'], _items);

      if (mounted) {
        ref.invalidate(stockTakesProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('暫存已儲存'), backgroundColor: Colors.blue),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('儲存失敗: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _submit() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('確認提交'),
        content: const Text('確定要提交盤點結果嗎？這將會更新系統庫存。'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('取消')),
          ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('提交')),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);

    try {
      final inventoryService = ref.read(inventoryServiceProvider);

      // Update _items from controllers before submitting
      for (int i = 0; i < _items.length; i++) {
        final val = int.tryParse(_controllers[i]?.text ?? '0') ?? 0;
        _items[i]['actualStock'] = val;
      }

      await inventoryService.submitStockTake(widget.stockTake['id'], _items);

      if (mounted) {
        ref.invalidate(stockTakesProvider);
        ref.invalidate(productsProvider); // Stock updated
        Navigator.of(context).pop(); // Exit screen
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('盤點完成，庫存已更新'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('提交失敗: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = widget.stockTake['status'];
    final isReadOnly = status == 'COMPLETED';

    // Unique locations for filter
    final locations = _items
        .map((i) => i['location'] as String?)
        .where((l) => l != null)
        .toSet()
        .toList()
      ..sort();

    // We need to map filtered items back to original indices to use correct controller
    final filteredIndices = _items
        .asMap()
        .entries
        .where((entry) =>
            _locationFilter == null ||
            entry.value['location'] == _locationFilter)
        .map((entry) => entry.key)
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: Text('盤點單 #${widget.stockTake['id']}'),
        actions: [
          if (!isReadOnly) ...[
            IconButton(
              icon: const Icon(Icons.save),
              onPressed: _isLoading ? null : _saveDraft,
              tooltip: '暫存',
            ),
            IconButton(
              icon: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.check),
              onPressed: _isLoading ? null : _submit,
              tooltip: '提交盤點',
            ),
          ]
        ],
      ),
      body: Column(
        children: [
          // Header / Filter
          if (locations.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                    labelText: '篩選儲位',
                    border: OutlineInputBorder(),
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 10, vertical: 0)),
                value: _locationFilter,
                items: [
                  const DropdownMenuItem(value: null, child: Text('全部儲位')),
                  ...locations.map(
                      (l) => DropdownMenuItem(value: l, child: Text(l ?? '-'))),
                ],
                onChanged: (val) => setState(() => _locationFilter = val),
              ),
            ),

          Expanded(
            child: ListView.separated(
              itemCount: filteredIndices.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, idx) {
                final index = filteredIndices[idx]; // Original index
                final item = _items[index];
                final systemStock = item['systemStock'] ?? 0;

                // Live calc difference based on controller text
                final currentText = _controllers[index]?.text ?? '0';
                final actualStock = int.tryParse(currentText) ?? 0;
                final diff = actualStock - (systemStock as num);

                return Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item['sku'] ?? '',
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold)),
                            Text(item['productName'] ?? '',
                                style: const TextStyle(
                                    fontSize: 12, color: Colors.grey)),
                            if (item['location'] != null)
                              Container(
                                margin: const EdgeInsets.only(top: 4),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 4, vertical: 2),
                                color: Colors.grey.shade200,
                                child: Text(item['location'],
                                    style: const TextStyle(fontSize: 10)),
                              )
                          ],
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('系統',
                                style: TextStyle(
                                    fontSize: 10, color: Colors.grey)),
                            Text('$systemStock',
                                style: const TextStyle(fontSize: 16)),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      // Edit Area
                      Expanded(
                        flex: 3,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('實盤',
                                style: TextStyle(
                                    fontSize: 10, color: Colors.blue)),
                            if (isReadOnly)
                              Text('$actualStock',
                                  style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold))
                            else
                              SizedBox(
                                height: 40,
                                child: TextFormField(
                                  controller: _controllers[index],
                                  keyboardType: TextInputType.number,
                                  textAlign: TextAlign.center,
                                  decoration: const InputDecoration(
                                    border: OutlineInputBorder(),
                                    contentPadding: EdgeInsets.zero,
                                  ),
                                  onChanged: (val) {
                                    setState(() {
                                      // Difference updates via setState triggering build
                                    });
                                  },
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 40,
                        child: Column(
                          children: [
                            const Text('差異', style: TextStyle(fontSize: 10)),
                            Text('${diff > 0 ? '+' : ''}$diff',
                                style: TextStyle(
                                    color: diff == 0
                                        ? Colors.grey
                                        : (diff > 0
                                            ? Colors.green
                                            : Colors.red),
                                    fontWeight: FontWeight.bold)),
                          ],
                        ),
                      )
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
