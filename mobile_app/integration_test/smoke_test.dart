import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flexme/main.dart' as app;
import 'package:flutter/material.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Smoke test — app launches', (tester) async {
    debugPrint('[SMOKE] Calling app.main()...');
    app.main();
    debugPrint('[SMOKE] main() returned, pumping frames...');

    // Pump 100 frames over 20s
    for (int i = 0; i < 100; i++) {
      await tester.pump(const Duration(milliseconds: 200));
      if (i % 25 == 0) {
        final texts = <String>[];
        for (final el in find.byType(Text).evaluate()) {
          final w = el.widget as Text;
          final s = w.data ?? (w.textSpan?.toPlainText() ?? '');
          if (s.length > 1) texts.add(s);
        }
        debugPrint('[SMOKE] Frame ${i * 200}ms: ${texts.length} texts: ${texts.take(10).join(" | ")}');
      }
    }

    debugPrint('[SMOKE] Done');
  });
}
