const CCR = artifacts.require("CCR");
const { catchRevert } = require("./exceptionsHelpers.js");

contract('CCR', function (accounts) {
  const [contractOwner, user1, user2, user3, user4] = accounts;
  const spendEther = 0.04
  const mintSpend = web3.utils.toWei(spendEther.toString(), 'ether');
  const mintZero = web3.utils.toWei('0', 'ether');
  const baseURL = "ipfs://QmdGmRN4rU5nttWe1ozvzJ4txUa1yXWn89QeWuzuoTwkTB/"

  beforeEach(async () => {
    instance = await CCR.new(baseURL);
  });

  it("ready to be solved!", async () => {
    const eth100 = 100e18;
    assert.equal(await web3.eth.getBalance(user1), eth100.toString());
  });

  it("Can get tokenURI not exist", async () => {
    await catchRevert(instance.tokenURI(1))
  })

  it("Admin can set baseTokenURI", async () => {
    await instance.mintByAdmin([user1], { from: contractOwner, value: mintZero });
    const oldURI = await instance.tokenURI(0)
    assert.equal(oldURI, 'ipfs://QmdGmRN4rU5nttWe1ozvzJ4txUa1yXWn89QeWuzuoTwkTB/0', "tokenBaseURI not expect");
    await instance.setBaseTokenURI("ipfs://QmVNNxtds7QCHzsM8Jps8Ksfd53Evy1zePCXW63h5wUc1Q/", { from: contractOwner, value: mintZero })
    const newURI = await instance.tokenURI(0)
    assert.equal(newURI, 'ipfs://QmVNNxtds7QCHzsM8Jps8Ksfd53Evy1zePCXW63h5wUc1Q/0', "admin not change tokenBaseURI");
  })

  it("admin can mint token to user1", async () => {
    await instance.mintByAdmin([user1], { from: contractOwner, value: mintZero });
    const balance = await instance.balanceOf(user1);
    assert.equal(balance.toString(), '1', "mint token to user1 failed");
  })

  it("user can not mint token to other user", async () => {
    await catchRevert(instance.mintByAdmin([user1], { from: user1, value: mintSpend }))
  })

  it("Can get tokenURI minted NFT", async () => {
    await instance.mintByAdmin([user1], { from: contractOwner, value: mintZero });
    const token0 = await instance.tokenURI(0)
    assert.equal(
      token0.toString(), baseURL + '0', "cannot read token url"
    );
  })

  it("user can not mint NFT without set whitelist", async () => {
    await catchRevert(instance.mint({ from: user1, value: mintSpend }));
  })

  it("admin can add addresses to whitelist", async () => {
    await instance.addToWhitelist([user1, user2, user3], { from: contractOwner });
    const user1IsInWhitelist = await instance.isInWhitelist(user1);
    const user2IisInWhitelist = await instance.isInWhitelist(user2);
    const user3IisInWhitelist = await instance.isInWhitelist(user3);
    const user4IisNotInWhitelist = await instance.isInWhitelist(user4);
    assert.equal(
      user1IsInWhitelist && user2IisInWhitelist && user3IisInWhitelist && !user4IisNotInWhitelist,
      true,
      "address is not add to whitelist correctly");
  })

  it("user can not set whitelist", async () => {
    await catchRevert(instance.addToWhitelist([user4], { from: user1 }));
  })

  it("before whitelistEndDate, only people in whiltelist can mint", async () => {
    await instance.addToWhitelist([user1], { from: contractOwner });
    await instance.mint({ from: user1, value: mintZero });
    await catchRevert(instance.mint({ from: user4, value: mintSpend }));
  })

  it("after whitelistEndBlockDate, anyone can mint by spend ethers", async () => {
    const balanceUser = await web3.eth.getBalance(user4);
    const AdminBalanceBeforeMint = await web3.eth.getBalance(contractOwner);
    const contractBalanceBeforeMint = await web3.eth.getBalance(instance.address);
    assert.equal(contractBalanceBeforeMint == 0, true, "contract have no balance");

    // change whitelist and mint
    const startDate = (await web3.eth.getBlock()).timestamp
    await catchRevert(instance.mint({ from: user4, value: mintSpend }));
    const newWhitelistEndDate = startDate - 1;
    await instance.setwhitelistEndDate(newWhitelistEndDate, { from: contractOwner });
    await instance.mint({ from: user4, value: mintSpend });

    // check balance
    const balanceUserAfterMint = await web3.eth.getBalance(user4);
    const contractBalanceAfterMint = await web3.eth.getBalance(instance.address);
    const userEtherDifference = balanceUserAfterMint - balanceUser // -0.04+ ether
    assert.equal(Math.abs(userEtherDifference) - mintSpend < 1e16, true, "user ether spend is not correct");
    assert.equal(contractBalanceAfterMint == 4e16, true, "contract have no recieve ether");

    // withdraw contract balance
    await instance.withdrawAll({ from: contractOwner });
    const AdminBalanceAfterMint = await web3.eth.getBalance(contractOwner);
    assert.equal(
      Number(AdminBalanceAfterMint) > Number(AdminBalanceBeforeMint) && Math.abs(AdminBalanceAfterMint - AdminBalanceBeforeMint - 4e16) < 1e16,
      true,
      "admin withdraw is not correct"
    );
  })

  it("Can read remain supply", async () => {
    const remainSupplyBeforeMint = await instance.getRemainingSupply();
    assert.equal(remainSupplyBeforeMint.toString(), '500', "remain supply is not correct");
    await instance.mintByAdmin([user1], { from: contractOwner, value: mintZero });
    const remainSupplyAfterMint = await instance.getRemainingSupply();
    assert.equal(remainSupplyAfterMint.toString(), '499', "remain supply is not correct");
  })

  it("User in whitelist can only mint 2 times", async () => {
    await instance.addToWhitelist([user1], { from: contractOwner });
    await instance.mint({ from: user1, value: mintZero });
    await instance.mint({ from: user1, value: mintSpend });
    await catchRevert(instance.mint({ from: user1, value: mintSpend }));
    assert.equal(await instance.balanceOf(user1), '2', "user should has 2 NFTs");
  })

  it("User in whitelist second NFT should pay", async () => {
    await instance.addToWhitelist([user1], { from: contractOwner });
    await instance.mint({ from: user1, value: mintZero });
    assert.equal(await instance.getMintedCount(user1), '1', "user should have minted 1 NFT");
    await catchRevert(instance.mint({ from: user1, value: mintZero }));
    await instance.mint({ from: user1, value: mintSpend });
    assert.equal(await instance.getMintedCount(user1), '2', "user should have minted 2 NFTs");
    assert.equal(await instance.balanceOf(user1), '2', "user should has 2 NFTs");
  })
});