import 'dart:io';

import 'package:firebase_storage/firebase_storage.dart';

import '../../core/constants.dart';

/// Service for uploading and downloading files from Firebase Storage.
///
/// Uploads go to 'uploads/{userId}/{filename}'. The returned storage path
/// (not download URL) is passed to Cloud Functions, which access the file
/// directly via the Admin SDK. Download URLs are generated only for
/// displaying images in the app.
class StorageService {
  StorageService({FirebaseStorage? storage})
      : _storage = storage ?? FirebaseStorage.instance;

  final FirebaseStorage _storage;

  /// Upload an image file to Firebase Storage.
  ///
  /// Returns the storage path (e.g. 'uploads/abc123/photo_1234567890.jpg').
  /// Cloud Functions use this path to access the file via Admin SDK.
  ///
  /// [userId] is the authenticated user's UID.
  /// [file] is the local image file to upload.
  /// [filename] is the desired filename. If null, the file's basename is used.
  ///
  /// Optional [onProgress] callback receives upload progress as a fraction
  /// (0.0 to 1.0).
  Future<String> uploadImage({
    required String userId,
    required File file,
    String? filename,
    void Function(double progress)? onProgress,
  }) async {
    final name = filename ?? _generateFilename(file.path);
    final storagePath = '${AppConstants.storageUploads}/$userId/$name';
    final ref = _storage.ref(storagePath);

    final uploadTask = ref.putFile(
      file,
      SettableMetadata(
        contentType: _getContentType(file.path),
        customMetadata: {
          'uploadedBy': userId,
          'uploadedAt': DateTime.now().toIso8601String(),
        },
      ),
    );

    // Report progress if callback provided.
    if (onProgress != null) {
      uploadTask.snapshotEvents.listen((snapshot) {
        final progress = snapshot.bytesTransferred / snapshot.totalBytes;
        onProgress(progress);
      });
    }

    await uploadTask;
    return storagePath;
  }

  /// Get the download URL for a storage path.
  ///
  /// Used to display images in the app via cached_network_image.
  /// [storagePath] is the full path (e.g. 'uploads/abc123/photo.jpg'
  /// or 'generated/abc123/gen_xxx.jpg').
  Future<String> getDownloadUrl(String storagePath) async {
    final ref = _storage.ref(storagePath);
    return ref.getDownloadURL();
  }

  /// Delete a file from Firebase Storage.
  ///
  /// Used for cleanup (e.g. when a user deletes a generation).
  Future<void> deleteFile(String storagePath) async {
    final ref = _storage.ref(storagePath);
    await ref.delete();
  }

  /// Check if a file exists at the given storage path.
  Future<bool> fileExists(String storagePath) async {
    try {
      final ref = _storage.ref(storagePath);
      await ref.getMetadata();
      return true;
    } on FirebaseException catch (e) {
      if (e.code == 'object-not-found') return false;
      rethrow;
    }
  }

  /// Get metadata for a file at the given storage path.
  Future<FullMetadata> getMetadata(String storagePath) async {
    final ref = _storage.ref(storagePath);
    return ref.getMetadata();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /// Generate a unique filename with timestamp.
  String _generateFilename(String filePath) {
    final extension = filePath.split('.').last.toLowerCase();
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    return 'photo_$timestamp.$extension';
  }

  /// Determine the MIME content type from the file extension.
  String _getContentType(String filePath) {
    final extension = filePath.split('.').last.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'heic':
        return 'image/heic';
      case 'gif':
        return 'image/gif';
      default:
        return 'application/octet-stream';
    }
  }
}
