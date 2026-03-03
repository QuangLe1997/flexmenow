import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/enhancement_model.dart';
import '../../core/constants.dart';

/// Repository for FlexLocket (Glow) enhancement operations.
class EnhancementRepository {
  EnhancementRepository({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _enhancementsRef =>
      _firestore.collection(AppConstants.colEnhancements);

  /// List all enhancements for a user, ordered by creation date descending.
  Stream<List<EnhancementModel>> listEnhancements(String userId) {
    return _enhancementsRef
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => EnhancementModel.fromFirestore(doc.data(), doc.id))
            .toList());
  }

  /// Watch a single enhancement document in realtime.
  Stream<EnhancementModel> watchEnhancement(String enhId) {
    return _enhancementsRef.doc(enhId).snapshots().map((snapshot) {
      if (!snapshot.exists || snapshot.data() == null) {
        throw Exception('Enhancement document $enhId not found');
      }
      return EnhancementModel.fromFirestore(snapshot.data()!, snapshot.id);
    });
  }
}
