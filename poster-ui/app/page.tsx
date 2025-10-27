'use client';

import {useState, useEffect} from "react";
import Web3 from "web3";
import { PosterABI } from '../utils/contractABI';

// ЗАМЕНИТЕ на адрес вашего контракта после деплоя
const CONTRACT_ADDRESS = "0xC1911439d81d4f7A1fE0eb17415E4f52606C09ac";

const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 в hex
const SEPOLIA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

export default function Home() {
  const [web3, setWeb3] = useState(undefined);
  const [userAddress, setUserAddress] = useState(undefined);
  const [contract, setContract] = useState(undefined);
  const [posts, setPosts] = useState([]);
  const [filterTag, setFilterTag] = useState('');
  const [newPost, setNewPost] = useState({ content: '', tag: '' });
  const [loading, setLoading] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // Проверка сети
  const checkNetwork = async () => {
    if (typeof window.ethereum === 'undefined') return false;
    
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const correct = chainId === SEPOLIA_CHAIN_ID;
    setIsCorrectNetwork(correct);
    return correct;
  };

  // Переключение на Sepolia
  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (error) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: SEPOLIA_CHAIN_ID,
            chainName: 'Sepolia Test Network',
            rpcUrls: [SEPOLIA_RPC_URL],
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18
            },
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        });
      }
    }
  };

  const handleConnect = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!');
      return;
    }

    try {
      // Проверяем и переключаем сеть если нужно
      const isCorrect = await checkNetwork();
      if (!isCorrect) {
        await switchToSepolia();
        // После переключения даем время на изменение сети
        setTimeout(async () => {
          await checkNetwork();
        }, 1000);
        return;
      }

      const web3Instance = new Web3(window.ethereum);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const contractInstance = new web3Instance.eth.Contract(PosterABI, CONTRACT_ADDRESS);
      
      setWeb3(web3Instance);
      setUserAddress(accounts[0]);
      setContract(contractInstance);
      
      await loadPosts(contractInstance);
    } catch (error) {
      console.error('Connection error:', error);
      alert('Error connecting to wallet: ' + error.message);
    }
  };

  // Загрузка постов
  const loadPosts = async (contractInstance = contract) => {
    if (!contractInstance) return;

    try {
      const events = await contractInstance.getPastEvents('NewPost', {
        fromBlock: 0,
        toBlock: 'latest'
      });

      const postsData = events.map(event => ({
        user: event.returnValues.user,
        content: event.returnValues.content,
        tag: event.returnValues.tag,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      }));

      setPosts(postsData.reverse());
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  // Создание поста
  const handlePost = async () => {
    if (!contract || !newPost.content || !newPost.tag) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await contract.methods.post(newPost.content, newPost.tag).send({
        from: userAddress
      });

      setNewPost({ content: '', tag: '' });
      await loadPosts();
      alert('Post created successfully!');
    } catch (error) {
      console.error('Error posting:', error);
      alert('Error creating post: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация
  const filteredPosts = filterTag 
    ? posts.filter(post => {
        const filterTagHash = Web3.utils.keccak256(filterTag);
        return post.tag.toLowerCase() === filterTagHash.toLowerCase();
      })
    : posts;

  // Слушаем изменения сети
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return;

    checkNetwork();

    window.ethereum.on('chainChanged', (chainId) => {
      setIsCorrectNetwork(chainId === SEPOLIA_CHAIN_ID);
      if (chainId === SEPOLIA_CHAIN_ID) {
        window.location.reload();
      }
    });

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>📝 Poster dApp - Sepolia Testnet</h1>
      
      {!userAddress ? (
        <div>
          <button 
            onClick={handleConnect}
            style={{ padding: '10px 20px', fontSize: '16px' }}
          >
            Connect Wallet
          </button>
          {!isCorrectNetwork && userAddress && (
            <p style={{ color: 'orange', marginTop: '10px' }}>
              Please switch to Sepolia Testnet
            </p>
          )}
        </div>
      ) : !isCorrectNetwork ? (
        <div>
          <p style={{ color: 'red' }}>Wrong network. Please switch to Sepolia Testnet</p>
          <button onClick={switchToSepolia}>Switch to Sepolia</button>
        </div>
      ) : (
        <div>
          <p><strong>Connected to Sepolia:</strong> {userAddress}</p>
          
          {/* Форма создания поста */}
          <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #ccc' }}>
            <h3>Create New Post</h3>
            <textarea
              placeholder="Enter your message..."
              value={newPost.content}
              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
              style={{ width: '100%', height: '80px', marginBottom: '10px' }}
            />
            <input
              type="text"
              placeholder="Tag (e.g., general, news, fun)"
              value={newPost.tag}
              onChange={(e) => setNewPost({...newPost, tag: e.target.value})}
              style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            />
            <button 
              onClick={handlePost} 
              disabled={loading}
              style={{ padding: '10px 20px' }}
            >
              {loading ? 'Posting...' : 'Post Message'}
            </button>
          </div>

          {/* Фильтр и посты */}
          <div style={{ margin: '20px 0' }}>
            <input
              type="text"
              placeholder="Filter by tag..."
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div>
            <h3>Posts {filterTag && `(filtered by: ${filterTag})`}</h3>
            {filteredPosts.map((post, index) => (
              <div key={index} style={{ border: '1px solid #eee', padding: '15px', margin: '10px 0' }}>
                <p><strong>Message:</strong> {post.content}</p>
                <p><strong>Tag:</strong> {post.tag}</p>
                <p><strong>Author:</strong> {post.user}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
