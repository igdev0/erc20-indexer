import {useCallback, useContext, useState} from 'react';
import {ethers, isAddress} from 'ethers';
import {BsSearch} from 'react-icons/bs';
import {AppContext} from './context.js';
import {BigNumber} from 'alchemy-sdk';
import {TiTimes} from 'react-icons/ti';
import {BiWallet} from 'react-icons/bi';

function App() {
    const {provider, alchemy} = useContext(AppContext)
    const [userAddress, setUserAddress] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);


    const getTokenBalance = useCallback(async () => {
        setError("");
        let address = userAddress;

        if (!isAddress(address)) {
            try {
                address = await provider.resolveName(address);
                if (!address) {
                    setError("Address you provided is invalid");
                    setIsFetching(false);
                    return;
                }
            } catch (err) {
                setError("Unable to resolve ens");
                setIsFetching(false);
                return;
            }
        }
        setIsFetching(true);
        let tokenBalancesResponseErc20 = await alchemy.core.getTokenBalances(address);
        const tokenBalancesMetadata = await Promise.all(tokenBalancesResponseErc20.tokenBalances.map(token => alchemy.core.getTokenMetadata(token.contractAddress)));
        tokenBalancesResponseErc20 = tokenBalancesResponseErc20.tokenBalances.map((token, index) => {
            const raw = BigNumber.from(token.tokenBalance);
            return {
                ...token,
                tokenBalance: ethers.formatUnits(raw.toString(), tokenBalancesMetadata[index].decimals),
                metadata: {
                    ...tokenBalancesMetadata[index],
                }
            }
        });
        setResults(tokenBalancesResponseErc20);
        setIsFetching(false);
    }, [userAddress]);

    async function signIn() {
        setError("");
        try {
            const [from] = await provider.send("eth_requestAccounts", []);
            const nonce = Math.random() * Math.pow(10, 81);
            const message = `Signing in with account nonce: ${nonce}`;
            const msg = `0x${Buffer.from(message, "utf8").toString("hex")}`;
            const signature = await provider.send("personal_sign", [msg, from]);
            const valid = ethers.verifyMessage(message, signature);
            if (valid.toLowerCase() === from) {
                setUserAddress(from);
                const timer = setTimeout(() => {
                    getTokenBalance();
                    clearTimeout(timer);
                }, 0) // needs to wait for a second so react can update the state
            }

        } catch (err) {
            setError(err.message);
            console.error(err);
        }
    }

    return (
        <div
            className="w-full h-screen border-30 border-amber-200 flex justify-center p-2 overflow-auto items-center flex-col">
            <div className="text-center w-full max-w-[440px] mx-auto">
                <button className="btn btn--pill btn--primary inline-flex justify-between gap-2 items-center self-center" onClick={signIn}>
                    Sign in with your wallet <BiWallet/>
                </button>
                <h4 className="text-3xl my-4">Or type the address/ENS</h4>
                <fieldset className="flex justify-center">
                    <input
                        className={`border-l-2 border-t-2 border-b-2 ${!userAddress.length || isFetching ? 'border-gray-300' : 'border-amber-400'} rounded-l-sm p-2 max-w-[400px] w-full outline-none`}
                        value={userAddress}
                        onChange={e => setUserAddress(e.currentTarget.value)}
                        placeholder="e.g: 0x1D790d6D38a5ADB6312E86b8cCC365100f7d3F89"/>
                    <button disabled={!userAddress.length || isFetching}
                            type="button"
                            onClick={getTokenBalance}
                            className="p-2 bg-amber-400 disabled:bg-gray-300 rounded-r-sm"><BsSearch
                        className="fill-white" size={25}/></button>
                </fieldset>
            </div>
            {error && <div className="absolute top-2 w-[400px] p-2 left-0 right-0 mx-auto bg-red-400 rounded-sm">{error}
                <TiTimes
                    className="fill-white absolute right-1 top-0 cursor-pointer" onClick={() => setError(null)}
                    size={30}/>
            </div>}

            <div className="flex flex-col gap-2 mt-2 relative min-h-[100px] max-w-[440px] w-full mx-auto">
                {
                    isFetching && <div
                        className="absolute top-0 right-0 left-0 bottom-0 h-full w-full flex justify-center items-center bg-[rgba(255,255,255,.5)] gap-2">
                        <div
                            className="border-l-4 border-t-4 border-r-2 border-r-transparent border-green-500 w-[30px] aspect-square rounded-full animate-spin"/>
                        <span>Loading ...</span>
                    </div>
                }
                {
                    results.map((token) => {
                        return (
                            <div
                                className="flex shadow-md border-1 border-gray-300 p-2 gap-2 justify-between items-center"
                                key={token.contractAddress}>
                                <div>
                                    <img src={token.metadata.logo} alt={token.metadata.symbol} width={30} height={30}/>
                                </div>
                                <span>
                                {token.metadata.name}
                            </span>
                                <div className="gap-1 flex">
                                <span>
                                    {token.tokenBalance}
                                </span>
                                    <span className="font-bold">${token.metadata.symbol}</span>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        </div>
    );
}

export default App;
