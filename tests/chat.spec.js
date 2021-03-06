const request = require("supertest");
const { app, server } = require("../index");
const { Chat, ChatMessage, User } = require("../models");
const bcrypt = require("bcrypt");

let testChat, testUserAccessToken;

beforeAll(async () => {
  const buyer = await User.create({
    email: "buyer@gmail.com",
    password: await bcrypt.hash("123456", 10),
  });
  const seller = await User.create({
    email: "seller@gmail.com",
    password: await bcrypt.hash("123456", 10),
  });

  testChat = await Chat.create({
    buyer_id: buyer.id,
    seller_id: seller.id,
  });

  const testBuyerChatMessage = await ChatMessage.create({
    chat_id: testChat.id,
    user_id: buyer.id,
    message: "Hello from Buyer!",
  });

  const testSellerChatMessage = await ChatMessage.create({
    chat_id: testChat.id,
    user_id: seller.id,
    message: "Hello from Seller!",
  });

  const loginResponse = await request(app).post("/auth/login").send({
    email: "buyer@gmail.com",
    password: "123456",
  });
  testUserAccessToken = loginResponse.body.accessToken.token;
});

afterAll(async () => {
  await User.destroy({ where: {} });
  await Chat.destroy({ where: {} });
  server.close();
});

describe("Get Chats", () => {
  test("200 Success", async () => {
    await request(app)
      .get("/chat")
      .set("Authorization", testUserAccessToken)
      .expect(200);
  });

  test("500 System Error", async () => {
    const originalFn = Chat.findAll;
    Chat.findAll = jest.fn().mockImplementationOnce(() => {
      throw new Error();
    });
    await request(app)
      .get("/chat")
      .set("Authorization", testUserAccessToken)
      .expect(500);
    Chat.findAll = originalFn;
  });
});

describe("Get Chat", () => {
  test("200 Success", async () => {
    await request(app)
      .get(`/chat/${testChat.id}`)
      .set("Authorization", testUserAccessToken)
      .expect(200);
  });

  test("400 Validation Error", async () => {
    await request(app)
      .get(`/chat/abc`)
      .set("Authorization", testUserAccessToken)
      .expect(400);
  });

  test("404 Chat Not Found", async () => {
    await request(app)
      .get(`/chat/123`)
      .set("Authorization", testUserAccessToken)
      .expect(404);
  });

  test("500 System Error", async () => {
    const originalFn = Chat.findOne;
    Chat.findOne = jest.fn().mockImplementationOnce(() => {
      throw new Error();
    });
    await request(app)
      .get(`/chat/${testChat.id}`)
      .set("Authorization", testUserAccessToken)
      .expect(500);
    Chat.findOne = originalFn;
  });
});
