import { test, expect, request } from "@playwright/test";
import tags from "../test-data/tags.json";

test.beforeEach(async ({ page }) => {
  //mock the data
  await page.route("*/**/api/tags", async (route) => {
    await route.fulfill({ body: JSON.stringify(tags) });
  });

  await page.goto("https://conduit.bondaracademy.com");
});

test("has title", async ({ page }) => {
  //modify API response
  await page.route("*/**/api/articles*", async (route) => {
    const response = await route.fetch();
    const responseBody = await response.json();
    responseBody.articles[0].title = "This is a MOCK test title";
    responseBody.articles[0].description = "This is a MOCK description";

    await route.fulfill({
      body: JSON.stringify(responseBody),
    });
  });

  await page.getByText("Global Feed").click();
  await expect(page.locator(".navbar-brand")).toHaveText("conduit");
  await expect(page.locator("app-article-list h1").first()).toContainText(
    "This is a MOCK test title"
  );
  await expect(page.locator("app-article-list p").first()).toContainText(
    "This is a MOCK description"
  );
});

test("Delete article", async ({ page, request }) => {
  //get the access token
  const response = await request.post(
    "https://conduit-api.bondaracademy.com/api/users/login",
    { data: { user: { email: "vrakytia@test.com", password: "123" } } }
  );
  const responseBody = await response.json();
  const accessToken = responseBody.user.token;
  //create an article
  const articleResponse = await request.post(
    "https://conduit-api.bondaracademy.com/api/articles/",
    {
      data: {
        article: {
          title: "This a test title",
          description: "This is a test description",
          body: "This is a test body",
          tagList: [],
        },
      },
      headers: {
        Authorization: `Token ${accessToken}`,
      },
    }
  );
  expect(articleResponse.status()).toEqual(201);

  await page.getByText("Global Feed").click();
  await page.getByText("This a test title").click();
  await page.getByRole("button", { name: "Delete Article" }).first().click();
  await page.getByText("Global Feed").click();

  await expect(page.locator("app-article-list h1").first()).not.toContainText(
    "This is test article"
  );
});

test("Create article", async ({ page, request }) => {
  //Itercept browser API response
  await page.getByText("New Article").click();
  await page
    .getByRole("textbox", { name: "Article Title" })
    .fill("Playwright is awesome");
  await page
    .getByRole("textbox", { name: "What's this article about?" })
    .fill("About the Playwright");
  await page
    .getByRole("textbox", { name: "Write your article (in markdown)" })
    .fill("We like to use playwright for automation");
  await page.getByRole("button", { name: "Publish Article" }).click();
  const articleResponse = await page.waitForResponse(
    "https://conduit-api.bondaracademy.com/api/articles/"
  );
  const articleResponseBody = await articleResponse.json();
  const slugId = articleResponseBody.article.slug;

  await expect(page.locator(".article-page h1")).toContainText(
    "Playwright is awesome"
  );
  await page.getByText("Home").click();
  await page.getByText("Global Feed").click();

  await expect(page.locator("app-article-list h1").first()).toContainText(
    "Playwright is awesome"
  );

  const response = await request.post(
    "https://conduit-api.bondaracademy.com/api/users/login",
    { data: { user: { email: "vrakytia@test.com", password: "123" } } }
  );
  const responseBody = await response.json();
  const accessToken = responseBody.user.token;

  await request.delete(
    `
  https://conduit-api.bondaracademy.com/api/articles/${slugId}`,
    {
      headers: {
        Authorization: `Token ${accessToken}`,
      },
    }
  );

  expect(articleResponse.status()).toEqual(204);
});