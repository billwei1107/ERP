import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../inventory_service.dart';
import '../inventory_providers.dart';

class AddMovementScreen extends ConsumerStatefulWidget {
  const AddMovementScreen({super.key});

  @override
  ConsumerState<AddMovementScreen> createState() => _AddMovementScreenState();
}

class _AddMovementScreenState extends ConsumerState<AddMovementScreen> {
  final _formKey = GlobalKey<FormState>();

  String _type = 'IN'; // IN, OUT, TRANSFER
  Map<String, dynamic>? _selectedProduct;
  final _quantityController = TextEditingController(text: '1');
  final _reasonController = TextEditingController();

  // Locations
  String? _fromLocation;
  String _toLocation = ''; // Text input for flexibility

  bool _isLoading = false;

  @override
  void dispose() {
    _quantityController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedProduct == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('請選擇商品')));
      return;
    }

    // Validation Logic
    if (_type == 'IN' && _toLocation.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('請輸入入庫儲位')));
      return;
    }
    if (_type == 'OUT' && _fromLocation == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('請選擇出庫儲位')));
      return;
    }
    if (_type == 'TRANSFER') {
      if (_fromLocation == null) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('請選擇來源儲位')));
        return;
      }
      if (_toLocation.isEmpty) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('請輸入目標儲位')));
        return;
      }
    }

    setState(() => _isLoading = true);

    try {
      final inventoryService = ref.read(inventoryServiceProvider);

      final payload = {
        'productId': _selectedProduct!['id'],
        'type': _type,
        'quantity': int.parse(_quantityController.text),
        'reason': _reasonController.text,
      };

      if (_type == 'IN') {
        payload['toLocation'] = _toLocation;
      } else if (_type == 'OUT') {
        payload['fromLocation'] = _fromLocation;
      } else if (_type == 'TRANSFER') {
        payload['fromLocation'] = _fromLocation;
        payload['toLocation'] = _toLocation;
      }

      await inventoryService.createMovement(payload);

      if (mounted) {
        ref.invalidate(movementsProvider);
        ref.invalidate(productsProvider); // Update stock levels too
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('異動建立成功'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('失敗: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // Get available locations for selected product
  List<dynamic> get _availableLocations {
    if (_selectedProduct == null) return [];
    return _selectedProduct!['locations'] ?? [];
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(productsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('新增庫存異動')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Type Segmented Control
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(
                      value: 'IN',
                      label: Text('入庫'),
                      icon: Icon(Icons.download)),
                  ButtonSegment(
                      value: 'OUT',
                      label: Text('出庫'),
                      icon: Icon(Icons.upload)),
                  ButtonSegment(
                      value: 'TRANSFER',
                      label: Text('調撥'),
                      icon: Icon(Icons.swap_horiz)),
                ],
                selected: {_type},
                onSelectionChanged: (Set<String> newSelection) {
                  setState(() {
                    _type = newSelection.first;
                    // Reset locations when type changes
                    _fromLocation = null;
                    _toLocation = '';
                  });
                },
              ),
              const SizedBox(height: 24),

              // Product Dropdown
              productsAsync.when(
                data: (products) =>
                    DropdownButtonFormField<Map<String, dynamic>>(
                  decoration: const InputDecoration(
                      labelText: '選擇商品', border: OutlineInputBorder()),
                  value: _selectedProduct,
                  items: products.map((p) {
                    return DropdownMenuItem<Map<String, dynamic>>(
                      value: p,
                      child: Text(
                          '${p['sku']} - ${p['name']} (總量: ${p['totalStock']})',
                          overflow: TextOverflow.ellipsis),
                    );
                  }).toList(),
                  onChanged: (val) {
                    setState(() {
                      _selectedProduct = val;
                      _fromLocation =
                          null; // Reset from location as it depends on product
                    });
                  },
                ),
                loading: () => const LinearProgressIndicator(),
                error: (e, s) => Text('無法載入商品: $e'),
              ),
              const SizedBox(height: 16),

              // Dynamic Location Fields
              if (_type == 'OUT' || _type == 'TRANSFER') ...[
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                      labelText: '來源儲位 (From)', border: OutlineInputBorder()),
                  value: _fromLocation,
                  items: _availableLocations.map<DropdownMenuItem<String>>((l) {
                    return DropdownMenuItem(
                      value: l['location'],
                      child: Text('${l['location']} (剩餘: ${l['quantity']})'),
                    );
                  }).toList(),
                  onChanged: (val) => setState(() => _fromLocation = val),
                  validator: (v) => (_type != 'IN' && v == null) ? '必填' : null,
                ),
                const SizedBox(height: 16),
              ],

              if (_type == 'IN' || _type == 'TRANSFER') ...[
                TextFormField(
                  decoration: const InputDecoration(
                      labelText: '目標儲位 (To)',
                      border: OutlineInputBorder(),
                      hintText: '輸入儲位代碼'),
                  onChanged: (val) => _toLocation = val,
                  validator: (v) => (_type != 'OUT' && (v == null || v.isEmpty))
                      ? '必填'
                      : null,
                ),
                const SizedBox(height: 16),
              ],

              // Quantity & Reason
              TextFormField(
                controller: _quantityController,
                decoration: const InputDecoration(
                    labelText: '數量', border: OutlineInputBorder()),
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v == null || v.isEmpty) return '請輸入數量';
                  if (int.tryParse(v) == null || int.parse(v) <= 0)
                    return '數量必須大於 0';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _reasonController,
                decoration: const InputDecoration(
                    labelText: '備註/原因', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 32),

              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: _type == 'OUT'
                      ? Colors.red
                      : (_type == 'TRANSFER' ? Colors.purple : Colors.blue),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(
                        _type == 'IN'
                            ? '確認入庫'
                            : (_type == 'OUT' ? '確認出庫' : '確認調撥'),
                        style:
                            const TextStyle(fontSize: 18, color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
