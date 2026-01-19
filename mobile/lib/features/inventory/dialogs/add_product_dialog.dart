import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../inventory_service.dart';
import '../inventory_providers.dart';

class AddProductDialog extends ConsumerStatefulWidget {
  final Map<String, dynamic>? product; // If provided, we are editing

  const AddProductDialog({super.key, this.product});

  @override
  ConsumerState<AddProductDialog> createState() => _AddProductDialogState();
}

class _AddProductDialogState extends ConsumerState<AddProductDialog> {
  final _formKey = GlobalKey<FormState>();
  final _skuController = TextEditingController();
  final _nameController = TextEditingController();
  final _categoryController = TextEditingController();
  final _unitController = TextEditingController(text: '個');
  final _safetyStockController = TextEditingController(text: '10');

  // Simplified initial location (Only for create)
  final _locationController = TextEditingController();
  final _initialQuantityController = TextEditingController(text: '0');

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.product != null) {
      final p = widget.product!;
      _skuController.text = p['sku'] ?? '';
      _nameController.text = p['name'] ?? '';
      _categoryController.text = p['category'] ?? '';
      _unitController.text = p['unit'] ?? '個';
      _safetyStockController.text = (p['safetyStock'] ?? 10).toString();
    }
  }

  @override
  void dispose() {
    _skuController.dispose();
    _nameController.dispose();
    _categoryController.dispose();
    _unitController.dispose();
    _safetyStockController.dispose();
    _locationController.dispose();
    _initialQuantityController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final inventoryService = ref.read(inventoryServiceProvider);

      final data = {
        'sku': _skuController.text.trim(),
        'name': _nameController.text.trim(),
        'category': _categoryController.text.trim(),
        'unit': _unitController.text.trim(),
        'safetyStock': int.tryParse(_safetyStockController.text) ?? 0,
      };

      if (widget.product != null) {
        // Edit Mode
        await inventoryService.updateProduct(widget.product!['id'], data);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('更新商品成功'), backgroundColor: Colors.green),
          );
        }
      } else {
        // Create Mode
        final locations = <Map<String, dynamic>>[];
        if (_locationController.text.isNotEmpty) {
          locations.add({
            'location': _locationController.text.trim(),
            'quantity': int.tryParse(_initialQuantityController.text) ?? 0,
          });
        }
        data['totalStock'] = 0; // Backend handles this
        data['locations'] = locations; // Only passed on creation

        await inventoryService.createProduct(data);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('新增商品成功'), backgroundColor: Colors.green),
          );
        }
      }

      if (mounted) {
        ref.invalidate(productsProvider);
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('操作失敗: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.product != null;

    return AlertDialog(
      title: Text(isEditing ? '編輯商品' : '新增商品'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _skuController,
                decoration: const InputDecoration(labelText: 'SKU (料號)'),
                validator: (v) => v == null || v.isEmpty ? '請輸入 SKU' : null,
              ),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: '商品名稱'),
                validator: (v) => v == null || v.isEmpty ? '請輸入名稱' : null,
              ),
              TextFormField(
                controller: _categoryController,
                decoration: const InputDecoration(labelText: '分類'),
              ),
              Row(
                children: [
                  Expanded(
                      child: TextFormField(
                    controller: _unitController,
                    decoration: const InputDecoration(labelText: '單位'),
                  )),
                  const SizedBox(width: 16),
                  Expanded(
                      child: TextFormField(
                    controller: _safetyStockController,
                    decoration: const InputDecoration(labelText: '安全庫存'),
                    keyboardType: TextInputType.number,
                  )),
                ],
              ),
              if (!isEditing) ...[
                const SizedBox(height: 16),
                const Text('初始庫存儲位 (選填)',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                Row(
                  children: [
                    Expanded(
                        child: TextFormField(
                      controller: _locationController,
                      decoration:
                          const InputDecoration(labelText: '儲位 (如 A-01)'),
                    )),
                    const SizedBox(width: 16),
                    Expanded(
                        child: TextFormField(
                      controller: _initialQuantityController,
                      decoration: const InputDecoration(labelText: '數量'),
                      keyboardType: TextInputType.number,
                    )),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('取消'),
        ),
        ElevatedButton(
          onPressed: _isLoading ? null : _submit,
          child: _isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2))
              : Text(isEditing ? '更新' : '建立'),
        ),
      ],
    );
  }
}
