import 'dart:io';
import 'package:flutter/foundation.dart'; // for debugPrint
import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final fileServiceProvider = Provider((ref) => FileService());

class FileService {
  /// Pick a file (Supports .xlsx, .csv)
  Future<File?> pickFile() async {
    // Check permission if needed (Android 13+ handles differently, mostly not needed for picker)
    // Basic implementation
    try {
      final FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['xlsx', 'csv'],
      );

      if (result != null && result.files.single.path != null) {
        return File(result.files.single.path!);
      }
    } catch (e) {
      debugPrint('Pick file error: $e');
    }
    return null;
  }

  /// Save bytes to a file and share it
  Future<void> saveAndShareFile(String fileName, List<int> bytes) async {
    try {
      final directory = await getTemporaryDirectory();
      final file = File('${directory.path}/$fileName');
      await file.writeAsBytes(bytes);

      // Share using share_plus which handles "Saving to Files" or sending via apps
      await Share.shareXFiles([XFile(file.path)],
          text: 'Exported from ERP App');
    } catch (e) {
      debugPrint('Save/Share error: $e');
      rethrow;
    }
  }
}
