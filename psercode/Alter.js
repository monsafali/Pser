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

  // Open registration page
  await page.goto("https://pser.punjab.gov.pk/register", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // Solve reCAPTCHA if present
  await page.solveRecaptchas();
  console.log("✅ reCAPTCHA solved!");

  // Fill the form fields
  await page.waitForSelector('input[name="name"]', { visible: true });
  await page.type('input[name="name"]', "Muhammad Javed");

  await page.waitForSelector('input[name="username"]', { visible: true });
  await page.type('input[name="username"]', "3110303415057");

  await page.waitForSelector('select[name="mobile_network"]', {
    visible: true,
  });
  await page.select('select[name="mobile_network"]', "Zong");

  await page.waitForSelector('input[name="mobile"]', { visible: true });
  await page.type('input[name="mobile"]', "03106126237");

  // Select district
  await page.waitForSelector("#district_id", { visible: true });
  await page.select("#district_id", "1"); // Selects a district by value

  //   await page.waitForTimeout(5000); // Allow time for tehsil options to load
  await new Promise((resolve) => setTimeout(resolve, 9000));

  // Select tehsil (sub-district)
  await page.waitForSelector("#tehsil_id", { visible: true });
  await page.evaluate(() => {
    const tehsilDropdown = document.querySelector("#tehsil_id");
    for (let option of tehsilDropdown.options) {
      if (option.text.includes("Fort Abbas")) {
        tehsilDropdown.value = option.value;
        tehsilDropdown.dispatchEvent(new Event("change", { bubbles: true }));
        break;
      }
    }
  });

  // Enter password
  await page.waitForSelector('input[name="password"]', { visible: true });
  await page.type('input[name="password"]', "Uc131@237");

  await page.waitForSelector('input[name="password_confirmation"]', {
    visible: true,
  });
  await page.type('input[name="password_confirmation"]', "Uc131@237");

  console.log("✅ Form filled successfully!");

  // Handle possible CSRF token (if exists)
  const csrfToken = await page
    .$eval('input[name="_token"]', (el) => el.value)
    .catch(() => null);
  if (csrfToken) {
    console.log("🔐 CSRF Token Found:", csrfToken);
  }

  // Submit the form
  await page.waitForSelector("form button[type='submit']", { visible: true });
  await page.evaluate(() => document.querySelector("form").submit());

  console.log("🚀 Register button clicked!");

  // Wait for response
  //   await page.waitForTimeout(8000);
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Check for success message
  const successMessage = await page.evaluate(() => {
    return document.body.innerText.includes("Registration successful");
  });

  if (successMessage) {
    console.log("🎉 Registration successful!");
  } else {
    console.log("❌ Registration failed!");

    // Check for validation errors
    const errorMessages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".error-message")).map(
        (el) => el.innerText
      );
    });

    if (errorMessages.length > 0) {
      console.log("⚠️ Validation Errors Found:");
      errorMessages.forEach((error, index) =>
        console.log(`${index + 1}. ${error}`)
      );
    } else {
      console.log("ℹ️ No visible validation errors.");
    }

    // Log the entire page content for debugging
    const pageContent = await page.evaluate(() => document.body.innerText);
    console.log("📄 Page Content After Submission:\n", pageContent);
  }

  await browser.close();
})();
