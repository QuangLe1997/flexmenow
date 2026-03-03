import 'package:firebase_auth/firebase_auth.dart';

/// Repository for Firebase Authentication operations.
///
/// Wraps [FirebaseAuth] to provide sign-in, sign-out, and auth state changes.
class AuthRepository {
  final FirebaseAuth _auth;

  AuthRepository({FirebaseAuth? auth})
      : _auth = auth ?? FirebaseAuth.instance;

  /// Stream of auth state changes (emits [User] or null).
  Stream<User?> authStateChanges() => _auth.authStateChanges();

  /// The currently signed-in user, or null.
  User? get currentUser => _auth.currentUser;

  /// Sign in with a Google credential.
  Future<UserCredential> signInWithCredential(AuthCredential credential) {
    return _auth.signInWithCredential(credential);
  }

  /// Sign out the current user.
  Future<void> signOut() => _auth.signOut();
}
