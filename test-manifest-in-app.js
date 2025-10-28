// test-manifest-in-app.js - Direct test in running app
console.log("🔍 Testing Logo Manifest Service in running app");

// Check if LogoManifestService is running
function checkServiceStatus() {
  console.log("=== Logo Manifest Service Status Check ===");
  
  // Check if global service exists
  if (typeof globalLogoManifestService !== 'undefined' && globalLogoManifestService) {
    console.log("✅ Global LogoManifestService instance found");
    console.log("   - Is initialized:", globalLogoManifestService.isInitialized);
    console.log("   - Last fetch time:", globalLogoManifestService.lastFetchTime || "Never");
    console.log("   - Retry count:", globalLogoManifestService.retryCount || 0);
    console.log("   - Has manifest cache:", !!globalLogoManifestService.manifestCache);
    console.log("   - Poll interval active:", !!globalLogoManifestService.pollInterval);
    
    if (globalLogoManifestService.manifestCache) {
      console.log("   - Cached manifest version:", globalLogoManifestService.manifestCache.version);
      console.log("   - Cached logos count:", globalLogoManifestService.manifestCache.logos?.length || 0);
    }
  } else {
    console.log("❌ Global LogoManifestService instance NOT FOUND");
    console.log("   This means the service was not initialized properly");
  }
  
  // Check if class is available
  if (typeof LogoManifestService !== 'undefined') {
    console.log("✅ LogoManifestService class is available");
  } else {
    console.log("❌ LogoManifestService class NOT FOUND");
  }
}

// Use a custom event to test the system
function triggerManifestTest() {
  console.log("🧪 Triggering logo manifest test...");

  // Test if the event system is working
  const testEvent = new CustomEvent("logo-manifest-updated", {
    detail: {
      manifest: {
        version: "test-1.0",
        logos: [{ name: "Test Logo", active: true }],
      },
      source: "manual-test",
      timestamp: Date.now(),
    },
  });

  console.log("📡 Dispatching test event:", testEvent.detail);
  window.dispatchEvent(testEvent);
}

  // Test if config is available
  if (window.electronAPI && window.electronAPI.getConfig) {
    window.electronAPI
      .getConfig()
      .then((config) => {
        console.log(
          "Current config logoManifest section:",
          config.logoManifest
        );

        if (config.logoManifest && config.logoManifest.enabled) {
          console.log("✓ Logo Manifest config is enabled");
          console.log("Manifest URL:", config.logoManifest.manifestUrl);
          console.log("Poll interval:", config.logoManifest.pollInterval);
        } else {
          console.log("✗ Logo Manifest config not enabled or missing");
        }
      })
      .catch((err) => {
        console.error("Failed to get config:", err);
      });
  } else {
    console.log("✗ electronAPI not available");
  }
}

// Test axios availability (needed for manifest fetching)
function testAxiosAvailability() {
  console.log("Testing axios availability...");

  try {
    if (typeof axios !== "undefined") {
      console.log("✓ axios is available globally");
      return true;
    } else if (typeof require !== "undefined") {
      const axios = require("axios");
      console.log("✓ axios available via require");
      return true;
    } else {
      console.log("✗ axios not available");
      return false;
    }
  } catch (error) {
    console.log("✗ axios import failed:", error.message);
    return false;
  }
}

// Test file system access
function testFileSystemAccess() {
  console.log("Testing file system access...");

  try {
    if (window.electronAPI && window.electronAPI.readFile) {
      console.log("✓ electronAPI file operations available");
      return true;
    } else {
      console.log("✗ electronAPI file operations not available");
      return false;
    }
  } catch (error) {
    console.log("✗ File system test failed:", error.message);
    return false;
  }
}

// Run all tests
function runTests() {
  console.log("=== Logo Manifest Service App Tests ===");

  testAxiosAvailability();
  testFileSystemAccess();
  triggerManifestTest();

// Run all tests
function runTests() {
  console.log("=== Logo Manifest Service App Tests ===");
  
  checkServiceStatus();
  testConfigAccess();
  testAxiosAvailability();
  testFileSystemAccess();
  triggerManifestTest();

  console.log("=== Tests completed ===");
}

// Test config access
function testConfigAccess() {
  console.log("📋 Testing config access...");
  
  // Test if config is available
  if (window.electronAPI && window.electronAPI.getConfig) {
    window.electronAPI
      .getConfig()
      .then((config) => {
        console.log("✅ Config access successful");
        console.log("   - Has logoManifest section:", !!config.logoManifest);

        if (config.logoManifest) {
          console.log("   - Enabled:", config.logoManifest.enabled);
          console.log("   - Manifest URL:", config.logoManifest.manifestUrl);
          console.log("   - Poll interval:", config.logoManifest.pollInterval + "s");
          console.log("   - Download path:", config.logoManifest.downloadPath);
        } else {
          console.log("❌ Logo Manifest config not found in config.json");
        }
      })
      .catch((err) => {
        console.error("❌ Failed to get config:", err);
      });
  } else {
    console.log("❌ electronAPI not available");
  }
}

// Auto-run tests when script loads
console.log("🚀 Starting Logo Manifest Service tests...");
runTests();

// Also expose for manual testing
window.logoManifestTest = {
  checkServiceStatus,
  testConfigAccess,
  triggerManifestTest,
  testAxiosAvailability,
  testFileSystemAccess,
  runTests,
  
  // Force manual manifest fetch
  forceManifestFetch: () => {
    console.log("🔧 Force fetching manifest...");
    if (globalLogoManifestService && globalLogoManifestService.fetchAndProcessManifest) {
      globalLogoManifestService.fetchAndProcessManifest()
        .then(() => console.log("✅ Manual fetch completed"))
        .catch(error => console.error("❌ Manual fetch failed:", error));
    } else {
      console.log("❌ Global service not available for manual fetch");
    }
  }
};

console.log("🎯 Test utilities available at: window.logoManifestTest");
