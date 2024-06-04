import { test as setup, expect } from "@playwright/test";

setup("Create new article", async ({ request }) => {
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

  const newAtricleResponse = await articleResponse.json();
  const slugId = newAtricleResponse.article.slug;
  process.env["SLUGID"] = slugId;
});
