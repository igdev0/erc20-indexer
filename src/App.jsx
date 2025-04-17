import {Alchemy, Network, Utils} from 'alchemy-sdk';
import { useState } from 'react';
import {ethers} from 'ethers';
import {isAddress} from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
function App() {
  const [userAddress, setUserAddress] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [error, setError] = useState(null);
  async function getTokenBalance(argAddr) {
    setError("");
    let address = argAddr ? argAddr : userAddress;

    if(!isAddress(address)) {
      try {
        address = await provider.resolveName(address);
        if(!address) {
          setError("Unable to resolve ens");
          setIsFetching(false);
          return;
        }
      } catch (err) {
        setError("Unable to resolve ens");
        setIsFetching(false);
        return;
      }
    }
    const config = {
      apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
      network: Network.ETH_SEPOLIA,
    };

    setIsFetching(true);
    const alchemy = new Alchemy(config);
    const data = await alchemy.core.getTokenBalances(address);

    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(
        data.tokenBalances[i].contractAddress
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
    setIsFetching(false);
  }

  async function signIn() {
    setError("");
    try {
      const [from] = await provider.send("eth_requestAccounts", []);

      const nonce = Math.random() * Math.pow(10, 81);
      const message = `Signing in with account nonce: ${nonce}`;
      const msg = `0x${Buffer.from(message, "utf8").toString("hex")}`;

      const signature = await provider.send("personal_sign", [msg, from]);
      const valid = ethers.utils.verifyMessage(message, signature);
      if(valid.toLowerCase() === from) {
        setUserAddress(from);
        await getTokenBalance(from);
      }
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  }

  return (
    <div>
      <h1 className="text-4xl">Hello</h1>
    </div>
  );
}

export default App;
