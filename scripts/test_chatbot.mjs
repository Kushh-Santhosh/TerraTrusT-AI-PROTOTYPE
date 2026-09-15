import puppeteer from "puppeteer-core";

async function testFullChatbot() {
  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();

  console.log("1. Navigating to http://localhost:3000/...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 4000));

  const frameElement = await page.$("#aparsoft-chatbot-loader-frame");
  const frame = await frameElement.contentFrame();

  const initialBox = await frameElement.boundingBox();
  console.log("2. Chatbot closed dimensions:", initialBox);

  // Click launcher via DOM event inside frame
  console.log("3. Clicking launcher button inside frame...");
  await frame.evaluate(() => {
    const btn = document.querySelector("button.aparsoft-chat__launcher");
    btn?.click();
  });

  await new Promise((r) => setTimeout(r, 1500));
  const openBox = await frameElement.boundingBox();
  console.log("4. Chatbot opened dimensions:", openBox);

  await page.screenshot({ path: "./screenshots/map_verification/08_chatbot_opened_via_click.png" });

  // Click close button inside frame
  console.log("5. Clicking close button inside frame...");
  await frame.evaluate(() => {
    const closeBtn = document.querySelector(
      'button.aparsoft-chat__icon-btn[aria-label="Close chat"]',
    );
    closeBtn?.click();
  });

  await new Promise((r) => setTimeout(r, 1500));
  const closedBoxAgain = await frameElement.boundingBox();
  console.log("6. Chatbot closed dimensions after close click:", closedBoxAgain);

  await page.screenshot({ path: "./screenshots/map_verification/09_chatbot_closed_via_click.png" });

  // Open it again
  console.log("7. Re-opening chatbot for conversational test...");
  await frame.evaluate(() => {
    const btn = document.querySelector("button.aparsoft-chat__launcher");
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Type message and click send
  console.log("8. Typing message and sending...");
  await frame.evaluate(() => {
    const input = document.querySelector("textarea.aparsoft-chat__input");
    if (input) {
      input.value = "What is TerraTrust AI?";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  await new Promise((r) => setTimeout(r, 500));
  await frame.evaluate(() => {
    const sendBtn = document.querySelector("button.aparsoft-chat__send");
    sendBtn?.click();
  });

  console.log("9. Message sent. Polling for AI response to finish generating...");
  let latestText = "";
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    latestText = await frame.evaluate(() => document.body.innerText);
    const lines = latestText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    console.log(`Poll ${i + 1}: ${lines[lines.length - 1] || ""}`);
    if (!latestText.includes("Thinking…") && lines.length >= 5) {
      console.log("AI Response has arrived and finished streaming!");
      break;
    }
  }

  console.log("\n--- FULL CHAT CONVERSATION ---");
  console.log(latestText);
  console.log("------------------------------\n");

  await page.screenshot({ path: "./screenshots/map_verification/10_chatbot_final_response.png" });
  console.log(
    "Final screenshot saved to screenshots/map_verification/10_chatbot_final_response.png",
  );

  await page.close();
}

testFullChatbot().catch(console.error);
