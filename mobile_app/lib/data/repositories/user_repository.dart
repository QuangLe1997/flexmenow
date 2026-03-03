import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/user_model.dart';
import '../../core/constants.dart';

/// Repository for Firestore user document operations.
///
/// Reads and watches the `users/{userId}` document. Client writes are
/// limited to fields allowed by Firestore security rules (see
/// [UserModel.toClientUpdateMap]).
class UserRepository {
  final FirebaseFirestore _firestore;

  UserRepository({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  CollectionReference<Map<String, dynamic>> get _usersRef =>
      _firestore.collection(AppConstants.colUsers);

  /// Watches a user document in realtime via Firestore onSnapshot.
  ///
  /// Returns a stream that emits [UserModel] on each change, or `null`
  /// if the document does not exist.
  Stream<UserModel?> watchUser(String uid) {
    return _usersRef.doc(uid).snapshots().map((snap) {
      if (!snap.exists || snap.data() == null) return null;
      return UserModel.fromFirestore(snap.data()!, snap.id);
    });
  }

  /// Fetches a user document once.
  Future<UserModel?> getUser(String uid) async {
    final snap = await _usersRef.doc(uid).get();
    if (!snap.exists || snap.data() == null) return null;
    return UserModel.fromFirestore(snap.data()!, snap.id);
  }

  /// Updates only client-writable fields.
  Future<void> updateUser(String uid, Map<String, dynamic> data) {
    return _usersRef.doc(uid).update(data);
  }
}
