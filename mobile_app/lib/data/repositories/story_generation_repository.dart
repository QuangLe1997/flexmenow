import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';

import '../models/story_model.dart';
import '../../core/constants.dart';

/// Repository for FlexTale story generation operations.
///
/// Handles calling the genFlexTale Cloud Function and watching
/// story generation documents and their scene subcollections
/// via Firestore onSnapshot.
class StoryGenerationRepository {
  StoryGenerationRepository({
    FirebaseFirestore? firestore,
    FirebaseFunctions? functions,
  })  : _firestore = firestore ?? FirebaseFirestore.instance,
        _functions = functions ??
            FirebaseFunctions.instanceFor(region: AppConstants.firebaseRegion);

  final FirebaseFirestore _firestore;
  final FirebaseFunctions _functions;

  /// Reference to the 'stories' collection.
  CollectionReference<Map<String, dynamic>> get _storiesRef =>
      _firestore.collection(AppConstants.colStories);

  /// Reference to the 'scenes' subcollection within a story document.
  CollectionReference<Map<String, dynamic>> _scenesRef(String storyDocId) =>
      _storiesRef.doc(storyDocId).collection(AppConstants.colScenes);

  /// Call the genFlexTale Cloud Function to start a story generation.
  ///
  /// [inputImagePath] is the Firebase Storage path of the uploaded photo.
  /// [storyId] is the story pack ID from the JSON data catalog.
  /// [selectedChapters] is an optional list of chapter indices to generate
  /// (if null, all chapters are generated).
  ///
  /// Returns a map containing:
  /// - `storyId`: the Firestore document ID for tracking
  /// - `status`: initial status ("pending")
  /// - `totalScenes`: number of scenes to generate
  /// - `creditsSpent`: credits deducted
  /// - `creditsRemaining`: user's remaining credit balance
  Future<Map<String, dynamic>> callGenFlexTale({
    required String inputImagePath,
    required String storyId,
    List<int>? selectedChapters,
  }) async {
    final callable = _functions.httpsCallable(AppConstants.cfGenFlexTale);

    final params = <String, dynamic>{
      'inputImagePath': inputImagePath,
      'storyId': storyId,
    };
    if (selectedChapters != null) {
      params['selectedChapters'] = selectedChapters;
    }

    final result = await callable.call(params);
    return Map<String, dynamic>.from(result.data as Map);
  }

  /// Watch a story generation document in realtime.
  ///
  /// Returns a [Stream] that emits a [StoryGenerationModel] whenever the
  /// story document is updated (status changes, scene completion count,
  /// final completion, or failure).
  Stream<StoryGenerationModel> watchStory(String storyDocId) {
    return _storiesRef.doc(storyDocId).snapshots().map((snapshot) {
      if (!snapshot.exists || snapshot.data() == null) {
        throw Exception('Story document $storyDocId not found');
      }
      return StoryGenerationModel.fromFirestore(
          snapshot.data()!, snapshot.id);
    });
  }

  /// Watch all scenes within a story generation document in realtime.
  ///
  /// Returns a [Stream] of [SceneModel] list, ordered by scene order.
  /// Each scene updates individually as the Cloud Function completes
  /// that scene's image generation.
  Stream<List<SceneModel>> watchScenes(String storyDocId) {
    return _scenesRef(storyDocId)
        .orderBy('sceneOrder', descending: false)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => SceneModel.fromFirestore(doc.data(), doc.id))
            .toList());
  }

  /// List all story generation documents for a user, ordered by creation
  /// date descending.
  ///
  /// Returns a realtime [Stream]. New story generations appear
  /// automatically as they are created.
  Stream<List<StoryGenerationModel>> listStories(String userId) {
    return _storiesRef
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) =>
                StoryGenerationModel.fromFirestore(doc.data(), doc.id))
            .toList());
  }

  /// List story generations for a user with a specific status.
  Stream<List<StoryGenerationModel>> listStoriesByStatus(
    String userId,
    String status,
  ) {
    return _storiesRef
        .where('userId', isEqualTo: userId)
        .where('status', isEqualTo: status)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) =>
                StoryGenerationModel.fromFirestore(doc.data(), doc.id))
            .toList());
  }

  /// Fetch a single story generation document once (non-realtime).
  Future<StoryGenerationModel?> getStory(String storyDocId) async {
    final snapshot = await _storiesRef.doc(storyDocId).get();
    if (!snapshot.exists || snapshot.data() == null) return null;
    return StoryGenerationModel.fromFirestore(
        snapshot.data()!, snapshot.id);
  }

  /// Fetch all scenes for a story once (non-realtime).
  Future<List<SceneModel>> getScenes(String storyDocId) async {
    final snapshot = await _scenesRef(storyDocId)
        .orderBy('sceneOrder', descending: false)
        .get();
    return snapshot.docs
        .map((doc) => SceneModel.fromFirestore(doc.data(), doc.id))
        .toList();
  }

  /// Get the count of completed story generations for a user.
  Future<int> getCompletedCount(String userId) async {
    final snapshot = await _storiesRef
        .where('userId', isEqualTo: userId)
        .where('status', isEqualTo: 'completed')
        .count()
        .get();
    return snapshot.count ?? 0;
  }
}
