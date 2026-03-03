// Full user-flow integration test — walks through the app like a real user.
// Run: flutter test integration_test/full_user_flow_test.dart -d emulator-5554

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'package:flexme/main.dart' as app;

void log(String msg) => debugPrint('[TEST] $msg');
final findings = <String>[];
void finding(String sev, String screen, String detail) {
  findings.add('[$sev] $screen: $detail');
  debugPrint('[FINDING] [$sev] $screen: $detail');
}
bool hasText(String t) => find.textContaining(t).evaluate().isNotEmpty;
bool has(Finder f) => f.evaluate().isNotEmpty;

Future<void> pump(WidgetTester t, int count) async {
  for (int i = 0; i < count; i++) {
    await t.pump(const Duration(milliseconds: 200));
  }
}

void dumpTexts(String label) {
  log('--- $label ---');
  int n = 0;
  for (final el in find.byType(Text).evaluate()) {
    if (n >= 15) break;
    final w = el.widget as Text;
    final s = w.data ?? (w.textSpan?.toPlainText() ?? '');
    if (s.length > 1) { log('  "$s"'); n++; }
  }
  if (n == 0) log('  (no text)');
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Full user flow', (tester) async {
    // LAUNCH: use runAsync for real I/O (Firebase init), then pumpWidget
    log('=== LAUNCH ===');
    final appWidget = await tester.runAsync(() => app.initApp());
    log('App initialized via runAsync');

    await tester.pumpWidget(appWidget!);
    await pump(tester, 50); // 10s for splash + auto-nav
    dumpTexts('After launch');

    // HANDLE ONBOARDING (if not logged in)
    if (hasText('Skip') && (hasText('FlexLocket') || hasText('FlexShot'))) {
      log('On Tour — skipping');
      await tester.tap(find.textContaining('Skip').first);
      await pump(tester, 15);
    }
    if (hasText("What's your") || hasText('YOUR VIBE')) {
      log('On Personalize — skipping');
      await tester.tap(find.textContaining('Skip').first);
      await pump(tester, 15);
    }
    if (hasText('Continue with')) {
      log('On Login');
      if (hasText('Continue with Apple')) log('Apple btn: PRESENT');
      else finding('BUG', 'Login', 'Apple button missing');
      if (hasText('Continue with Google')) log('Google btn: PRESENT');
      else finding('BUG', 'Login', 'Google button missing');

      // Login — use runAsync for real Firebase auth
      final anonBtn = find.textContaining('Continue without');
      if (has(anonBtn)) {
        await tester.tap(anonBtn.first);
        // Firebase auth is real I/O, need to pump and let it complete
        await pump(tester, 50); // 10s
      }
    }

    // MAIN APP
    log('=== MAIN APP ===');
    await pump(tester, 25); // 5s extra for data loading
    dumpTexts('Main app');

    // --- CREATE TAB ---
    log('=== CREATE TAB ===');
    if (hasText('SHOT')) log('Nav SHOT: OK');
    if (hasText('LOCKET')) log('Nav LOCKET: OK');
    if (hasText('TALE')) log('Nav TALE: OK');
    if (hasText('ME')) log('Nav ME: OK');

    if (hasText('Shot')) log('FlexShot header: OK');
    if (hasText('For')) log('Filter For: OK');
    if (hasText('Vibe')) log('Filter Vibe: OK');

    final allCount = find.text('All').evaluate().length;
    log('"All" chip count: $allCount');
    if (allCount > 3) finding('BUG', 'CreateTab', 'Duplicate "All": $allCount');
    else if (allCount >= 1) log('BUG-1 FIX CONFIRMED');

    if (hasText('SPOTLIGHT')) log('Spotlight: OK');

    // Bell
    if (has(find.byIcon(LucideIcons.bell))) {
      await tester.tap(find.byIcon(LucideIcons.bell).first);
      await pump(tester, 10);
      if (hasText('coming soon')) finding('TODO', 'CreateTab', 'Notifications TODO');
      await pump(tester, 15);
    }

    // Scroll
    if (has(find.byType(CustomScrollView))) {
      await tester.drag(find.byType(CustomScrollView).first, const Offset(0, -400));
      await pump(tester, 5);
      if (hasText('TRENDING')) log('Trending: OK');
      if (hasText('ALL TEMPLATES')) log('All Templates: OK');
      await tester.drag(find.byType(CustomScrollView).first, const Offset(0, -400));
      await pump(tester, 5);
      if (hasText('PREMIUM')) log('Premium Collection: OK');
      // Scroll back
      await tester.drag(find.byType(CustomScrollView).first, const Offset(0, 800));
      await pump(tester, 5);
    }

    // --- STORY TAB ---
    log('=== STORY TAB ===');
    if (has(find.text('TALE'))) {
      await tester.tap(find.text('TALE').first);
      await pump(tester, 25);

      if (hasText('Tale')) log('FlexTale header: OK');
      if (hasText('Interactive Stories')) log('Banner: OK');

      final storyAll = find.text('All').evaluate().length;
      log('Story "All" count: $storyAll');
      if (storyAll > 3) finding('BUG', 'StoryTab', 'Duplicate "All": $storyAll');
      else if (storyAll >= 1) log('BUG-1 FIX in Story');

      if (hasText('MAKE ME WOW')) log('WOW card: OK');
      if (hasText('Subscribe Now')) log('Subscribe btn: OK');

      // Scroll stories
      if (has(find.byType(CustomScrollView))) {
        await tester.drag(find.byType(CustomScrollView).first, const Offset(0, -500));
        await pump(tester, 5);
        if (hasText('STORIES')) log('Stories section: OK');
        await tester.drag(find.byType(CustomScrollView).first, const Offset(0, 500));
        await pump(tester, 5);
      }

      // WOW intro
      if (hasText('Subscribe Now')) {
        await tester.tap(find.textContaining('Subscribe Now').first);
        await pump(tester, 20);
        dumpTexts('WOW Intro');
        if (hasText('daily') || hasText('delivered') || hasText('WOW')) log('WOW intro: OK');
        if (has(find.byIcon(LucideIcons.arrowLeft))) {
          await tester.tap(find.byIcon(LucideIcons.arrowLeft).first);
          await pump(tester, 15);
        } else if (has(find.byIcon(LucideIcons.x))) {
          await tester.tap(find.byIcon(LucideIcons.x).first);
          await pump(tester, 15);
        }
      }
    }

    // --- GLOW TAB ---
    log('=== GLOW TAB ===');
    if (has(find.text('LOCKET'))) {
      await tester.tap(find.text('LOCKET').first);
      await pump(tester, 20);

      if (hasText('Locket')) log('FlexLocket header: OK');
      if (hasText('Take Photo')) {
        log('Take Photo: OK');
        finding('DESIGN', 'GlowTab', 'Card UI (MISMATCH-1, deferred)');
      }
      if (hasText('Choose Photo')) log('Choose Photo: OK');
    }

    // --- ME TAB ---
    log('=== ME TAB ===');
    if (has(find.text('ME'))) {
      await tester.tap(find.text('ME').first);
      await pump(tester, 25);
      dumpTexts('Me Tab');

      if (hasText('PROFILE')) log('Profile header: OK');
      if (hasText('Edit Profile')) {
        log('Edit Profile btn: OK');
        await tester.tap(find.textContaining('Edit Profile').first);
        await pump(tester, 10);
        if (hasText('coming soon')) finding('TODO', 'MeTab', 'Edit Profile TODO');
        await pump(tester, 15);
      }

      if (hasText('Shots')) log('Stat Shots: OK');
      if (hasText('Tales')) log('Stat Tales: OK');
      if (hasText('Credits')) log('Stat Credits: OK');

      // BUG-2: spinner
      if (has(find.byType(CircularProgressIndicator))) {
        await pump(tester, 25);
        if (has(find.byType(CircularProgressIndicator))) {
          finding('BUG', 'MeTab', 'Infinite spinner (BUG-2)');
        }
      }
      if (hasText('will appear here')) log('BUG-2 FIX: empty state shown');

      // Tabs
      if (has(find.text('Shots'))) {
        final tabs = find.text('Shots');
        await tester.tap(tabs.at(tabs.evaluate().length > 1 ? 1 : 0));
        await pump(tester, 15);
        if (hasText('FlexShot creations')) log('Shots empty: OK');
      }
      if (has(find.text('Tales'))) {
        final tabs = find.text('Tales');
        await tester.tap(tabs.at(tabs.evaluate().length > 1 ? 1 : 0));
        await pump(tester, 15);
        if (hasText('FlexTale stories')) log('Tales empty: OK');
      }

      // Bell
      if (has(find.byIcon(LucideIcons.bell))) {
        await tester.tap(find.byIcon(LucideIcons.bell).first);
        await pump(tester, 10);
        if (hasText('coming soon')) finding('TODO', 'MeTab', 'Notifications TODO');
        await pump(tester, 15);
      }

      // Settings
      if (has(find.byIcon(LucideIcons.settings))) {
        await tester.tap(find.byIcon(LucideIcons.settings).first);
        await pump(tester, 10);
        if (hasText('coming soon')) finding('TODO', 'MeTab', 'Settings TODO');
        await pump(tester, 15);
      }

      // Upgrade card
      if (has(find.byType(CustomScrollView))) {
        await tester.drag(find.byType(CustomScrollView).first, const Offset(0, -300));
        await pump(tester, 5);
        if (hasText('Upgrade') || hasText('Pro')) log('Upgrade card: OK');
      }
    }

    // REPORT
    log('');
    log('==========================================');
    log('       TEST FINDINGS SUMMARY');
    log('==========================================');
    log('Total: ${findings.length}');
    for (final f in findings) log('  $f');
    log('==========================================');
  });
}
