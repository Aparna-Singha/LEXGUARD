const BASE_URL = process.env.LEXGUARD_BASE_URL || "http://localhost:3000";

async function assertOk(name, condition, details = "") {
  if (!condition) {
    throw new Error(`❌ ${name} failed${details ? `: ${details}` : ""}`);
  }
  console.log(`✅ ${name}`);
}

async function testHealth() {
  const res = await fetch(`${BASE_URL}/api/health`);
  await assertOk("Health endpoint status", res.ok, `status ${res.status}`);

  const data = await res.json();
  await assertOk("Health endpoint response", data.ok === true);
}

async function testSampleAnalyze() {
  const formData = new FormData();
  formData.append("sampleId", "employment_offer_high_risk");
  formData.append("documentType", "Employment Contract");

  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  await assertOk("Sample analyze status", res.ok, `status ${res.status}`);

  const data = await res.json();

  await assertOk("Analyze success flag", data.success === true);
  await assertOk("Analyze returns reportId", Boolean(data.reportId));
  await assertOk("Analyze returns report", Boolean(data.report));
  await assertOk(
    "Report has risk score",
    typeof data.report.overallRiskScore === "number"
  );
  await assertOk(
    "Report has clauses",
    Array.isArray(data.report.clauses)
  );

  return data.reportId;
}

async function testFollowUpChat(reportId) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reportId,
      question: "What is the most dangerous clause?",
    }),
  });

  await assertOk("Follow-up chat status", res.ok, `status ${res.status}`);

  const data = await res.json();

  await assertOk("Chat returns answer", Boolean(data.answer));
  await assertOk("Chat returns disclaimer", Boolean(data.disclaimer));
}

async function main() {
  console.log(`Running LEXGUARD smoke tests against ${BASE_URL}`);
  console.log("Make sure the dev server is running with: npm run dev\n");

  await testHealth();
  const reportId = await testSampleAnalyze();
  await testFollowUpChat(reportId);

  console.log("\n🎉 All smoke tests passed.");
}

main().catch((error) => {
  console.error("\nSmoke test failed:");
  console.error(error.message);
  process.exit(1);
});