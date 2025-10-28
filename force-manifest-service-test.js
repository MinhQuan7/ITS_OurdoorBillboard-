// force-manifest-service-test.js - Force debug Logo Manifest Service
console.log("🚀 Force testing Logo Manifest Service");

// Check if we're in the renderer process
if (typeof window !== "undefined" && window.electronAPI) {
  console.log("✅ In renderer process with electronAPI");

  // Try to manually create and test LogoManifestService
  console.log("Attempting to manually test manifest fetching...");

  // Test config loading
  window.electronAPI
    .getConfig()
    .then((config) => {
      console.log("📋 Full config loaded:", {
        hasLogoManifest: !!config.logoManifest,
        enabled: config.logoManifest?.enabled,
        manifestUrl: config.logoManifest?.manifestUrl,
        pollInterval: config.logoManifest?.pollInterval,
      });

      if (config.logoManifest && config.logoManifest.enabled) {
        // Try to fetch manifest directly
        return testManifestFetch(config.logoManifest.manifestUrl);
      } else {
        throw new Error("Logo Manifest not enabled in config");
      }
    })
    .then((manifest) => {
      if (manifest) {
        console.log("🎉 Manifest fetch successful:", manifest);

        // Trigger hot reload event
        const event = new CustomEvent("logo-manifest-updated", {
          detail: {
            manifest: manifest,
            source: "manual-test",
            timestamp: Date.now(),
          },
        });

        console.log("📡 Dispatching logo-manifest-updated event");
        window.dispatchEvent(event);
      } else {
        console.log("❌ Manifest fetch failed");
      }
    })
    .catch((error) => {
      console.error("❌ Logo Manifest test failed:", error);
    });
} else {
  console.log("❌ Not in renderer process or electronAPI not available");
}

async function testManifestFetch(manifestUrl) {
  console.log(`🔍 Testing manifest fetch from: ${manifestUrl}`);

  try {
    // For file:// URLs, we need to use electronAPI to read local files
    if (manifestUrl.startsWith("file://")) {
      console.log("📄 Local file URL detected, using file system access");

      // Convert file URL to local path
      const localPath = manifestUrl
        .replace("file:///", "")
        .replace(/\\%20/g, " ");
      console.log(`🗂️ Local path: ${localPath}`);

      if (window.electronAPI && window.electronAPI.readFile) {
        const content = await window.electronAPI.readFile(localPath);
        const manifest = JSON.parse(content);
        console.log("✅ Local manifest loaded:", manifest);
        return manifest;
      } else {
        throw new Error("electronAPI.readFile not available");
      }
    } else {
      // HTTP/HTTPS URLs
      console.log("🌐 Remote URL detected, using fetch");

      const response = await fetch(manifestUrl, {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const manifest = await response.json();
      console.log("✅ Remote manifest loaded:", manifest);
      return manifest;
    }
  } catch (error) {
    console.error("❌ Manifest fetch error:", error);
    return null;
  }
}

// Export for console testing
if (typeof window !== "undefined") {
  window.forceManifestTest = {
    testManifestFetch,
    test: () => {
      console.log("🔧 Running manual Logo Manifest test...");
      window.electronAPI
        .getConfig()
        .then((config) => testManifestFetch(config.logoManifest.manifestUrl))
        .then((manifest) => {
          if (manifest) {
            console.log("🎉 Manual test successful!");
            // Dispatch event
            window.dispatchEvent(
              new CustomEvent("logo-manifest-updated", {
                detail: { manifest, source: "manual", timestamp: Date.now() },
              })
            );
          }
        });
    },
  };
}
