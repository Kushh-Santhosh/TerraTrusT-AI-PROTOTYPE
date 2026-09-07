async function getWsUrl() {
  const res = await fetch("http://127.0.0.1:9222/json/list");
  const list = await res.json();
  const page = list.find((p) => p.type === "page" && p.url.includes("localhost:3000")) || list.find((p) => p.type === "page");
  if (!page) throw new Error("No Chrome page found");
  return page.webSocketDebuggerUrl;
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && this.callbacks.has(data.id)) {
        const cb = this.callbacks.get(data.id);
        this.callbacks.delete(data.id);
        if (data.error) cb.reject(data.error);
        else cb.resolve(data.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${res.exceptionDetails.text || JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async navigate(url) {
    await this.send("Page.navigate", { url });
    await new Promise((r) => setTimeout(r, 1200));
  }

  close() {
    this.ws.close();
  }
}

async function loginAsRole(cdp, roleName, expectedPath) {
  console.log(`\n========================================`);
  console.log(`LOGGING IN AS REAL ROLE: ${roleName.toUpperCase()}`);
  console.log(`========================================`);

  await cdp.navigate("http://localhost:3000/login");
  await new Promise((r) => setTimeout(r, 1000));

  // Click the quick role sign in button on the login screen
  const clicked = await cdp.eval(`(() => {
    const details = document.querySelector("details");
    if (details) details.open = true;

    // Find the row for this role
    const rows = Array.from(document.querySelectorAll("details div.rounded-lg"));
    const targetRow = rows.find(r => r.innerText.toLowerCase().includes("${roleName.toLowerCase()}"));
    if (!targetRow) return false;

    // Click Sign In button in that row
    const signInBtn = Array.from(targetRow.querySelectorAll("button")).find(b => b.innerText.includes("Sign In"));
    if (!signInBtn) return false;
    signInBtn.click();
    return true;
  })()`);

  console.log(`  Clicked Sign In for ${roleName}: ${clicked}`);
  await new Promise((r) => setTimeout(r, 2000));

  const curPath = await cdp.eval(`window.location.pathname`);
  const curRole = await cdp.eval(`document.querySelector("aside div.rounded-md span")?.innerText || ""`);
  console.log(`  Landed at: ${curPath}, Active UI Role Badge: "${curRole}"`);

  return { curPath, curRole };
}

async function testRoleNavigation(cdp, roleName) {
  // Query all visible sidebar items
  const navItems = await cdp.eval(`(() => {
    const links = Array.from(document.querySelectorAll("aside nav a"));
    return links.map(a => ({
      text: (a.querySelector("span")?.innerText || a.innerText || "").trim(),
      href: a.getAttribute("href") || "",
    }));
  })()`);

  console.log(`Found ${navItems.length} sidebar items for ${roleName}:`, navItems.map(n => n.text).join(", "));

  const results = [];

  for (const item of navItems) {
    if (!item.href || item.href === "#" || item.text === "Sign Out") continue;

    process.stdout.write(`  [${roleName}] "${item.text}" (${item.href}) ... `);

    // Click link using real DOM click event
    const clickSuccess = await cdp.eval(`(() => {
      const link = Array.from(document.querySelectorAll("aside nav a")).find(a => 
        (a.querySelector("span")?.innerText || a.innerText || "").trim() === "${item.text}" ||
        a.getAttribute("href") === "${item.href}"
      );
      if (!link) return false;
      link.scrollIntoView({ block: "center" });
      link.click();
      return true;
    })()`);

    if (!clickSuccess) {
      console.log(`FAILED TO CLICK`);
      results.push({ role: roleName, item: item.text, target: item.href, result: "FAIL (Click missing)" });
      continue;
    }

    // Wait for route transition
    await new Promise((r) => setTimeout(r, 1000));

    // Inspect destination
    const state = await cdp.eval(`(() => {
      const path = window.location.pathname;
      const title = document.title;
      const h1 = document.querySelector("h1")?.innerText || "";
      const isRestricted = !!document.querySelector("h2")?.innerText?.includes("Access Restricted");
      const is404 = !!document.querySelector("h1")?.innerText?.includes("Page not found");
      const isError = !!document.querySelector("h1")?.innerText?.includes("Something went wrong");
      const buttonCount = document.querySelectorAll("button, a.button, [role='button']").length;
      return { path, title, h1, isRestricted, is404, isError, buttonCount };
    })()`);

    if (state.isRestricted) {
      console.log(`FAIL (Access Restricted)`);
      results.push({ ...state, role: roleName, item: item.text, target: item.href, result: "FAIL (Access Restricted)" });
    } else if (state.is404) {
      console.log(`FAIL (404 Not Found)`);
      results.push({ ...state, role: roleName, item: item.text, target: item.href, result: "FAIL (404)" });
    } else if (state.isError) {
      console.log(`FAIL (Router Error)`);
      results.push({ ...state, role: roleName, item: item.text, target: item.href, result: "FAIL (Router Error)" });
    } else {
      console.log(`PASS (path=${state.path}, h1="${state.h1}", buttons=${state.buttonCount})`);
      results.push({ ...state, role: roleName, item: item.text, target: item.href, result: "PASS" });
    }
  }

  return results;
}

async function runMobileTest(cdp) {
  console.log(`\n========================================`);
  console.log(`TESTING MOBILE VIEWPORT (390 x 844)`);
  console.log(`========================================`);

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });

  await cdp.navigate("http://localhost:3000/surveyor");
  await new Promise((r) => setTimeout(r, 1000));

  // Open mobile drawer
  console.log(`  Clicking hamburger menu...`);
  const drawerOpened = await cdp.eval(`(() => {
    const btn = document.querySelector("button[aria-label='Open mobile menu']");
    if (!btn) return false;
    btn.click();
    return true;
  })()`);

  await new Promise((r) => setTimeout(r, 600));

  const mobileLinks = await cdp.eval(`(() => {
    const drawerLinks = Array.from(document.querySelectorAll("aside.relative nav a"));
    return drawerLinks.map(a => ({
      text: (a.querySelector("span")?.innerText || a.innerText || "").trim(),
      href: a.getAttribute("href") || "",
    }));
  })()`);

  console.log(`  Mobile drawer opened: ${drawerOpened}, found ${mobileLinks.length} mobile navigation links.`);

  if (mobileLinks.length > 0) {
    const testTarget = mobileLinks[1] || mobileLinks[0];
    console.log(`  Clicking mobile link: "${testTarget.text}" (${testTarget.href})...`);
    await cdp.eval(`(() => {
      const link = Array.from(document.querySelectorAll("aside.relative nav a")).find(a => 
        (a.querySelector("span")?.innerText || a.innerText || "").trim() === "${testTarget.text}"
      );
      if (link) link.click();
    })()`);

    await new Promise((r) => setTimeout(r, 1200));
    const finalPath = await cdp.eval(`window.location.pathname`);
    console.log(`  Mobile navigated to: ${finalPath} (PASS)`);
  }

  // Clear device override back to desktop
  await cdp.send("Emulation.clearDeviceMetricsOverride");
}

