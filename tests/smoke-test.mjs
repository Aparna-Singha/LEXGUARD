const BASE_URL = process.env.LEXGUARD_BASE_URL || "http://localhost:3000";

function logPass(name) {
  console.log(`✅ ${name}`);
}

function assertCondition(name, condition, details = "") {
  if (!condition) {
    throw new Error(`❌ ${name}${details ? `: ${details}` : ""}`);
  }
  logPass(name);
}

async function readJsonResponse(name, response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${name} did not return valid JSON. Response: ${text.slice(0, 300)}`);
  }
}

async function testHealthEndpoint() {
  const response = await fetch(`${BASE_URL}/api/health`);

  assertCondition("GET /api/health returns 2xx", response.ok, `status ${response.status}`);

  const data = await readJsonResponse("GET /api/health", response);

  assertCondition("Health response has ok=true", data.ok === true);
  assertCondition("Health response includes service name", typeof data.service === "string");
}

async function testSampleAnalysis() {
  const formData = new FormData();
  formData.append("sampleId", "employment_offer_high_risk");
  formData.append("documentType", "Employment Contract");

  const response = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  assertCondition("POST /api/analyze sample returns 2xx", response.ok, `status ${response.status}`);

  const data = await readJsonResponse("POST /api/analyze", response);

  assertCondition("Analyze response success=true", data.success === true);
  assertCondition("Analyze response has reportId", typeof data.reportId === "string" && data.reportId.length > 0);
  assertCondition("Analyze response has report object", data.report && typeof data.report === "object");
  assertCondition(
    "Report has numeric overallRiskScore",
    typeof data.report.overallRiskScore === "number"
  );
  assertCondition(
    "Report has overallRiskLevel",
    typeof data.report.overallRiskLevel === "string"
  );
  assertCondition(
    "Report has clauses array",
    Array.isArray(data.report.clauses)
  );
  assertCondition(
    "Report has disclaimer",
    typeof data.report.disclaimer === "string" &&
      data.report.disclaimer.toLowerCase().includes("not legal advice")
  );

  return data.reportId;
}

async function testFollowUpChat(reportId) {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reportId,
      question: "What is the most dangerous clause?",
    }),
  });

  assertCondition("POST /api/chat returns 2xx", response.ok, `status ${response.status}`);

  const data = await readJsonResponse("POST /api/chat", response);

  assertCondition("Chat response has answer", typeof data.answer === "string" && data.answer.length > 0);
  assertCondition("Chat response has disclaimer", typeof data.disclaimer === "string");
}

async function main() {
  console.log(`Running LEXGUARD smoke tests against: ${BASE_URL}`);
  console.log("Make sure the app is running first with: npm run dev\n");

  await testHealthEndpoint();
  const reportId = await testSampleAnalysis();
  await testFollowUpChat(reportId);

  console.log("\n🎉 All LEXGUARD smoke tests passed.");
}

main().catch((error) => {
  console.error("\nSmoke tests failed.");
  console.error(error.message);
  process.exit(1);
});