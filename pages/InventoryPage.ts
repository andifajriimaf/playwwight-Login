import { Page, Locator, expect } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartLink = page.locator('.shopping_cart_link');
  }

  async verifyLoaded() {
    await expect(this.page).toHaveURL(/inventory\.html/, { timeout: 10000 });
  }

  async addProductsToCart(productNames: string[]) {
    for (const name of productNames) {
      const itemCard = this.page.locator('.inventory_item').filter({ hasText: name });
      await itemCard.locator('button:has-text("Add to cart")').click();
    }
    await expect(this.cartBadge).toHaveText(String(productNames.length));
  }

  async openCart() {
    await this.cartLink.click();
    await expect(this.page).toHaveURL(/cart\.html/);
  }
}