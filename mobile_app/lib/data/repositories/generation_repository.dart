import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';

import '../models/generation_model.dart';
import '../../core/constants.dart';

/// Repository for FlexShot generation operations.
///
/// Handles calling the genFlexShot Cloud Function and watching
/// generation document status updates via Firestore onSnapshot.
class GenerationRepository {
  GenerationRepository({
    FirebaseFirestore? firestore,
    FirebaseFunctions? functions,
  })  : _firestore = firestore ?? FirebaseFirestore.instance,
        _functions = functions ??
            FirebaseFunctions.instanceFor(region: AppConstants.firebaseRegion);

  final FirebaseFirestore _firestore;
  final FirebaseFunctions _functions;

  /// Reference to the 'generations' collection.
  CollectionReference<Map<String, dynamic>> get _generationsRef =>
      _firestore.collection(AppConstants.colGenerations);

  /// Call the genFlexShot Cloud Function to start a generation.
  ///
  /// [inputImagePath] is the Firebase Storage path of the uploaded photo.
  /// [templateId] is the ID of the selected template.
  /// [style] is an optional style override.
  ///
  /// Returns a map containing:
  /// - `generationId`: the Firestore document ID for tracking
  /// - `status`: initial status ("pending")
  /// - `creditsSpent`: credits deducted
  /// - `creditsRemaining`: user's remaining credit balance
  Future<Map<String, dynamic>> callGenFlexShot({
    required String inputImagePath,
    required String templateId,
    String? style,
  }) async {
    final callable = _functions.httpsCallable(AppConstants.cfGenFlexShot);

    final params = <String, dynamic>{
      'inputImagePath': inputImagePath,
      'templateId': templateId,
    };
    if (style != null) params['style'] = style;

    final result = await callable.call(params);
    return Map<String, dynamic>.from(result.data as Map);
  }

  /// Watch a single generation document in realtime.
  ///
  /// Returns a [Stream] that emits a [GenerationModel] whenever the
  /// generation document is updated (status changes, progress updates,
  /// completion with output URL, or failure with error message).
  Stream<GenerationModel> watchGeneration(String genId) {
    return _generationsRef.doc(genId).snapshots().map((snapshot) {
      if (!snapshot.exists || snapshot.data() == null) {
        throw Exception('Generation document $genId not found');
      }
      return GenerationModel.fromFirestore(snapshot.data()!, snapshot.id);
    });
  }

  /// List all generations for a user, ordered by creation date descending.
  ///
  /// Returns a realtime [Stream] of generation documents. New generations
  /// appear automatically as they are created.
  Stream<List<GenerationModel>> listGenerations(String userId) {
    return _generationsRef
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => GenerationModel.fromFirestore(doc.data(), doc.id))
            .toList());
  }

  /// List generations for a user with a specific status.
  ///
  /// Useful for showing only completed generations in the gallery,
  /// or only in-progress generations in a status panel.
  Stream<List<GenerationModel>> listGenerationsByStatus(
    String userId,
    String status,
  ) {
    return _generationsRef
        .where('userId', isEqualTo: userId)
        .where('status', isEqualTo: status)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => GenerationModel.fromFirestore(doc.data(), doc.id))
            .toList());
  }

  /// Fetch a single generation document once (non-realtime).
  Future<GenerationModel?> getGeneration(String genId) async {
    final snapshot = await _generationsRef.doc(genId).get();
    if (!snapshot.exists || snapshot.data() == null) return null;
    return GenerationModel.fromFirestore(snapshot.data()!, snapshot.id);
  }

  /// Get the count of completed generations for a user.
  Future<int> getCompletedCount(String userId) async {
    final snapshot = await _generationsRef
        .where('userId', isEqualTo: userId)
        .where('status', isEqualTo: 'completed')
        .count()
        .get();
    return snapshot.count ?? 0;
  }
}
