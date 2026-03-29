import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can trigger test
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const testResults = [];

    // SCENARIO 1: Add-on activated 50 hours ago (OVER 48 hours - SHOULD BE BILLED)
    const now = new Date();
    const activatedOver48HoursAgo = new Date(now.getTime() - (50 * 60 * 60 * 1000));
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const HOURS_48_MS = 48 * 60 * 60 * 1000;
    const hoursSinceScenario1 = periodStart - activatedOver48HoursAgo;
    const scenario1Billable = hoursSinceScenario1 >= HOURS_48_MS;

    testResults.push({
      scenario: 'Add-on Activated 50 Hours Ago',
      activatedAt: activatedOver48HoursAgo.toISOString(),
      periodStart: periodStart.toISOString(),
      hoursSinceActivation: Math.round(hoursSinceScenario1 / (60 * 60 * 1000)),
      required48HoursInMs: HOURS_48_MS,
      hoursSinceInMs: hoursSinceScenario1,
      shouldBill: scenario1Billable,
      result: scenario1Billable ? '✅ BILLABLE (50h >= 48h)' : '❌ NOT BILLABLE (50h < 48h)'
    });

    // SCENARIO 2: Add-on activated 24 hours ago (UNDER 48 hours - SHOULD NOT BE BILLED)
    const activatedUnder48HoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const hoursSinceScenario2 = periodStart - activatedUnder48HoursAgo;
    const scenario2Billable = hoursSinceScenario2 >= HOURS_48_MS;

    testResults.push({
      scenario: 'Add-on Activated 24 Hours Ago',
      activatedAt: activatedUnder48HoursAgo.toISOString(),
      periodStart: periodStart.toISOString(),
      hoursSinceActivation: Math.round(hoursSinceScenario2 / (60 * 60 * 1000)),
      required48HoursInMs: HOURS_48_MS,
      hoursSinceInMs: hoursSinceScenario2,
      shouldBill: scenario2Billable,
      result: scenario2Billable ? '✅ BILLABLE (24h >= 48h)' : '❌ NOT BILLABLE (24h < 48h)'
    });

    // SCENARIO 3: Add-on activated exactly 48 hours ago (EDGE CASE - SHOULD BE BILLED)
    const activatedExactly48HoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
    const hoursSinceScenario3 = periodStart - activatedExactly48HoursAgo;
    const scenario3Billable = hoursSinceScenario3 >= HOURS_48_MS;

    testResults.push({
      scenario: 'Add-on Activated Exactly 48 Hours Ago',
      activatedAt: activatedExactly48HoursAgo.toISOString(),
      periodStart: periodStart.toISOString(),
      hoursSinceActivation: Math.round(hoursSinceScenario3 / (60 * 60 * 1000)),
      required48HoursInMs: HOURS_48_MS,
      hoursSinceInMs: hoursSinceScenario3,
      shouldBill: scenario3Billable,
      result: scenario3Billable ? '✅ BILLABLE (48h >= 48h)' : '❌ NOT BILLABLE (48h < 48h)'
    });

    return Response.json({
      success: true,
      message: 'Invoice generation logic test completed',
      testDate: now.toISOString(),
      periodMonth: `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`,
      tests: testResults
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});