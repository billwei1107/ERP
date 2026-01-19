import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'admin_providers.dart';

class AddUserScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic>? user;
  const AddUserScreen({super.key, this.user});

  @override
  ConsumerState<AddUserScreen> createState() => _AddUserScreenState();
}

class _AddUserScreenState extends ConsumerState<AddUserScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _empIdCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  String _role = 'STAFF';
  bool _isLoading = false;
  bool _obscurePassword = true;

  bool get _isEditMode => widget.user != null;

  @override
  void initState() {
    super.initState();
    if (_isEditMode) {
      _nameCtrl.text = widget.user!['name'] ?? '';
      _emailCtrl.text = widget.user!['email'] ?? '';
      _empIdCtrl.text = widget.user!['empId'] ?? '';
      _role = widget.user!['role'] ?? 'STAFF';
      // Do not pre-fill password for security/UX
    } else {
      _passwordCtrl.text = 'user123';
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      // Auto-generate email logic if empty
      String? finalEmail = _emailCtrl.text.trim();
      if (finalEmail.isEmpty) {
        final sanitizedName =
            _nameCtrl.text.trim().replaceAll(RegExp(r'\s+'), '').toLowerCase();
        finalEmail = '$sanitizedName@erp.com';
      }

      final data = {
        'name': _nameCtrl.text,
        'email': finalEmail,
        'empId': _empIdCtrl.text.isNotEmpty ? _empIdCtrl.text : null,
        'role': _role,
        'status': widget.user?['status'] ?? 'ONLINE',
      };

      // Only include password if provided (for Edit) or always for Create
      if (_passwordCtrl.text.isNotEmpty) {
        data['password'] = _passwordCtrl.text;
      }

      if (_isEditMode) {
        await ref
            .read(adminServiceProvider)
            .updateUser(widget.user!['id'], data);
      } else {
        await ref.read(adminServiceProvider).createUser(data);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(_isEditMode ? '修改成功' : '新增成功')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(_isEditMode ? '修改失敗: $e' : '新增失敗: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditMode ? '編輯員工' : '新增員工')),
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
                controller: _emailCtrl,
                decoration: const InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(),
                    hintText: '留空則自動產生: 姓名@erp.com'),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _empIdCtrl,
                decoration: const InputDecoration(
                    labelText: '員工編號 (選填)',
                    border: OutlineInputBorder(),
                    hintText: '留空則自動產生'),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _role,
                decoration: const InputDecoration(
                    labelText: '權限角色', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'STAFF', child: Text('STAFF')),
                  DropdownMenuItem(value: 'MANAGER', child: Text('MANAGER')),
                  DropdownMenuItem(value: 'ADMIN', child: Text('ADMIN')),
                ],
                onChanged: (v) => setState(() => _role = v!),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordCtrl,
                decoration: InputDecoration(
                    labelText: _isEditMode ? '密碼 (留空則不修改)' : '密碼',
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(_obscurePassword
                          ? Icons.visibility
                          : Icons.visibility_off),
                      onPressed: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
                    )),
                obscureText: _obscurePassword,
                validator: (v) {
                  if (!_isEditMode && (v == null || v.isEmpty)) return '請輸入密碼';
                  return null;
                },
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.blue.shade700,
                  foregroundColor: Colors.white,
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(_isEditMode ? '儲存變更' : '建立用戶',
                        style: const TextStyle(fontSize: 18)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
