/// <reference types="node" />
import { logger, SlpAddressUtxoResult, SlpBalancesResult, SlpTransactionDetails, utxo } from "../index";
import BigNumber from "bignumber.js";
import { BITBOX } from "bitbox-sdk";
export interface SlpPaymentRequest {
    address: string;
    amountBch?: number;
    amountToken?: number;
    tokenId?: string;
    tokenFlags?: string[];
}
export interface PushDataOperation {
    opcode: number;
    data: Buffer | null;
}
export interface configBuildNFT1GenesisOpReturn {
    ticker: string | null;
    name: string | null;
    parentTokenIdHex: string;
    parentInputIndex: number;
}
export interface configBuildGenesisOpReturn {
    ticker: string | null;
    name: string | null;
    documentUri: string | null;
    hash: Buffer | null;
    decimals: number;
    batonVout: number | null;
    initialQuantity: BigNumber;
}
export interface configBuildMintOpReturn {
    tokenIdHex: string;
    batonVout: number | null;
    mintQuantity: BigNumber;
}
export interface configBuildSendOpReturn {
    tokenIdHex: string;
    outputQtyArray: BigNumber[];
}
export interface configBuildRawNFT1GenesisTx {
    slpNFT1GenesisOpReturn: Buffer;
    mintReceiverAddress: string;
    mintReceiverSatoshis?: BigNumber;
    bchChangeReceiverAddress: string;
    input_utxos: utxo[];
    parentTokenIdHex: string;
}
export interface configBuildRawGenesisTx {
    slpGenesisOpReturn: Buffer;
    mintReceiverAddress: string;
    mintReceiverSatoshis?: BigNumber;
    batonReceiverAddress: string | null;
    batonReceiverSatoshis?: BigNumber;
    bchChangeReceiverAddress: string;
    input_utxos: utxo[];
    allowed_token_burning?: string[];
}
export interface configBuildRawSendTx {
    slpSendOpReturn: Buffer;
    input_token_utxos: utxo[];
    tokenReceiverAddressArray: string[];
    bchChangeReceiverAddress: string;
    requiredNonTokenOutputs?: Array<{
        satoshis: number;
        receiverAddress: string;
    }>;
    extraFee?: number;
}
export interface configBuildBchSendTx {
    input_token_utxos: utxo[];
    bchReceiverAddressArray: string[];
    bchReceiverSatoshiAmounts: BigNumber[];
    bchChangeReceiverAddress: string;
}
export interface configBuildRawMintTx {
    slpMintOpReturn: Buffer;
    mintReceiverAddress: string;
    mintReceiverSatoshis?: BigNumber;
    batonReceiverAddress: string | null;
    batonReceiverSatoshis?: BigNumber;
    bchChangeReceiverAddress: string;
    input_baton_utxos: utxo[];
    extraFee?: number;
    disableBchChangeOutput?: boolean;
}
export interface configBuildRawBurnTx {
    tokenIdHex?: string;
    slpBurnOpReturn?: Buffer;
    input_token_utxos: utxo[];
    bchChangeReceiverAddress: string;
}
export interface SlpValidator {
    getRawTransactions: (txid: string[]) => Promise<string[]>;
    isValidSlpTxid(txid: string, tokenIdFilter?: string | null, tokenTypeFilter?: number | null, logger?: logger): Promise<boolean>;
    validateSlpTransactions(txids: string[]): Promise<string[]>;
}
export interface SlpProxyValidator extends SlpValidator {
    validatorUrl: string;
}
export declare class Slp {
    get lokadIdHex(): string;
    static buildGenesisOpReturn(config: configBuildGenesisOpReturn, type?: number): Buffer;
    static buildMintOpReturn(config: configBuildMintOpReturn, type?: number): Buffer;
    static buildSendOpReturn(config: configBuildSendOpReturn, type?: number): Buffer;
    static parseChunkToInt(intBytes: Buffer, minByteLen: number, maxByteLen: number, raise_on_Null?: boolean): number | null;
    static preSendSlpJudgementCheck(txo: SlpAddressUtxoResult, tokenId: string): boolean;
    BITBOX: BITBOX;
    constructor(bitbox: BITBOX);
    buildRawNFT1GenesisTx(config: configBuildRawNFT1GenesisTx, type?: number): any;
    buildRawGenesisTx(config: configBuildRawGenesisTx, type?: number): any;
    buildRawSendTx(config: configBuildRawSendTx, type?: number): string;
    buildRawMintTx(config: configBuildRawMintTx, type?: number): string;
    buildRawBurnTx(burnAmount: BigNumber, config: configBuildRawBurnTx, type?: number): any;
    buildRawBchOnlyTx(config: configBuildBchSendTx): any;
    parseSlpOutputScript(outputScript: Buffer): SlpTransactionDetails;
    parseOpReturnToChunks(script: Buffer, allow_op_0?: boolean, allow_op_number?: boolean): (Buffer | null)[];
    getScriptOperations(script: Buffer): PushDataOperation[];
    calculateGenesisCost(genesisOpReturnLength: number, inputUtxoSize: number, batonAddress: string | null, bchChangeAddress?: string, feeRate?: number): number;
    calculateMintCost(mintOpReturnLength: number, inputUtxoSize: number, batonAddress: string | null, bchChangeAddress?: string, feeRate?: number): number;
    calculateMintOrGenesisCost(mintOpReturnLength: number, inputUtxoSize: number, batonAddress: string | null, bchChangeAddress?: string, feeRate?: number): number;
    calculateSendCost(sendOpReturnLength: number, inputUtxoSize: number, outputAddressArraySize: number, bchChangeAddress?: string, feeRate?: number, forTokens?: boolean): number;
    processUtxosForSlpAbstract(utxos: SlpAddressUtxoResult[], asyncSlpValidator: SlpValidator): Promise<SlpBalancesResult>;
    private computeSlpBalances;
    applyInitialSlpJudgement(txo: SlpAddressUtxoResult, slpMsgBuf: Buffer): void;
    private applyFinalSlpJudgement;
}
