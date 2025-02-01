import puppeteer from "puppeteer-extra";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";

// Enable reCAPTCHA solving plugin
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: "02afbbdfeae5f8f8f4573b7f510db1daa", // Replace with your 2Captcha API key
    },
    visualFeedback: true, // Shows the solving process in the browser
  })
);

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // ================== BLOCK LOCATION PROMPT ================== //
  await page.setGeolocation({ latitude: 0, longitude: 0 });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: () => Promise.reject(),
        watchPosition: () => Promise.reject(),
      },
    });
    navigator.permissions.query = () => Promise.resolve({ state: "denied" });
  });

  // ================== NAVIGATE TO PAGE ================== //
  await page.goto("https://pser.punjab.gov.pk/login", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // ================== HANDLE LOCATION POPUP ================== //
  try {
    await page.waitForSelector("button:not([disabled])", { timeout: 3000 });
    const denyButtons = await page.$x(
      "//button[contains(., 'Don't allow') or contains(., 'Block') or contains(., 'Deny')]"
    );

    if (denyButtons.length > 0) {
      await denyButtons[0].click();
      console.log("Location permission denied");
      await page.waitForTimeout(1000);
    }
  } catch (error) {
    console.log("No location popup detected");
  }

  // ================== HANDLE CAPTCHA ================== //
  await page.solveRecaptchas();
  console.log("✅ reCAPTCHA solved!");

  // ================== WAIT FOR FORM FIELDS ================== //
  try {
    await page.waitForSelector("input.form-control", {
      visible: true,
      timeout: 5000,
    });
    const formControls = await page.$$("input.form-control");

    // Type credentials
    await formControls[0].type("3110303415057", { delay: 50 });
    await formControls[1].type("Uc131@237", { delay: 50 });
  } catch (error) {
    console.error("Form fields not found:", error);
    await browser.close();
    return;
  }

  // ================== CLICK LOGIN BUTTON ================== //
  await page.waitForSelector("form button[type='submit']", { visible: true });
  await page.evaluate(() => document.querySelector("form").submit());

  console.log("🚀 Successfully logged in!");

  await new Promise((resolve) => setTimeout(resolve, 5000));
  await browser.close();
})();
