const Poster = artifacts.require("Poster");

contract("Poster", (accounts) => {
  it("should emit NewPost event with correct parameters", async () => {
    const posterInstance = await Poster.deployed();
    
    const content = "Hello, world!";
    const tag = "hello";
    
    // Получаем события до поста (должно быть пусто)
    const eventsBefore = await posterInstance.getPastEvents("NewPost", {
      fromBlock: 0,
      toBlock: "latest"
    });
    
    assert.equal(eventsBefore.length, 0, "Should not have events before posting");

    // Отправляем транзакцию и ждем receipt
    const receipt = await posterInstance.post(content, tag, { from: accounts[0] });
    
    // Проверяем, что событие было эмитировано
    assert.equal(receipt.logs.length, 1, "Should have one event");
    assert.equal(receipt.logs[0].event, "NewPost", "Should be NewPost event");
    
    const event = receipt.logs[0].args;
    assert.equal(event.user, accounts[0], "User should match sender");
    assert.equal(event.content, content, "Content should match");
    
    // Для indexed string параметров мы получаем хэш
    const expectedTagHash = web3.utils.keccak256(tag);
    assert.equal(event.tag, expectedTagHash, "Tag hash should match");
  });

  it("should retrieve past events using getPastEvents", async () => {
    const posterInstance = await Poster.deployed();
    
    const content = "Test message";
    const tag = "test";
    
    await posterInstance.post(content, tag, { from: accounts[0] });
    
    // Получаем все события NewPost
    const events = await posterInstance.getPastEvents("NewPost", {
      fromBlock: 0,
      toBlock: "latest"
    });
    
    assert.isAtLeast(events.length, 1, "Should have at least one event");
    
    const lastEvent = events[events.length - 1];
    assert.equal(lastEvent.args.user, accounts[0], "User should match");
    assert.equal(lastEvent.args.content, content, "Content should match");
    
    const expectedTagHash = web3.utils.keccak256(tag);
    assert.equal(lastEvent.args.tag, expectedTagHash, "Tag hash should match");
  });
});
