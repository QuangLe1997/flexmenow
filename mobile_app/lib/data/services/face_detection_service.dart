import 'dart:io';

import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';

/// Service for ML Kit face detection.
///
/// Validates uploaded photos have a detectable face with acceptable
/// angle and size before sending to AI generation.
class FaceDetectionService {
  late final FaceDetector _faceDetector;

  FaceDetectionService() {
    _faceDetector = FaceDetector(
      options: FaceDetectorOptions(
        enableClassification: false,
        enableLandmarks: false,
        enableContours: false,
        enableTracking: false,
        performanceMode: FaceDetectorMode.accurate,
      ),
    );
  }

  /// Validates an image file for face detection.
  /// Returns a [FaceValidationResult] with success/failure and message.
  Future<FaceValidationResult> validateFace(
    File imageFile, {
    int expectedFaces = 1,
  }) async {
    final inputImage = InputImage.fromFile(imageFile);
    final faces = await _faceDetector.processImage(inputImage);

    if (faces.isEmpty) {
      return const FaceValidationResult(
        isValid: false,
        message: 'No face detected. Please use a clear photo of your face.',
        faceCount: 0,
      );
    }

    if (expectedFaces == 1 && faces.length > 1) {
      return FaceValidationResult(
        isValid: false,
        message:
            'Multiple faces detected. Please use a photo with only one face.',
        faceCount: faces.length,
      );
    }

    if (expectedFaces == 2 && faces.length < 2) {
      return FaceValidationResult(
        isValid: false,
        message:
            'Need 2 faces for couple mode. Please use a photo with both faces visible.',
        faceCount: faces.length,
      );
    }

    // Check face angle (head rotation)
    final face = faces.first;
    final yAngle = face.headEulerAngleY ?? 0;
    final zAngle = face.headEulerAngleZ ?? 0;

    if (yAngle.abs() > 36) {
      return FaceValidationResult(
        isValid: false,
        message:
            'Face is turned too far. Please face the camera more directly.',
        faceCount: faces.length,
      );
    }

    if (zAngle.abs() > 36) {
      return FaceValidationResult(
        isValid: false,
        message: 'Face is tilted too much. Please hold the camera straight.',
        faceCount: faces.length,
      );
    }

    // Check face size (bounding box should be reasonable portion of image)
    final box = face.boundingBox;
    if (box.width < 50 || box.height < 50) {
      return FaceValidationResult(
        isValid: false,
        message: 'Face is too small. Please use a closer photo.',
        faceCount: faces.length,
      );
    }

    return FaceValidationResult(
      isValid: true,
      message: 'Face detected successfully.',
      faceCount: faces.length,
    );
  }

  /// Releases resources.
  void dispose() {
    _faceDetector.close();
  }
}

/// Result of face validation.
class FaceValidationResult {
  final bool isValid;
  final String message;
  final int faceCount;

  const FaceValidationResult({
    required this.isValid,
    required this.message,
    required this.faceCount,
  });
}
