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

  await page.goto("https://pser.punjab.gov.pk/register", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // Solve reCAPTCHA if found
  await page.solveRecaptchas();
  console.log("reCAPTCHA solved!");

  // Wait for Full Name field
  await page.waitForSelector('input[name="name"]', { visible: true });
  await page.type('input[name="name"]', "Abaid Ullah");

  // Enter CNIC
  await page.waitForSelector('input[name="username"]', { visible: true });
  await page.type('input[name="username"]', "3110345853412");

  // Select Network
  await page.waitForSelector('select[name="mobile_network"]', {
    visible: true,
  });
  await page.select('select[name="mobile_network"]', "Zong");

  // Enter Mobile Number
  await page.waitForSelector('input[name="mobile"]', { visible: true });
  await page.type('input[name="mobile"]', "03106126217");

  // Select Bahawalnagar in District Dropdown (Trigger Select2 Event)
  await page.waitForSelector("#district_id", { visible: true });
  await page.evaluate(() => {
    const districtDropdown = document.querySelector("#district_id");
    districtDropdown.value = "1"; // Bahawalnagar has value="1"
    districtDropdown.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Wait for Tehsil Dropdown to Load
  await page.waitForFunction(
    () => {
      const tehsilDropdown = document.querySelector("#tehsil_id");
      return tehsilDropdown && tehsilDropdown.options.length > 1; // Ensure options are loaded
    },
    { timeout: 10000 }
  );

  // Select Fort Abbas dynamically
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

  // Enter Password
  await page.waitForSelector('input[name="password"]', { visible: true });
  await page.type('input[name="password"]', "Uc131@237");

  // Re-enter Password
  await page.waitForSelector('input[name="password_confirmation"]', {
    visible: true,
  });
  await page.type('input[name="password_confirmation"]', "Uc131@237");

  console.log("Form filled successfully!");

  // Wait for the button using XPath and click it
  await page.waitForSelector("form button[type='submit']", { visible: true });
  await page.click("form button[type='submit']");

  console.log("Register button clicked!");

  // Wait for 10 seconds to allow the registration process to complete
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Optionally, you can verify successful registration by checking for a success message or URL change
  // For example:
  const successMessage = await page.$("selector-for-success-message");
  if (successMessage) {
    console.log("Registration successful!");
  } else {
    console.log("Registration failed!");
  }

  // Keep the browser open for checking
  await new Promise((resolve) => setTimeout(resolve, 5000));

  await browser.close();
})();
