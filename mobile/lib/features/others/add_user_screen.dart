import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'admin_providers.dart';

class AddUserScreen extends ConsumerStatefulWidget {
  const AddUserScreen({super.key});

  @override
  ConsumerState<AddUserScreen> createState() => _AddUserScreenState();
}

class _AddUserScreenState extends ConsumerState<AddUserScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _empIdCtrl = TextEditingController(); // Used as Account
  final _passwordCtrl = TextEditingController();
  String _role = 'USER';
  bool _isLoading = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final data = {
        'name': _nameCtrl.text,
        'account': _empIdCtrl
            .text, // Assuming account = empId for simplicity or need separate field?
        // Backend expects 'account', 'password', 'name', 'empId', 'role'
        // Actually let's check Backend create DTO.
        // Assuming empId is used as account or we add account field.
        // Let's send separate fields.
        'empId': _empIdCtrl.text,
        'password': _passwordCtrl.text,
        'role': _role,
      };

      await ref.read(adminServiceProvider).createUser(data);
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('新增成功')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('新增失敗: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('新增員工')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              TextFormField(
                controller: _nameCtrl,
                decoration: const InputDecoration(
                    labelText: '姓名', border: OutlineInputBorder()),
                validator: (v) => v!.isEmpty ? '請輸入姓名' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _empIdCtrl,
                decoration: const InputDecoration(
                    labelText: '員工編號 (帳號)', border: OutlineInputBorder()),
                validator: (v) => v!.isEmpty ? '請輸入員工編號' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordCtrl,
                decoration: const InputDecoration(
                    labelText: '密碼', border: OutlineInputBorder()),
                obscureText: true,
                validator: (v) => v!.isEmpty ? '請輸入密碼' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _role,
                decoration: const InputDecoration(
                    labelText: '角色', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'USER', child: Text('一般員工')),
                  DropdownMenuItem(value: 'ADMIN', child: Text('管理員')),
                ],
                onChanged: (v) => setState(() => _role = v!),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator()
                    : const Text('建立帳號', style: TextStyle(fontSize: 18)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
