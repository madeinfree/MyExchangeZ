import { useState, useEffect } from 'react'
import {
  useAccount,
  useProvider,
  useWaitForTransaction,
  useBalance,
} from 'wagmi'
import { utils } from 'ethers'

import MyToken from '../abi/MyToken'
import MyExchange from '../abi/MyExchange'
import { readContract, writeContract } from '../utils/contract/helper'

import ConnectorButton from './ConnectorButton'

const formatEther = (amount) => utils.formatEther(amount)
const parseEther = (amount) => utils.parseEther(amount)
const formatRouterName = (router) => {
  switch (router) {
    case '/swap':
      return '兌換代幣'
    case '/addLiquidity':
      return '添加流動性'
    case '/removeLiquidity':
      return '移除流動性'
  }
}
const formatBtnActionName = (router) => {
  switch (router) {
    case '/swap':
      return '兌換代幣'
    case '/addLiquidity':
      return '添加流動性'
    case '/removeLiquidity':
      return '移除流動性'
  }
}

export default function UIBlock({ router }) {
  const provider = useProvider()
  const [inputETH, setInputETH] = useState(0)
  const [inputToken, setInputToken] = useState(0)
  const [{ data: accountData }] = useAccount()
  const [{ data: ethBalance }] = useBalance({
    addressOrName: accountData?.address,
  })

  const [{ data: balance }, readBalance] = readContract({
    contract: window.ENV.CONTRACT_ADDRESS_ERC20,
    method: 'balanceOf',
    provider,
    abi: MyToken,
    args: accountData?.address,
  })

  const [{ data: LPbalance }, readLPBalance] = readContract({
    contract: window.ENV.CONTRACT_ADDRESS_EXCHANGE,
    method: 'balanceOf',
    provider,
    abi: MyExchange,
    args: accountData?.address,
  })

  const [{ data: balanceOfExchange }, readBalanceOfExchange] = readContract({
    contract: window.ENV.CONTRACT_ADDRESS_ERC20,
    method: 'balanceOf',
    provider,
    abi: MyToken,
    args: window.ENV.CONTRACT_ADDRESS_EXCHANGE,
  })

  const [{ data: symbol }] = readContract({
    contract: window.ENV.CONTRACT_ADDRESS_ERC20,
    method: 'symbol',
    provider,
    abi: MyToken,
  })

  const [{ data: allowence }, readAllowence] = readContract({
    contract: window.ENV.CONTRACT_ADDRESS_ERC20,
    method: 'allowance',
    provider,
    abi: MyToken,
    args: [accountData?.address, window.ENV.CONTRACT_ADDRESS_EXCHANGE],
  })

  /**
   * ERC20
   */

  const [{ data: transactionResponse }, approveToken] = writeContract({
    contract: window.ENV.CONTRACT_ADDRESS_ERC20,
    method: 'approve',
    provider,
    abi: MyToken,
    args: [
      window.ENV.CONTRACT_ADDRESS_EXCHANGE,
      inputToken ? parseEther(inputToken.toString()) : 0,
    ],
  })

  /**
   * Exchange
   */

  const [{ data: addLiquidityTxResponse }, addLiquidity] = writeContract({
    contract: window.ENV.CONTRACT_ADDRESS_EXCHANGE,
    method: 'addLiquidity',
    provider,
    abi: MyExchange,
    args: [parseEther('0'), inputToken ? parseEther(inputToken.toString()) : 0],
    overrides: {
      value: inputETH ? parseEther(inputETH.toString()) : 0,
    },
  })

  const [{ data: removeLiquidityTxResponse }, removeLiquidity] = writeContract({
    contract: window.ENV.CONTRACT_ADDRESS_EXCHANGE,
    method: 'removeLiquidity',
    provider,
    abi: MyExchange,
    args: [LPbalance ? LPbalance : 0, 1, 1],
  })

  const [{ data: ethToTokenTransferInputTxResponse }, ethToTokenTransferInput] =
    writeContract({
      contract: window.ENV.CONTRACT_ADDRESS_EXCHANGE,
      method: 'ethToTokenTransferInput',
      provider,
      abi: MyExchange,
      args: [0],
      overrides: {
        value: inputETH ? parseEther(inputETH.toString()) : 0,
      },
    })

  const [{ loading: addLiquidityTxLoading }] = useWaitForTransaction({
    hash: addLiquidityTxResponse?.hash,
  })

  const [{ loading: removeLiquidityTxLoading }] = useWaitForTransaction({
    hash: removeLiquidityTxResponse?.hash,
  })

  const [{ loading: ethToTokenTransferInputTxLoading }] = useWaitForTransaction(
    {
      hash: ethToTokenTransferInputTxResponse?.hash,
    }
  )

  const [{ data: transactionData, loading: transactionLoading }] =
    useWaitForTransaction({
      hash: transactionResponse?.hash,
    })

  useEffect(() => {
    if (transactionLoading) return
    readBalance()
    readBalanceOfExchange()
    readAllowence()
    readLPBalance()
  }, [accountData?.address, transactionLoading])

  return (
    <div
      style={{
        padding: 14,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          padding: 24,
        }}
      >
        <div style={{ textAlign: 'center' }}>{formatRouterName(router)}</div>
        <br />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {router === '/addLiquidity' ? (
            <div>
              <div className="input-group mb-3">
                <span className="input-group-text" id="eth">
                  <img
                    width="12"
                    src="https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=022"
                  />
                </span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="數量"
                  disabled={!accountData}
                  onChange={(e) => setInputETH(Number(e.target.value))}
                />
                <span className="input-group-text">
                  {ethBalance
                    ? Number(formatEther(ethBalance.value)).toFixed(3)
                    : '0.0'}
                </span>
              </div>
              <div className="input-group mb-3">
                <span className="input-group-text" id="token">
                  {symbol}
                </span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="數量"
                  disabled={!accountData}
                  onChange={(e) => setInputToken(Number(e.target.value))}
                />
                <span className="input-group-text">
                  {balance ? formatEther(balance) : '0.0'}
                </span>
                <span className="input-group-text">
                  {allowence ? formatEther(allowence) : '0.0'}
                </span>
                <span className="input-group-text">
                  {LPbalance ? formatEther(LPbalance) : '0.0'}
                </span>
              </div>
            </div>
          ) : null}

          {router === '/removeLiquidity' ? (
            <div>
              <div>
                總提供流動性份額 {LPbalance ? formatEther(LPbalance) : '0.0'}
              </div>
              <br />
            </div>
          ) : null}

          {router === '/swap' ? (
            <div>
              <div>
                交易所{symbol} 餘額{' '}
                {balanceOfExchange ? formatEther(balanceOfExchange) : 0.0}
              </div>
              <div className="input-group mb-3">
                <span className="input-group-text" id="eth">
                  <img
                    width="12"
                    src="https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=022"
                  />
                </span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="數量"
                  disabled={!accountData}
                  onChange={(e) => setInputETH(Number(e.target.value))}
                />
                <span className="input-group-text">
                  {ethBalance
                    ? Number(formatEther(ethBalance.value)).toFixed(3)
                    : '0.0'}
                </span>
              </div>
            </div>
          ) : null}

          {accountData ? (
            allowence ? (
              Number(formatEther(allowence)) === 0 &&
              router === '/addLiquidity' ? (
                <button
                  className="btn btn-dark btn-sm"
                  disabled={
                    inputToken === 0 ||
                    inputToken > formatEther(balance) ||
                    transactionLoading
                  }
                  onClick={() => approveToken()}
                >
                  {transactionLoading ? `授權中...` : `授權 ${symbol} 代幣`}
                </button>
              ) : (
                (router === '/addLiquidity' && (
                  <button
                    className="btn btn-dark btn-sm"
                    disabled={
                      inputETH === 0 ||
                      inputETH > formatEther(ethBalance.value) ||
                      inputToken === 0 ||
                      inputToken > formatEther(balance) ||
                      addLiquidityTxLoading
                    }
                    onClick={() => {
                      addLiquidity()
                    }}
                  >
                    {formatBtnActionName(router)}
                  </button>
                )) ||
                (router === '/removeLiquidity' && (
                  <button
                    className="btn btn-dark btn-sm"
                    disabled={
                      Number(formatEther(LPbalance)) === 0 ||
                      removeLiquidityTxLoading
                    }
                    onClick={() => {
                      removeLiquidity()
                    }}
                  >
                    {formatBtnActionName(router)}
                  </button>
                )) ||
                (router === '/swap' && (
                  <button
                    className="btn btn-dark btn-sm"
                    disabled={
                      inputETH === 0 ||
                      inputETH > formatEther(ethBalance.value) ||
                      ethToTokenTransferInputTxLoading
                    }
                    onClick={() => {
                      ethToTokenTransferInput()
                    }}
                  >
                    {formatBtnActionName(router)}
                  </button>
                ))
              )
            ) : (
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            )
          ) : (
            <ConnectorButton customText="請先連接錢包" />
          )}
        </div>
      </div>
    </div>
  )
}
