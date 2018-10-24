const StarNotary = artifacts.require('StarNotary')

var expectThrow = async function(promise) { 
    try { 
        await promise;
    } catch (error) { 
        assert.exists(error);
        return;
    }
    assert.fail('Expected an error but didnt see one!');
}

contract('StarNotary', accounts => { 

    

    beforeEach(async function() { 
        this.contract = await StarNotary.new({from: accounts[0]})
    })
    
    
    describe('can create a star with createStar()', () => { 
        let starId = 1;
        let starName="Star power 103!";
        let starStory="I love my wonderful star";
        let dec="dec_032.155";
        let mag="mag_245.978";
        let cent="ra_032.155";

        //runs create before each test, testing createStar()
        beforeEach(async function() {
            await this.contract.createStar(starName, starId, starStory, dec, mag, cent, {from: accounts[0]})
        });

        //testing tokenIdToStarInfo() 
        it('can create a star and get its name, story, cent, dec, mag with tokenIdToStarInfo()', async function () { 
            this.contract.tokenIdToStarInfo(starId).then(
                result => assert.deepEqual(result, [starName,starStory,cent,dec,mag])
                )
            })

         //testing checkIfStarExist() function
            it('checkIfStarExist() return true with exisiting star',async function(){
                assert.equal(await this.contract.checkIfStarExist(dec,mag,cent), true);    
            });
        
        //uniqueness by coordinate expection
            it('expect rejection when creating star with same coordinate',async function(){
                await expectThrow(this.contract.createStar(starName, starId, starStory, dec, mag, cent, {from: accounts[0]}));
            });        

    })

    describe('buying and selling stars', () => { 
        
        let starName="awesome star!";
        let starStory="awesome story!";
        let dec="dec_032.155";
        let mag="mag_245.978";
        let cent="ra_032.155";
        let user1 = accounts[1]
        let user2 = accounts[2]
        let randomMaliciousUser = accounts[3]
        
        let starId = 1
        let starPrice = web3.toWei(.01, "ether")

        beforeEach(async function () { 
            await this.contract.createStar(starName, starId,starStory,dec,mag,cent, {from: user1})    
        })

        //testing putStarUpForSale(), ownerOf(), starsForSale()
        it('user1 can put up their star for sale, testing putStarUpForSale(), ownerOf(), starsForSale()', async function () { 
            assert.equal(await this.contract.ownerOf(starId), user1)
            await this.contract.putStarUpForSale(starId, starPrice, {from: user1})
            
            assert.equal(await this.contract.starsForSale(starId), starPrice)
        })

        describe('user2 can buy a star that was put up for sale', () => { 
            beforeEach(async function () { 
                await this.contract.putStarUpForSale(starId, starPrice, {from: user1})
            })
            //testing buyStar()
            it('user2 is the owner of the star after they buy it, testing buyStar()', async function() { 
                await this.contract.buyStar(starId, {from: user2, value: starPrice, gasPrice: 0})
                assert.equal(await this.contract.ownerOf(starId), user2)
            })

            it('user2 ether balance changed correctly, testing buyStar()', async function () { 
                let overpaidAmount = web3.toWei(.05, 'ether')
                const balanceBeforeTransaction = web3.eth.getBalance(user2)
                await this.contract.buyStar(starId, {from: user2, value: overpaidAmount, gasPrice: 0})
                const balanceAfterTransaction = web3.eth.getBalance(user2)

                assert.equal(balanceBeforeTransaction.sub(balanceAfterTransaction), starPrice)
            })
        })

        
    })

    //testing block for ERC721 functions mint approve safeTransferFrom SetApprovedForAll getApproved isApprovedForAll
    describe('testing ERC721 functions mint approve safeTransferFrom SetApprovedForAll getApproved isApprovedForAll',() => {
       
        var user1 = accounts[1]
        var user2 = accounts[2]
        var operator = accounts[3]
        describe('can create a token', () => { 
            let tokenId = 1
            let tx
    
            beforeEach(async function () { 
                tx = await this.contract.mint(tokenId, {from: user1})
            })
    
            it('ownerOf tokenId is user1', async function () { 
                assert.equal(await this.contract.ownerOf(tokenId), user1)
            })
    
            it('balanceOf user1 is incremented by 1', async function () { 
                let balance = await this.contract.balanceOf(user1)
    
                assert.equal(balance.toNumber(), 1)
            })
    
            it('emits the correct event during creation of a new token', async function () { 
                assert.equal(tx.logs[0].event, 'Transfer')
            })
        })
    
        describe('can transfer token', () => { 
            let tokenId = 1
            let tx 
    
            beforeEach(async function () { 
                await this.contract.mint(tokenId, {from: user1})
    
                tx = await this.contract.safeTransferFrom(user1, user2, tokenId, {from: user1})
            })
    
            it('token has new owner', async function () { 
                assert.equal(await this.contract.ownerOf(tokenId), user2)
            })
    
            it('emits the correct event during transfer', async function () { 
                assert.equal(tx.logs[0].event, 'Transfer')
            })
    
            it('only permissioned users can transfer tokens', async function() { 
                let randomPersonTryingToStealTokens = accounts[4]
    
                await expectThrow(this.contract.transferFrom(user1, randomPersonTryingToStealTokens, tokenId, {from: randomPersonTryingToStealTokens}))
            })
        })
    
        describe('can grant approval to transfer', () => { 
            let tokenId = 1
            let tx 
    
            beforeEach(async function () { 
                await this.contract.mint(tokenId, {from: user1})
                tx = await this.contract.approve(user2, tokenId, {from: user1})
            })
    
            it('set user2 as an approved address', async function () { 
                assert.equal(await this.contract.getApproved(tokenId), user2)
            })
    
            it('user2 can now transfer', async function () { 
                await this.contract.transferFrom(user1, user2, tokenId, {from: user2})
    
                assert.equal(await this.contract.ownerOf(tokenId), user2)
            })
    
            it('emits the correct event during approval', async function () { 
                assert.equal(tx.logs[0].event, 'Approval')
            })
        })
    
        describe('can set an operator', () => { 
            let tokenId = 1
            let tx 
    
            beforeEach(async function () { 
                await this.contract.mint(tokenId, {from: user1})
    
                tx = await this.contract.setApprovalForAll(operator, true, {from: user1})
            })
    
            it('can set an operator', async function () { 
                assert.equal(await this.contract.isApprovedForAll(user1, operator), true)
            })
        })
    })
});