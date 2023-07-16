import type { Address } from "abitype";
import {
  concatHex,
  encodeFunctionData,
  hexToBytes,
  type FallbackTransport,
  type Hex,
  type Transport,
} from "viem";
import { 
  CustomSimpleAccountAbi,
  CustomSimpleAccountFactoryAbi
} from "@/app/constants";
import type { BatchUserOperationCallData } from "@alchemy/aa-core";
import {
  BaseSmartContractAccount,
  type BaseSmartAccountParams,
} from "@alchemy/aa-core";

export interface CustomSimpleSmartAccountOwner {
  signMessage: (msg: Uint8Array) => Promise<Address>;
  getAddress: () => Promise<Address>;
}

export interface CustomSimpleSmartAccountParams<
  TTransport extends Transport | FallbackTransport = Transport
> extends BaseSmartAccountParams<TTransport> {
  owner: CustomSimpleSmartAccountOwner;
  ownerAddress: Address;
  factoryAddress: Address;
  index?: bigint;
}

export class CustomSimpleSmartContractAccount<
  TTransport extends Transport | FallbackTransport = Transport
> extends BaseSmartContractAccount<TTransport> {
  private owner: CustomSimpleSmartAccountOwner;
  private factoryAddress: Address;
  private index: bigint;

  constructor(params: CustomSimpleSmartAccountParams) {
    super(params);

    this.index = params.index ?? 0n;
    this.owner = params.owner;
    this.ownerAddress = params.ownerAddress;
    this.factoryAddress = params.factoryAddress;
  }

  getDummySignature(): `0x${string}` {
    return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";
  }

  async encodeExecute(
    target: Hex,
    value: bigint,
    data: Hex
  ): Promise<`0x${string}`> {
    return encodeFunctionData({
      abi: CustomSimpleAccountAbi,
      functionName: "execute",
      args: [target, value, data],
    });
  }

  override async encodeBatchExecute(
    _txs: BatchUserOperationCallData
  ): Promise<`0x${string}`> {
    const [targets, datas] = _txs.reduce(
      (accum, curr) => {
        accum[0].push(curr.target);
        accum[1].push(curr.data);

        return accum;
      },
      [[], []] as [Address[], Hex[]]
    );

    return encodeFunctionData({
      abi: CustomSimpleAccountAbi,
      functionName: "executeBatch",
      args: [targets, datas],
    });
  }

  signMessage(msg: Uint8Array | string): Promise<`0x${string}`> {
    if (typeof msg === "string" && msg.startsWith("0x")) {
      msg = hexToBytes(msg as Hex);
    } else if (typeof msg === "string") {
      msg = new TextEncoder().encode(msg);
    }

    return this.owner.signMessage(msg);
  }

  protected async getAccountInitCode(): Promise<`0x${string}`> {
    return concatHex([
      this.factoryAddress,
      encodeFunctionData({
        abi: CustomSimpleAccountFactoryAbi,
        functionName: "createAccount",
        args: [this.ownerAddress, this.index],
      }),
    ]);
  }
}
