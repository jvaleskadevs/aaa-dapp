import { CustomSimpleSmartAccountOwner } from "@/libs/CustomSimpleSmartContractAccount";
import { useCallback } from "react";
import { toHex } from "viem";
import { useWalletClient } from "wagmi";

type CustomSimpleSmartAccountOwnerResult =
  | {
      isLoading: false;
      owner: SimpleSmartAccountOwner;
    }
  | {
      isLoading: true;
      owner: undefined;
    };

export function useCustomAccountOwner(): CustomSimpleSmartAccountOwnerResult {
  const walletClientQuery = useWalletClient();
  // We need this to by pass a viem bug https://github.com/wagmi-dev/viem/issues/606
  const signMessage = useCallback(
    (data: string | Uint8Array) =>
      walletClientQuery.data!.request({
        // ignore the type error here, it's a bug in the viem typing
        // @ts-ignore
        method: "personal_sign",
        // @ts-ignore
        params: [toHex(data), walletClientQuery.data.account.address],
      }),
    [walletClientQuery.data]
  );
  const getAddress = useCallback(
    () => Promise.resolve(walletClientQuery.data!.account.address),
    [walletClientQuery.data]
  );
  if (walletClientQuery.isLoading) {
    return {
      isLoading: true,
      owner: undefined,
    };
  }
  return { isLoading: false, owner: { signMessage, getAddress } };
}
