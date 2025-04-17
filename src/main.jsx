import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import "./index.css"
import {AppContext} from './context.js';
import {ethers} from 'ethers';
import {Alchemy, Network} from 'alchemy-sdk';

const config = {
    apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
}

const alchemy = new Alchemy(config);

const provider = new ethers.BrowserProvider(window.ethereum);
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AppContext.Provider value={{provider, alchemy}}>
            <App/>
        </AppContext.Provider>
    </React.StrictMode>,
)
