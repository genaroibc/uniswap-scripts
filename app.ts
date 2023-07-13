const abi =
  '[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]'

import {
  ChainId,
  Fetcher,
  Percent,
  Route,
  Token,
  TokenAmount,
  Trade,
  TradeType,
  WETH
} from "@uniswap/sdk"
import * as IUniswapV2Router from "@uniswap/v2-periphery/build/IUniswapV2Router02.json"
import { Wallet, ethers, getDefaultProvider } from "ethers"

const UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"

const tokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
const tokenDecimals = 18
const chainId = ChainId.MAINNET
const tokenSymbol = "DAI"
const tokenName = "Dai Stablecoin"

const DAI = new Token(
  chainId,
  tokenAddress,
  tokenDecimals,
  tokenSymbol,
  tokenName
)

const trade = async () => {
  const provider = getDefaultProvider("mainnet")
  const signer = new Wallet(process.env.LOCAL_WALLET_PRIVATE_KEY, provider)

  const contract = new ethers.Contract(
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    abi,
    provider
  )
  const balance = await contract.balanceOf(signer.address)

  console.log(ethers.formatUnits(balance, 8))

  const amount = new TokenAmount(WETH[DAI.chainId], "1000000000000000000")

  const pair = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId])
  const route = new Route([pair], WETH[DAI.chainId], DAI)
  const trade = new Trade(route, amount, TradeType.EXACT_INPUT)

  const slippageTolerance = new Percent("50", "10000") // 50 bips, or 0.05%
  const minimumAmountOut = trade.minimumAmountOut(slippageTolerance).raw // converted to e.g. hex
  const path = [WETH[DAI.chainId].address, DAI.address]
  const to = "0xbA466330576a6BE1Fd87edB17887d4362D0D5e39" // should be a checksummed recipient address
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
  const value = trade.inputAmount.raw // converted to hex

  // console.log({ pair, route, trade })

  const UniswapRouter = new ethers.Contract(
    UNISWAP_ROUTER_ADDRESS,
    IUniswapV2Router.abi,
    signer
  )

  console.log({
    path,
    to,
    deadline
  })

  return UniswapRouter.swapExactETHForTokens(
    "50000000000000000",
    path,
    to,
    deadline,
    { value: "50000000000000000", gasPrice: 20e9 }
  )
}

trade().then(console.log).catch(console.log)

// executeTransaction({

// })
// this is the function we want to call
// we can call it using ethers.js or web3.js
// function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
//   external
//   payable
//   returns (uint[] memory amounts);

// console.log(`Average price for 1 ETH: ${route.midPrice.toSignificant(6)} DAI`)
// console.log(
//   `Average price for 1 DAI: ${route.midPrice.invert().toSignificant(6)} ETH`
// )

// console.log(
//   `Execution price (affected by amount) for 1 ETH: ${trade.executionPrice.toSignificant(
//     6
//   )} DAI`
// )
// console.log(
//   `Execution price (affected by amount) for 1 DAI: ${trade.executionPrice
//     .invert()
//     .toSignificant(6)} ETH`
// )
