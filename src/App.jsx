import {Alchemy, Network} from 'alchemy-sdk';
import {useState} from 'react';
import {ethers, isAddress} from 'ethers';
import {BsSearch} from 'react-icons/bs';

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

        if (!isAddress(address)) {
            try {
                address = await provider.resolveName(address);
                if (!address) {
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
            if (valid.toLowerCase() === from) {
                setUserAddress(from);
                await getTokenBalance(from);
            }
        } catch (err) {
            setError(err.message);
            console.error(err);
        }
    }

    return (
        <div className="w-full h-screen border-30 border-amber-300 flex justify-center p-2 overflow-auto items-center">
            <div className="text-center w-full">
                <button className="btn btn--pill btn--primary">
                    Sign in with your wallet
                </button>
                <h4 className="text-3xl my-4">Or type the address/ENS</h4>
                <fieldset className="flex justify-center">
                    <input
                        className={`border-l-2 border-t-2 border-b-2 ${!userAddress.length ? 'border-gray-300' : 'border-amber-400'} rounded-l-sm p-2 max-w-[400px] w-full outline-none`}
                        value={userAddress}
                        onChange={e => setUserAddress(e.currentTarget.value)}
                        placeholder="e.g: 0x1D790d6D38a5ADB6312E86b8cCC365100f7d3F89"/>
                    <button disabled={!userAddress.length}
                            className="p-2 bg-amber-400 disabled:bg-gray-300 rounded-r-sm"><BsSearch
                        className="fill-white" size={25}/></button>
                </fieldset>
            </div>
        </div>
    );
}

export default App;
