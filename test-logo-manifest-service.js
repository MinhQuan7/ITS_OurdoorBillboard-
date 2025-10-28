// test-logo-manifest-service.js - Test GitHub CDN Logo Sync System
console.log("Testing Logo Manifest Service (GitHub CDN Sync)");
console.log("===========================================");

// Test configuration
const testConfig = {
  enabled: true,
  manifestUrl: "file:///f:/EoH%20Company/ITS_OurdoorScreen/logo-manifest.json", // Local test file
  pollInterval: 10, // 10 seconds for testing
  downloadPath: "./downloads",
  maxCacheSize: 50,
  retryAttempts: 3,
  retryDelay: 2000,
};

console.log("Test Configuration:");
console.log(JSON.stringify(testConfig, null, 2));

async function testManifestFetch() {
  console.log("\n1. Testing manifest fetch from local file...");

  try {
    const axios = require("axios");

    console.log(`Fetching from: ${testConfig.manifestUrl}`);

    const response = await axios.get(testConfig.manifestUrl, {
      timeout: 15000,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (response.status === 200) {
      const manifest = response.data;
      console.log("✓ Manifest fetched successfully:");
      console.log(`  Version: ${manifest.version}`);
      console.log(`  Logo count: ${manifest.logos.length}`);
      console.log(
        `  Active logos: ${manifest.logos.filter((l) => l.active).length}`
      );
      console.log(`  Last updated: ${manifest.lastUpdated}`);

      console.log("\n  Logo details:");
      manifest.logos.forEach((logo, index) => {
        console.log(
          `    ${index + 1}. ${logo.name} (${
            logo.active ? "ACTIVE" : "INACTIVE"
          })`
        );
        console.log(`       URL: ${logo.url}`);
        console.log(`       Size: ${(logo.size / 1024).toFixed(1)}KB`);
        console.log(`       Priority: ${logo.priority}`);
      });

      console.log("\n  Settings:");
      console.log(`    Logo Mode: ${manifest.settings.logoMode}`);
      console.log(`    Loop Duration: ${manifest.settings.logoLoopDuration}s`);
      console.log(`    Schedules: ${manifest.settings.schedules.length}`);

      return manifest;
    } else {
      console.error(`✗ HTTP ${response.status} - ${response.statusText}`);
      return null;
    }
  } catch (error) {
    console.error("✗ Failed to fetch manifest:", error.message);
    return null;
  }
}

function testDownloadPaths() {
  console.log("\n2. Testing download path creation...");

  const fs = require("fs");
  const path = require("path");

  const logoDir = path.join(testConfig.downloadPath, "logos");

  try {
    if (!fs.existsSync(logoDir)) {
      fs.mkdirSync(logoDir, { recursive: true });
      console.log(`✓ Created download directory: ${logoDir}`);
    } else {
      console.log(`✓ Download directory exists: ${logoDir}`);
    }

    // Test write permissions
    const testFile = path.join(logoDir, "test-write.tmp");
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    console.log("✓ Write permissions confirmed");

    return true;
  } catch (error) {
    console.error("✗ Directory creation/write test failed:", error.message);
    return false;
  }
}

async function testGitHubURL() {
  console.log("\n3. Testing actual GitHub CDN URL...");

  const githubUrl =
    "https://raw.githubusercontent.com/MinhQuan7/ITS_OurdoorBillboard-/main/logo-manifest.json";

  try {
    const axios = require("axios");

    console.log(`Testing GitHub URL: ${githubUrl}`);

    const response = await axios.get(githubUrl, {
      timeout: 15000,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (response.status === 200) {
      console.log("✓ GitHub CDN accessible");
      console.log(
        `✓ Response size: ${JSON.stringify(response.data).length} bytes`
      );
      return true;
    } else {
      console.log(`⚠ GitHub response: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(
        "⚠ GitHub manifest not found (404) - File needs to be uploaded to GitHub"
      );
    } else {
      console.error("✗ GitHub CDN test failed:", error.message);
    }
    return false;
  }
}

function testEventSystem() {
  console.log("\n4. Testing custom event system...");

  try {
    // Test custom event creation
    const testEvent = new CustomEvent("logo-manifest-updated", {
      detail: {
        manifest: { version: "test" },
        timestamp: Date.now(),
      },
    });

    console.log("✓ Custom event created successfully");

    // Test event listener
    let eventReceived = false;
    const testHandler = (event) => {
      console.log("✓ Event listener triggered:", event.detail);
      eventReceived = true;
    };

    window.addEventListener("logo-manifest-updated", testHandler);
    window.dispatchEvent(testEvent);
    window.removeEventListener("logo-manifest-updated", testHandler);

    if (eventReceived) {
      console.log("✓ Event system working correctly");
      return true;
    } else {
      console.log("✗ Event not received");
      return false;
    }
  } catch (error) {
    console.error("✗ Event system test failed:", error.message);
    return false;
  }
}

function generateGitHubInstructions() {
  console.log("\n5. GitHub Setup Instructions:");
  console.log("=============================");

  console.log("To complete the GitHub CDN setup:");
  console.log("1. Create 'logo-manifest.json' in your GitHub repository root");
  console.log("2. Upload logo images to 'logos/' directory in repository");
  console.log("3. Update manifest URLs to point to raw.githubusercontent.com");
  console.log("4. Commit and push changes");
  console.log("");
  console.log("Example structure:");
  console.log("  /logo-manifest.json");
  console.log("  /logos/");
  console.log("    ├── company-logo.png");
  console.log("    ├── eoh-era-banner.png");
  console.log("    └── promo-banner.jpg");
  console.log("");
  console.log("Example manifest URL format:");
  console.log(
    "  https://raw.githubusercontent.com/MinhQuan7/ITS_OurdoorBillboard-/main/logo-manifest.json"
  );
  console.log("");
  console.log("Example logo URL format:");
  console.log(
    "  https://raw.githubusercontent.com/MinhQuan7/ITS_OurdoorBillboard-/main/logos/company-logo.png"
  );
}

async function runAllTests() {
  console.log("Starting Logo Manifest Service Tests...\n");

  let passedTests = 0;
  let totalTests = 4;

  // Test 1: Manifest fetch
  const manifest = await testManifestFetch();
  if (manifest) passedTests++;

  // Test 2: Download paths
  if (testDownloadPaths()) passedTests++;

  // Test 3: GitHub URL (optional)
  if (await testGitHubURL()) passedTests++;

  // Test 4: Event system
  if (testEventSystem()) passedTests++;

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log("🎉 All tests passed! Logo Manifest Service is ready.");
  } else {
    console.log("⚠️  Some tests failed. Review the issues above.");
  }

  generateGitHubInstructions();

  return { passed: passedTests, total: totalTests, manifest };
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    testConfig,
    testManifestFetch,
    testDownloadPaths,
    testGitHubURL,
    testEventSystem,
    runAllTests,
  };
}

// Run tests if script is executed directly
if (typeof window === "undefined") {
  runAllTests().then((results) => {
    console.log(
      `\nTest completed with ${results.passed}/${results.total} passing tests.`
    );
    process.exit(results.passed === results.total ? 0 : 1);
  });
}
