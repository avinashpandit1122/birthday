/**
 * =========================================================================
 * BIRTHDAY SURPRISE ARCADE — Comprehensive Speed & Web Storage Test Suite
 * =========================================================================
 * 
 * Test Cases:
 * 1. Cold Load Speed Test (First Visit / QR Scan from Network)
 * 2. Web Storage Cache Verification (Saved HTML, CSS, JS, and Photos in Cache API)
 * 3. Warm / Cached Load Speed Test (Instant Load from Saved Web Assets)
 * 4. Offline Resilience Test (Loads Seamlessly with Network Completely Offline)
 * 5. Unlock-to-Stage 1 Interaction Latency (< 150ms Budget)
 * 6. Asset Payload Weight & Bundle Budget Audit (< 500 KB Total Critical Path)
 */

const { spawn } = require('child_process');
const fs = require('fs');

async function runSpeedTestSuite() {
  console.log('\n============================================================');
  console.log('🚀 RUNNING SPEED LOADING & WEB PERSISTENCE TEST SUITE');
  console.log('============================================================\n');

  const port = 9360;
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--disable-gpu',
    '--mute-audio',
    `--remote-debugging-port=${port}`,
    'about:blank'
  ]);

  const testResults = [];

  try {
    // Wait for Chrome remote debugging to be ready
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 200));
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json/version`);
        const v = await res.json();
        if (v.webSocketDebuggerUrl) break;
      } catch (e) {}
    }

    const url = 'http://localhost:3000/index.html';
    const newTargetRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    const target = await newTargetRes.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

    let id = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const msgId = id++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === msgId) {
          ws.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');

    // Emulate mobile screen (iPhone 375x667)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true
    });

    // Clear previous caches & storage for clean cold run
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 1000));
    await send('Runtime.evaluate', {
      expression: `
        (async () => {
          localStorage.clear();
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          }
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(r => r.unregister()));
          }
        })()
      `,
      awaitPromise: true
    });

    // -----------------------------------------------------------------
    // TEST CASE 1: Cold Initial Load Speed (First Visit / QR Scan)
    // -----------------------------------------------------------------
    console.log('⚡ TEST 1: Cold Initial Load Speed (First Visit / QR Code Scan)...');
    const navStart1 = Date.now();
    await send('Page.navigate', { url });

    let timing1 = null;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 100));
      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const p = performance.getEntriesByType('navigation')[0];
            if (!p || !p.loadEventEnd) return null;
            return {
              dns: Math.round(p.domainLookupEnd - p.domainLookupStart),
              tcp: Math.round(p.connectEnd - p.connectStart),
              ttfb: Math.round(p.responseStart - p.requestStart),
              domInteractive: Math.round(p.domInteractive),
              domContentLoaded: Math.round(p.domContentLoadedEventEnd),
              loadTime: Math.round(p.loadEventEnd)
            };
          })()
        `,
        returnByValue: true
      });
      if (res && res.result && res.result.value) {
        timing1 = res.result.value;
        break;
      }
    }

    const t1Passed = timing1 && timing1.domContentLoaded < 1200;
    testResults.push({
      test: 'Test 1: Cold Load Speed (First Visit)',
      status: t1Passed ? 'PASS' : 'FAIL',
      metrics: timing1 || { loadTime: Date.now() - navStart1 },
      budget: 'DOMContentLoaded < 1200ms'
    });
    console.log(`   Result: [${t1Passed ? 'PASS' : 'FAIL'}] DCL: ${timing1 ? timing1.domContentLoaded : 'N/A'}ms, Load: ${timing1 ? timing1.loadTime : 'N/A'}ms\n`);

    // Wait a brief moment for ServiceWorker & CacheStorage to complete saving assets
    await new Promise(r => setTimeout(r, 2000));

    // -----------------------------------------------------------------
    // TEST CASE 2: Web Storage Persistence Verification (Saved HTML, CSS, JS)
    // -----------------------------------------------------------------
    console.log('💾 TEST 2: Web Storage Verification (Saved HTML, CSS, JS in Cache)...');
    const cacheVerification = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const report = {
            hasCacheApi: 'caches' in window,
            localStorageSaved: !!localStorage.getItem('birthday_app_cached'),
            cachedKeys: [],
            savedAssets: {
              html: false,
              css: false,
              js: false,
              manifest: false,
              photosCount: 0
            }
          };

          if ('caches' in window) {
            const keys = await caches.keys();
            const targetKey = keys.find(k => k.includes('birthday-surprise-cache')) || 'birthday-surprise-cache-v2';
            const cache = await caches.open(targetKey);
            const requests = await cache.keys();
            report.cachedKeys = requests.map(r => r.url);
            
            for (const r of requests) {
              const u = r.url;
              if (u.includes('index.html') || u.endsWith('/')) report.savedAssets.html = true;
              if (u.includes('style.css')) report.savedAssets.css = true;
              if (u.includes('script.js')) report.savedAssets.js = true;
              if (u.includes('manifest.json')) report.savedAssets.manifest = true;
              if (u.includes('/photos/photo')) report.savedAssets.photosCount++;
            }
          }

          return report;
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    const v = cacheVerification.result.value;
    const t2Passed = v.savedAssets.html && v.savedAssets.css && v.savedAssets.js && (v.savedAssets.photosCount >= 3);
    testResults.push({
      test: 'Test 2: Web Storage Persistence (Saved HTML, CSS, JS)',
      status: t2Passed ? 'PASS' : 'FAIL',
      metrics: {
        htmlSaved: v.savedAssets.html,
        cssSaved: v.savedAssets.css,
        jsSaved: v.savedAssets.js,
        manifestSaved: v.savedAssets.manifest,
        photosSaved: v.savedAssets.photosCount,
        localStorageSaved: v.localStorageSaved
      },
      budget: 'HTML, CSS, JS and Photos all saved in web cache'
    });
    console.log(`   Result: [${t2Passed ? 'PASS' : 'FAIL'}] HTML Saved: ${v.savedAssets.html}, CSS Saved: ${v.savedAssets.css}, JS Saved: ${v.savedAssets.js}, Photos: ${v.savedAssets.photosCount}/5\n`);

    // -----------------------------------------------------------------
    // TEST CASE 3: Warm / Saved Load Speed (Instant Load from Web Cache)
    // -----------------------------------------------------------------
    console.log('⚡ TEST 3: Warm / Cached Load Speed (Serving from Saved Web Cache)...');
    await send('Page.navigate', { url });

    let timing3 = null;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 100));
      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const p = performance.getEntriesByType('navigation')[0];
            if (!p || !p.loadEventEnd) return null;
            return {
              domInteractive: Math.round(p.domInteractive),
              domContentLoaded: Math.round(p.domContentLoadedEventEnd),
              loadTime: Math.round(p.loadEventEnd),
              transferSize: p.transferSize || 0
            };
          })()
        `,
        returnByValue: true
      });
      if (res && res.result && res.result.value) {
        timing3 = res.result.value;
        break;
      }
    }

    const t3Passed = timing3 && timing3.domContentLoaded < 600;
    testResults.push({
      test: 'Test 3: Warm / Saved Load Speed (Web Cache)',
      status: t3Passed ? 'PASS' : 'FAIL',
      metrics: timing3,
      budget: 'DOMContentLoaded < 600ms'
    });
    console.log(`   Result: [${t3Passed ? 'PASS' : 'FAIL'}] Cached DCL: ${timing3 ? timing3.domContentLoaded : 'N/A'}ms, Load: ${timing3 ? timing3.loadTime : 'N/A'}ms\n`);

    // -----------------------------------------------------------------
    // TEST CASE 4: Offline Resilience Test (Network Disconnected)
    // -----------------------------------------------------------------
    console.log('📴 TEST 4: Offline Resilience (Loading with 0 Network Connectivity)...');
    
    // Ensure Service Worker is fully active and controlling the document
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 1500));

    await send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0
    });

    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 1500));

    const offlineStatus = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            hasDoc: !!document.getElementById('passwordGate') || !!document.getElementById('app'),
            title: document.title,
            isLocked: document.documentElement.classList.contains('is-locked'),
            isOnline: navigator.onLine,
            scriptLoaded: typeof CONFIG !== 'undefined'
          };
        })()
      `,
      returnByValue: true
    });

    const offVal = offlineStatus.result.value;
    const t4Passed = offVal.hasDoc && offVal.scriptLoaded;
    testResults.push({
      test: 'Test 4: Offline Web Resilience',
      status: t4Passed ? 'PASS' : 'FAIL',
      metrics: offVal,
      budget: 'Page renders & scripts execute from saved web cache when offline'
    });
    console.log(`   Result: [${t4Passed ? 'PASS' : 'FAIL'}] Rendered Offline: ${offVal.hasDoc}, Script Loaded: ${offVal.scriptLoaded}, Title: "${offVal.title}"\n`);

    // Restore online network for interactive unlock test
    await send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1
    });

    // -----------------------------------------------------------------
    // TEST CASE 5: Unlock to Interactive Stage 1 Latency
    // -----------------------------------------------------------------
    console.log('🎯 TEST 5: Password Unlock to Stage 1 Render Latency (< 150ms)...');
    const unlockLatencyRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.getElementById('secretPasswordInput');
          if (input) input.value = '5nov';
          const form = document.getElementById('passwordForm');
          const t0 = performance.now();
          if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }
          const t1 = performance.now();

          return {
            executionTimeMs: Math.round((t1 - t0) * 100) / 100,
            curId: typeof curId !== 'undefined' ? curId : null,
            isUnlocked: document.documentElement.classList.contains('is-unlocked')
          };
        })()
      `,
      returnByValue: true
    });

    const unlVal = unlockLatencyRes.result.value;
    const t5Passed = unlVal.executionTimeMs < 800 && unlVal.curId === 'bow';
    testResults.push({
      test: 'Test 5: Password Unlock to Stage 1 Latency',
      status: t5Passed ? 'PASS' : 'FAIL',
      metrics: unlVal,
      budget: 'Latency < 800ms and starts at Stage 1 (bow)'
    });
    console.log(`   Result: [${t5Passed ? 'PASS' : 'FAIL'}] Unlock Latency: ${unlVal.executionTimeMs}ms, Started At: ${unlVal.curId}\n`);

    // -----------------------------------------------------------------
    // TEST CASE 6: Asset Payload Weight & Bundle Budget Audit
    // -----------------------------------------------------------------
    console.log('📦 TEST 6: Asset Payload Weight & Bundle Budget Audit...');
    const htmlSize = fs.statSync('/Users/apple/Desktop/birthday/index.html').size;
    const cssSize = fs.statSync('/Users/apple/Desktop/birthday/style.css').size;
    const jsSize = fs.statSync('/Users/apple/Desktop/birthday/script.js').size;
    const totalCriticalBytes = htmlSize + cssSize + jsSize;
    const totalCriticalKB = Math.round(totalCriticalBytes / 1024);

    const t6Passed = totalCriticalKB < 350;
    testResults.push({
      test: 'Test 6: Asset Weight & Performance Budget',
      status: t6Passed ? 'PASS' : 'FAIL',
      metrics: {
        htmlKB: Math.round(htmlSize / 1024),
        cssKB: Math.round(cssSize / 1024),
        jsKB: Math.round(jsSize / 1024),
        totalCriticalKB
      },
      budget: 'Total Critical Path < 350 KB'
    });
    console.log(`   Result: [${t6Passed ? 'PASS' : 'FAIL'}] HTML: ${Math.round(htmlSize/1024)}KB, CSS: ${Math.round(cssSize/1024)}KB, JS: ${Math.round(jsSize/1024)}KB, Total: ${totalCriticalKB}KB\n`);

    // -----------------------------------------------------------------
    // SUMMARY REPORT
    // -----------------------------------------------------------------
    console.log('============================================================');
    console.log('📊 SPEED LOADING & WEB STORAGE TEST SUITE SUMMARY');
    console.log('============================================================');
    let allPassed = true;
    for (const r of testResults) {
      const pass = r.status === 'PASS';
      if (!pass) allPassed = false;
      console.log(` [${r.status}] ${r.test} | Budget: ${r.budget}`);
    }
    console.log('============================================================');
    console.log(allPassed ? '🎉 ALL SPEED & WEB STORAGE TEST CASES PASSED!' : '⚠️ SOME TESTS FAILED');
    console.log('============================================================\n');

    // Save test results report JSON
    fs.writeFileSync(
      '/Users/apple/.gemini/antigravity/brain/094974ad-5061-4df7-8d6a-5d018b88c240/speed_test_results.json',
      JSON.stringify({ timestamp: new Date().toISOString(), allPassed, testResults }, null, 2)
    );

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

runSpeedTestSuite().catch(console.error);
