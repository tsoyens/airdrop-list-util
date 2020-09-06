/// <reference types="node" />
import { SlpAddressUtxoResult, Slp } from "..";
import BigNumber from "bignumber.js";
export interface InputSigData {
    index: number;
    pubKeyBuf: Buffer;
    signatureBuf: Buffer;
}
export interface ScriptSigP2PK {
    index: number;
    signatureBuf: Buffer;
}
export interface ScriptSigP2PKH {
    index: number;
    pubKeyBuf: Buffer;
    signatureBuf: Buffer;
}
export interface ScriptSigP2SH {
    index: number;
    lockingScriptBuf: Buffer;
    unlockingScriptBufArray: (number | Buffer)[];
}
export interface MultisigRedeemData {
    m: number;
    address: string;
    pubKeys: Buffer[];
    lockingScript: Buffer;
}
export declare class TransactionHelpers {
    slp: Slp;
    constructor(slp: Slp);
    simpleTokenSend({ tokenId, sendAmounts, inputUtxos, tokenReceiverAddresses, changeReceiverAddress, requiredNonTokenOutputs, extraFee }: {
        tokenId: string;
        sendAmounts: BigNumber | BigNumber[];
        inputUtxos: SlpAddressUtxoResult[];
        tokenReceiverAddresses: string | string[];
        changeReceiverAddress: string;
        requiredNonTokenOutputs?: Array<{
            satoshis: number;
            receiverAddress: string;
        }>;
        extraFee?: number;
    }): string;
    simpleBchSend({ sendAmounts, inputUtxos, bchReceiverAddresses, changeReceiverAddress }: {
        sendAmounts: BigNumber | BigNumber[];
        inputUtxos: SlpAddressUtxoResult[];
        bchReceiverAddresses: string | string[];
        changeReceiverAddress: string;
    }): string;
    simpleTokenGenesis({ tokenName, tokenTicker, tokenAmount, documentUri, documentHash, decimals, tokenReceiverAddress, batonReceiverAddress, bchChangeReceiverAddress, inputUtxos }: {
        tokenName: string;
        tokenTicker: string;
        tokenAmount: BigNumber;
        documentUri: string | null;
        documentHash: Buffer | null;
        decimals: number;
        tokenReceiverAddress: string;
        batonReceiverAddress: string | null;
        bchChangeReceiverAddress: string;
        inputUtxos: SlpAddressUtxoResult[];
    }): string;
    simpleNFT1ParentGenesis({ tokenName, tokenTicker, tokenAmount, documentUri, documentHash, tokenReceiverAddress, batonReceiverAddress, bchChangeReceiverAddress, inputUtxos, decimals }: {
        tokenName: string;
        tokenTicker: string;
        tokenAmount: BigNumber;
        documentUri: string | null;
        documentHash: Buffer | null;
        tokenReceiverAddress: string;
        batonReceiverAddress: string | null;
        bchChangeReceiverAddress: string;
        inputUtxos: SlpAddressUtxoResult[];
        decimals?: number;
    }): string;
    simpleNFT1ChildGenesis({ nft1GroupId, tokenName, tokenTicker, documentUri, documentHash, tokenReceiverAddress, bchChangeReceiverAddress, inputUtxos, allowBurnAnyAmount }: {
        nft1GroupId: string;
        tokenName: string;
        tokenTicker: string;
        documentUri: string | null;
        documentHash: Buffer | null;
        tokenReceiverAddress: string;
        bchChangeReceiverAddress: string;
        inputUtxos: SlpAddressUtxoResult[];
        allowBurnAnyAmount?: boolean;
    }): any;
    simpleTokenMint({ tokenId, mintAmount, inputUtxos, tokenReceiverAddress, tokenReceiverSatoshis, batonReceiverAddress, changeReceiverAddress, extraFee, disableBchChangeOutput, batonReceiverSatoshis, burnBaton }: {
        tokenId: string;
        mintAmount: BigNumber;
        inputUtxos: SlpAddressUtxoResult[];
        tokenReceiverAddress: string;
        batonReceiverAddress: string;
        changeReceiverAddress: string;
        extraFee?: number;
        disableBchChangeOutput?: boolean;
        tokenReceiverSatoshis?: BigNumber;
        batonReceiverSatoshis?: BigNumber;
        burnBaton?: boolean;
    }): string;
    simpleTokenBurn({ tokenId, burnAmount, inputUtxos, changeReceiverAddress }: {
        tokenId: string;
        burnAmount: BigNumber;
        inputUtxos: SlpAddressUtxoResult[];
        changeReceiverAddress: string;
    }): string;
    get_transaction_sig_filler(input_index: number, pubKeyBuf: Buffer): InputSigData;
    get_transaction_sig_p2pkh(txHex: string, wif: string, input_index: number, input_satoshis: number, sigHashType?: number): InputSigData;
    get_transaction_sig_p2sh(txHex: string, wif: string, input_index: number, input_satoshis: number, redeemScript: Buffer, scriptCode: Buffer, sigHashType?: number): InputSigData;
    build_P2PKH_scriptSig(sigData: InputSigData): ScriptSigP2PKH;
    build_P2SH_multisig_redeem_data(m: number, pubKeys: string[] | Buffer[]): MultisigRedeemData;
    insert_input_values_for_EC_signers(txnHex: string, input_values: number[]): string;
    build_P2SH_multisig_scriptSig(redeemData: MultisigRedeemData, input_index: number, sigs: InputSigData[]): ScriptSigP2SH;
    addScriptSigs(unsignedTxnHex: string, scriptSigs: (ScriptSigP2PKH | ScriptSigP2SH | ScriptSigP2PK)[]): string;
    setTxnLocktime(unsignedTxnHex: string, locktime: number): string;
    enableInputsCLTV(unsignedTxnHex: string): string;
}
