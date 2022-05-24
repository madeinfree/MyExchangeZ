import { useContractRead, useContractWrite } from 'wagmi'

export function readContract({ contract, method, abi, provider, args }) {
  return useContractRead(
    {
      addressOrName: contract,
      contractInterface: abi,
      signerOrProvider: provider,
    },
    method,
    {
      args,
    }
  )
}

export function writeContract({
  contract,
  method,
  abi,
  provider,
  args,
  overrides,
}) {
  return useContractWrite(
    {
      addressOrName: contract,
      contractInterface: abi,
      signerOrProvider: provider,
    },
    method,
    {
      args,
      overrides,
    }
  )
}
