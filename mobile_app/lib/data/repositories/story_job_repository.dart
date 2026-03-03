import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/story_model.dart';
import '../../core/constants.dart';

/// Repository for Firestore story generation document operations.
///
/// Reads and watches `stories/{storyId}` documents for realtime
/// progress tracking of FlexTale story generation jobs.
class StoryJobRepository {
  final FirebaseFirestore _firestore;

  StoryJobRepository({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  CollectionReference<Map<String, dynamic>> get _storiesRef =>
      _firestore.collection(AppConstants.colStories);

  /// Watches a single story generation document in realtime.
  ///
  /// Returns a stream that emits [StoryGenerationModel] on each update,
  /// or `null` if the document does not exist.
  Stream<StoryGenerationModel?> watchStoryGeneration(String storyDocId) {
    return _storiesRef.doc(storyDocId).snapshots().map((snap) {
      if (!snap.exists || snap.data() == null) return null;
      return StoryGenerationModel.fromFirestore(snap.data()!, snap.id);
    });
  }

  /// Fetches a single story generation document once.
  Future<StoryGenerationModel?> getStoryGeneration(String storyDocId) async {
    final snap = await _storiesRef.doc(storyDocId).get();
    if (!snap.exists || snap.data() == null) return null;
    return StoryGenerationModel.fromFirestore(snap.data()!, snap.id);
  }

  /// Watches all scenes for a story generation, ordered by sceneOrder.
  Stream<List<SceneModel>> watchScenes(String storyDocId) {
    return _storiesRef
        .doc(storyDocId)
        .collection(AppConstants.colScenes)
        .orderBy('sceneOrder')
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => SceneModel.fromFirestore(doc.data(), doc.id))
            .toList());
  }

  /// Lists all story generations for a user, ordered by creation time descending.
  Stream<List<StoryGenerationModel>> watchUserStories(String userId) {
    return _storiesRef
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) =>
                StoryGenerationModel.fromFirestore(doc.data(), doc.id))
            .toList());
  }
}
