import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid, Spinner,
  Text,
} from '@chakra-ui/react';
import {Alchemy, Network, Utils} from 'alchemy-sdk';
import { useState } from 'react';
import {ethers} from 'ethers';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);

  async function getTokenBalance(address = userAddress) {
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
    const provider = new ethers.providers.Web3Provider(window.ethereum);
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
      console.error(err);
    }
  }

  return (
    <Box w="100vw">
      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Heading mb={0} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>
            Plug in an address and this website will return all of its ERC-20
            token balances!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={42}>
          Get all the ERC-20 token balances of this address:
        </Heading>
        <Button variant="outline" onClick={signIn}>Connect wallet</Button>
        <Heading mt={2}>Or</Heading>
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          value={userAddress}
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        <Button fontSize={20} onClick={getTokenBalance} mt={36} bgColor="skyblue">
          Check ERC-20 Token Balances
        </Button>
        <Heading my={36}>ERC-20 token balances:</Heading>
        {isFetching && <Spinner color="teal.500" size="lg" />}
        {hasQueried ? (
          <SimpleGrid w={'90vw'} columns={4} spacing={24}>
            {results.tokenBalances.map((e, i) => {
              return (
                <Flex
                  flexDir={'column'}
                  color="white"
                  p={10}
                  bg="skyblue"
                  w={'20vw'}
                  key={i}
                >
                  <Box>
                    <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                  </Box>
                  <Box>
                    <b>Balance:</b>&nbsp;
                    {Utils.formatUnits(
                      e.tokenBalance,
                      tokenDataObjects[i].decimals
                    )}
                  </Box>
                  <Image src={tokenDataObjects[i].logo} />
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : (
          'Please make a query! This may take a few seconds...'
        )}
      </Flex>
    </Box>
  );
}

export default App;
