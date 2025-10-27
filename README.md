# Poster dApp - Decentralized Guestbook

A simple decentralized guestbook application built on Ethereum Sepolia testnet.

## Project Structure

- `poster-contract/` - Smart contracts (Solidity + Truffle)
- `poster-ui/` - Frontend dApp (Next.js + Web3.js)

## Features

- ✅ Connect Ethereum wallet (MetaMask)
- ✅ Post messages to blockchain
- ✅ View all posts with author addresses
- ✅ Filter posts by tags
- ✅ Real-time updates

## Smart Contract

**Poster.sol** - Simple contract for posting messages:
```solidity
event NewPost(address indexed user, string content, string indexed tag);
function post(string memory content, string memory tag) public;
