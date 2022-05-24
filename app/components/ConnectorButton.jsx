import { useConnect } from 'wagmi'

export default function ConnectorButton({ customText }) {
  const [{ data: connectData }, connect] = useConnect({ fetchEns: true })

  return connectData.connectors.map((connector) => (
    <button
      className="btn btn-primary btn-sm"
      key={connector.id}
      onClick={() => connect(connector)}
    >
      {customText || '連接錢包'}
    </button>
  ))
}
