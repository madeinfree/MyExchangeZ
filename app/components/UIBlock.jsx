import { useState, useEffect } from 'react'
import {
  useAccount,
  useProvider,
  useWaitForTransaction,
  useBalance,
  useSigner,
} from 'wagmi'
import { utils, Contract } from 'ethers'

import MyToken from '../abi/MyToken'
import MyExchange from '../abi/MyExchange'
import MultiSigGovernment from '../abi/MultiSigGovernment'
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
    case '/government':
      return '治理提案'
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
  const [governmentTx, setGovernmentTx] = useState([])
  const [submitTx, setSubmitTx] = useState({
    address: '0xad9C86241BF1f715cA4Cfa3bc39a07731D458A4A',
    fee: 0,
  })

  const [{ data: signer }] = useSigner()
  const [{ data: accountData }] = useAccount()
  const [{ data: ethBalance }] = useBalance({
    addressOrName: accountData?.address,
  })

  /**
   * ERC20
   */

  const [{ data: balance }, readBalance] = readContract({
    contract: window.ENV.CONTRACT_ADDRESS_ERC20,
    method: 'balanceOf',
    provider,
    abi: MyToken,
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

  const [{ data: LPbalance }, readLPBalance] = readContract({
    contract: window.ENV.CONTRACT_ADDRESS_EXCHANGE,
    method: 'balanceOf',
    provider,
    abi: MyExchange,
    args: accountData?.address,
  })

  const [{ data: fee }] = readContract({
    contract: window.ENV.CONTRACT_ADDRESS_EXCHANGE,
    method: 'fee',
    provider,
    abi: MyExchange,
  })

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

  /**
   * MultiSigGovernment
   */
  const [{ data: isOwner }, readIsOwner] = readContract({
    contract: window.ENV.CONTRACT_ADDRESS_GOVERNMENT,
    method: 'isOwner',
    provider,
    abi: MultiSigGovernment,
    args: [accountData?.address],
  })

  const [{ data: txCount }, readTxCount] = readContract({
    contract: window.ENV.CONTRACT_ADDRESS_GOVERNMENT,
    method: 'getTransactionCount',
    provider,
    abi: MultiSigGovernment,
  })

  const [{ data: submitTransactionResponse }, submitTransaction] =
    writeContract({
      contract: window.ENV.CONTRACT_ADDRESS_GOVERNMENT,
      method: 'submitTransaction',
      provider,
      abi: MultiSigGovernment,
      args: [submitTx.address, submitTx.fee],
    })

  const [{ loading: addLiquidityTxLoading }] = useWaitForTransaction({
    hash: addLiquidityTxResponse?.hash,
  })

  const [{ loading: removeLiquidityTxLoading }] = useWaitForTransaction({
    hash: removeLiquidityTxResponse?.hash,
  })

  const [{ loading: submitTransactionLoading }] = useWaitForTransaction({
    hash: submitTransactionResponse?.hash,
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
    readIsOwner()
    readTxCount()
  }, [accountData?.address, transactionLoading])

  useEffect(() => {
    const txCountNumber = txCount?.toNumber()
    if (txCountNumber > 0) {
      const multiSigGov = new Contract(
        window.ENV.CONTRACT_ADDRESS_GOVERNMENT,
        MultiSigGovernment,
        provider
      )
      const promises = []
      for (let i = 0; i < txCountNumber; i++) {
        promises.push(
          new Promise((resolve, reject) => {
            multiSigGov
              .getTransaction(utils.solidityPack(['uint256'], [i]))
              .then((r) =>
                resolve({
                  fee: r.fee.toNumber(),
                  executed: r.executed,
                  numConfirmations: r.numConfirmations.toNumber(),
                })
              )
              .catch((err) => console.log(err))
          })
        )
      }
      Promise.all(promises).then((results) => {
        setGovernmentTx(results)
      })
    }
  }, [txCount])

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
                交易所 {symbol} 餘額{' '}
                {balanceOfExchange ? formatEther(balanceOfExchange) : 0.0}{' '}
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
                <span className="input-group-text">
                  {fee
                    ? Number(1 - fee.toNumber() / 1000).toFixed(3) * 100 + '%'
                    : 0}
                </span>
              </div>
            </div>
          ) : null}

          {router === '/government' ? (
            <div>
              <div style={{ textAlign: 'center' }}>
                進行中提案({txCount ? txCount.toNumber() : 0})
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">手續費用</th>
                      <th scope="col">執行狀態</th>
                      <th scope="col">簽署人數</th>
                      <th scope="col">功能</th>
                    </tr>
                  </thead>
                  <tbody
                    style={{
                      verticalAlign: 'middle',
                      textAlign: 'center',
                    }}
                  >
                    {governmentTx.length
                      ? governmentTx.map((tx, index) => {
                          return (
                            <tr key={index}>
                              <th scope="row">{index}</th>
                              <td>{tx.fee}</td>
                              <td>
                                {tx.executed ? (
                                  '已執行'
                                ) : tx.numConfirmations >= 2 ? (
                                  <button
                                    className="btn btn-warning btn-sm"
                                    disabled={!isOwner}
                                    onClick={() => {
                                      const multiSigGov = new Contract(
                                        window.ENV.CONTRACT_ADDRESS_GOVERNMENT,
                                        MultiSigGovernment,
                                        signer
                                      )
                                      multiSigGov.executeTransaction(index)
                                    }}
                                  >
                                    開始執行
                                  </button>
                                ) : (
                                  '尚可執行'
                                )}
                              </td>
                              <td>{tx.numConfirmations}</td>
                              <td>
                                {tx.executed ? (
                                  '已結束'
                                ) : (
                                  <button
                                    disabled={!isOwner}
                                    className="btn btn-primary btn-dark btn-sm"
                                    onClick={() => {
                                      const multiSigGov = new Contract(
                                        window.ENV.CONTRACT_ADDRESS_GOVERNMENT,
                                        MultiSigGovernment,
                                        signer
                                      )
                                      multiSigGov.confirmTransaction(index)
                                    }}
                                  >
                                    執行簽署
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      : null}
                  </tbody>
                </table>
              </div>
              <br />
              <div
                style={{
                  padding: 20,
                  border: '1px solid #ccc',
                  borderRadius: 5,
                  textAlign: 'center',
                }}
              >
                <div className="input-group mb-3">
                  <span className="input-group-text" id="eth">
                    配對合約
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="合約地址"
                    disabled={true}
                    value={submitTx.address}
                  />
                </div>
                <div className="input-group">
                  <span className="input-group-text" id="eth">
                    手續費
                  </span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="手續費用調整"
                    disabled={!accountData}
                    value={submitTx.fee}
                    onChange={(e) =>
                      setSubmitTx({
                        ...submitTx,
                        fee: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <br />
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
                )) ||
                (router === '/government' &&
                  (isOwner ? (
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={
                        submitTx.address === '' ||
                        submitTx.fee <= 0 ||
                        submitTransactionLoading
                      }
                      onClick={() => {
                        submitTransaction()
                      }}
                    >
                      送出提案
                    </button>
                  ) : null))
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
