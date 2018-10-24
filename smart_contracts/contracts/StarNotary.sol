pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract StarNotary is ERC721 { 

    struct Star { 
        string name;
        string starStory;
        string cent;
        string dec;
        string mag;
        
    }

    mapping(uint256 => Star) public tokenIdToStarInfo; 
    mapping(uint256 => uint256) public starsForSale;
    // hashed coordinate mapping for uniqueness check
    mapping(bytes32 => bool) public coorHashToTokenId;

    function createStar(string _name, uint256 _tokenId, string _starStory, string _dec, string _mag, string _cent) public { 
        // hashed coordinate mapping for uniqueness check
        bytes32 starHash = keccak256(abi.encodePacked(_dec,_mag,_cent));
        
        require(!coorHashToTokenId[starHash],"star with same coordinate was created");
        //create star
        Star memory newStar = Star({name: _name, starStory: _starStory, cent:_cent, dec: _dec, mag:_mag});
        coorHashToTokenId[starHash] = true;
        tokenIdToStarInfo[_tokenId] = newStar;
        _mint(msg.sender, _tokenId);
    }

    function putStarUpForSale(uint256 _tokenId, uint256 _price) public { 
        require(this.ownerOf(_tokenId) == msg.sender);

        starsForSale[_tokenId] = _price;
    }

    function buyStar(uint256 _tokenId) public payable { 
        require(starsForSale[_tokenId] > 0);
        
        uint256 starCost = starsForSale[_tokenId];
        address starOwner = this.ownerOf(_tokenId);
        require(msg.value >= starCost);

        _removeTokenFrom(starOwner, _tokenId);
        _addTokenTo(msg.sender, _tokenId);
        
        starOwner.transfer(starCost);

        if(msg.value > starCost) { 
            msg.sender.transfer(msg.value - starCost);
        }
    }

    function checkIfStarExist(string _dec, string _mag, string _cent) public view returns (bool){
        bytes32 starHash = keccak256(abi.encodePacked(_dec,_mag,_cent));
        return coorHashToTokenId[starHash];
    }

    function mint(uint256 _tokenId) public{
        _mint(msg.sender, _tokenId);
    }

}