import { expect, test } from "@playwright/test";
import { users } from "../../fixtures/users";
import { Role } from "../../fixtures/roles";

test("user can log in", async ({ page }) => {
  await page.goto("http://localhost:4000/ui/login");
  await page.getByPlaceholder("请输入用户名").fill(users[Role.ProxyAdmin].email);
  await page.getByPlaceholder("请输入密码").fill(users[Role.ProxyAdmin].password);
  const loginButton = page.getByRole("button", { name: "登录", exact: true });
  await expect(loginButton).toBeEnabled();
  await loginButton.click();
  await expect(page.getByText("Virtual Keys")).toBeVisible();
});
