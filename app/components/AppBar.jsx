import { useAccount } from 'wagmi'
import ConnectorButton from '../components/ConnectorButton.jsx'

export default function AppBar({ setRouter }) {
  const [{ data: accountData }, disconnect] = useAccount()
  return (
    <div
      style={{
        backgroundColor: '#ccc',
        padding: 14,
        height: 60,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 20,
        }}
      >
        <div style={{ cursor: 'pointer' }}>MyToken Exchange</div>
        <div style={{ cursor: 'pointer' }} onClick={() => setRouter('/swap')}>
          兌換代幣
        </div>
        <div
          style={{ cursor: 'pointer' }}
          onClick={() => setRouter('/addLiquidity')}
        >
          添加流動性
        </div>
        <div
          style={{ cursor: 'pointer' }}
          onClick={() => setRouter('/removeLiquidity')}
        >
          流動性管理
        </div>
        <div
          style={{ cursor: 'pointer' }}
          onClick={() => setRouter('/government')}
        >
          治理提案
        </div>
      </div>
      <div>
        {accountData?.address ? (
          <div
            style={{ cursor: 'pointer' }}
            key={accountData.address}
            onClick={disconnect}
          >
            {accountData.ens ? accountData.ens.name : accountData.address}
          </div>
        ) : (
          <ConnectorButton />
        )}
      </div>
    </div>
  )
}