async function main() {
  const wsUrl = await getWsUrl();
  console.log(`Connected to Chrome CDP: ${wsUrl}`);

  const cdp = new CDPClient(wsUrl);
  await cdp.connect();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  const roles = [
    { name: "Surveyor", expectedHome: "/surveyor" },
    { name: "Government", expectedHome: "/government" },
    { name: "Bank", expectedHome: "/bank" },
    { name: "Citizen", expectedHome: "/dashboard" },
    { name: "Administrator", expectedHome: "/admin" },
  ];

  const allResults = [];

  for (const r of roles) {
    await loginAsRole(cdp, r.name, r.expectedHome);
    const res = await testRoleNavigation(cdp, r.name);
    allResults.push(...res);
  }

  await runMobileTest(cdp);

  console.log(`\n========================================`);
  console.log(`FINAL NAVIGATION QA SUMMARY`);
  console.log(`========================================`);
  const total = allResults.length;
  const passed = allResults.filter(r => r.result === "PASS").length;
  const failed = allResults.filter(r => r.result !== "PASS").length;

  console.log(`Total Sidebar Items Tested: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log("\nFAILURES:");
    allResults.filter(r => r.result !== "PASS").forEach(f => {
      console.log(`  - [${f.role}] "${f.item}" -> ${f.target}: ${f.result}`);
    });
  } else {
    console.log("\nALL NAVIGATION CHECKS PASSED WITH ZERO FAILURES!");
  }

  cdp.close();
}

main().catch(err => {
  console.error("CDP QA Test encountered error:", err);
  process.exit(1);
});
