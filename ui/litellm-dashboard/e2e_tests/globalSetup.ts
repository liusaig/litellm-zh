import { chromium } from "@playwright/test";
import { users } from "./fixtures/users";
import { Role } from "./fixtures/roles";

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:4000/ui/login");
  await page.getByPlaceholder("请输入用户名").fill(users[Role.ProxyAdmin].email);
  await page.getByPlaceholder("请输入密码").fill(users[Role.ProxyAdmin].password);
  const loginButton = page.getByRole("button", { name: "登录", exact: true });
  await loginButton.click();
  await page.waitForSelector("text=Virtual Keys");
  await page.context().storageState({ path: "admin.storageState.json" });
  await browser.close();
}

export default globalSetup;
