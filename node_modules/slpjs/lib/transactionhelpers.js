"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
var bignumber_js_1 = __importDefault(require("bignumber.js"));
var Bitcore = __importStar(require("bitcore-lib-cash"));
var primatives_1 = require("./primatives");
var TransactionHelpers = /** @class */ (function () {
    function TransactionHelpers(slp) {
        this.slp = slp;
    }
    // Create raw transaction hex to: Send SLP tokens to one or more token receivers, include optional BCH only outputs
    TransactionHelpers.prototype.simpleTokenSend = function (_a) {
        var tokenId = _a.tokenId, sendAmounts = _a.sendAmounts, inputUtxos = _a.inputUtxos, tokenReceiverAddresses = _a.tokenReceiverAddresses, changeReceiverAddress = _a.changeReceiverAddress, _b = _a.requiredNonTokenOutputs, requiredNonTokenOutputs = _b === void 0 ? [] : _b, _c = _a.extraFee, extraFee = _c === void 0 ? 0 : _c;
        // normalize token receivers and amounts to array types
        if (typeof tokenReceiverAddresses === "string") {
            tokenReceiverAddresses = [tokenReceiverAddresses];
        }
        try {
            var amount = sendAmounts;
            amount.forEach(function (a) { return a.isGreaterThan(new bignumber_js_1.default(0)); });
        }
        catch (_) {
            sendAmounts = [sendAmounts];
        }
        if (sendAmounts.length !== tokenReceiverAddresses.length) {
            throw Error("Must have send amount item for each token receiver specified.");
        }
        // 1) Set the token send amounts, we'll send 100 tokens to a
        //    new receiver and send token change back to the sender
        var totalTokenInputAmount = inputUtxos
            .filter(function (txo) {
            return __1.Slp.preSendSlpJudgementCheck(txo, tokenId);
        })
            .reduce(function (tot, txo) {
            return tot.plus(txo.slpUtxoJudgementAmount);
        }, new bignumber_js_1.default(0));
        // 2) Compute the token Change amount.
        var tokenChangeAmount = totalTokenInputAmount.minus(sendAmounts.reduce(function (t, v) { return t = t.plus(v); }, new bignumber_js_1.default(0)));
        // Get token_type
        var token_type = inputUtxos.filter(function (i) {
            return i.slpUtxoJudgement === __1.SlpUtxoJudgement.SLP_TOKEN &&
                i.slpTransactionDetails.tokenIdHex === tokenId;
        })[0].slpTransactionDetails.versionType;
        var txHex;
        if (tokenChangeAmount.isGreaterThan(new bignumber_js_1.default(0))) {
            // 3) Create the Send OP_RETURN message
            var sendOpReturn = __1.Slp.buildSendOpReturn({
                tokenIdHex: tokenId,
                outputQtyArray: __spread(sendAmounts, [tokenChangeAmount]),
            }, token_type);
            // 4) Create the raw Send transaction hex
            txHex = this.slp.buildRawSendTx({
                slpSendOpReturn: sendOpReturn,
                input_token_utxos: __1.Utils.mapToUtxoArray(inputUtxos),
                tokenReceiverAddressArray: __spread(tokenReceiverAddresses, [changeReceiverAddress]),
                bchChangeReceiverAddress: changeReceiverAddress,
                requiredNonTokenOutputs: requiredNonTokenOutputs,
                extraFee: extraFee
            });
        }
        else if (tokenChangeAmount.isEqualTo(new bignumber_js_1.default(0))) {
            // 3) Create the Send OP_RETURN message
            var sendOpReturn = __1.Slp.buildSendOpReturn({
                tokenIdHex: tokenId,
                outputQtyArray: __spread(sendAmounts),
            });
            // 4) Create the raw Send transaction hex
            txHex = this.slp.buildRawSendTx({
                slpSendOpReturn: sendOpReturn,
                input_token_utxos: __1.Utils.mapToUtxoArray(inputUtxos),
                tokenReceiverAddressArray: __spread(tokenReceiverAddresses),
                bchChangeReceiverAddress: changeReceiverAddress,
                requiredNonTokenOutputs: requiredNonTokenOutputs,
                extraFee: extraFee
            });
        }
        else {
            throw Error('Token inputs less than the token outputs');
        }
        // Return raw hex for this transaction
        return txHex;
    };
    // Create raw transaction hex to: Send BCH to one or more receivers, makes sure tokens are not burned
    TransactionHelpers.prototype.simpleBchSend = function (_a) {
        var sendAmounts = _a.sendAmounts, inputUtxos = _a.inputUtxos, bchReceiverAddresses = _a.bchReceiverAddresses, changeReceiverAddress = _a.changeReceiverAddress;
        // normalize token receivers and amounts to array types
        if (typeof bchReceiverAddresses === "string") {
            bchReceiverAddresses = [bchReceiverAddresses];
        }
        if (typeof sendAmounts === "string") {
            sendAmounts = [sendAmounts];
        }
        try {
            var amount = sendAmounts;
            amount.forEach(function (a) { return a.isGreaterThan(new bignumber_js_1.default(0)); });
        }
        catch (_) {
            sendAmounts = [sendAmounts];
        }
        if (sendAmounts.length !== bchReceiverAddresses.length) {
            throw Error("Must have send amount item for each token receiver specified.");
        }
        // 4) Create the raw Send transaction hex
        var txHex = this.slp.buildRawBchOnlyTx({
            input_token_utxos: __1.Utils.mapToUtxoArray(inputUtxos),
            bchReceiverAddressArray: bchReceiverAddresses,
            bchReceiverSatoshiAmounts: sendAmounts,
            bchChangeReceiverAddress: changeReceiverAddress
        });
        // Return raw hex for this transaction
        return txHex;
    };
    // Create raw transaction hex to: Create a token Genesis issuance
    TransactionHelpers.prototype.simpleTokenGenesis = function (_a) {
        var tokenName = _a.tokenName, tokenTicker = _a.tokenTicker, tokenAmount = _a.tokenAmount, documentUri = _a.documentUri, documentHash = _a.documentHash, decimals = _a.decimals, tokenReceiverAddress = _a.tokenReceiverAddress, batonReceiverAddress = _a.batonReceiverAddress, bchChangeReceiverAddress = _a.bchChangeReceiverAddress, inputUtxos = _a.inputUtxos;
        var genesisOpReturn = __1.Slp.buildGenesisOpReturn({
            ticker: tokenTicker,
            name: tokenName,
            documentUri: documentUri,
            hash: documentHash,
            decimals: decimals,
            batonVout: batonReceiverAddress ? 2 : null,
            initialQuantity: tokenAmount,
        });
        // 4) Create/sign the raw transaction hex for Genesis
        var genesisTxHex = this.slp.buildRawGenesisTx({
            slpGenesisOpReturn: genesisOpReturn,
            mintReceiverAddress: tokenReceiverAddress,
            batonReceiverAddress: batonReceiverAddress,
            bchChangeReceiverAddress: bchChangeReceiverAddress,
            input_utxos: __1.Utils.mapToUtxoArray(inputUtxos)
        });
        // Return raw hex for this transaction
        return genesisTxHex;
    };
    TransactionHelpers.prototype.simpleNFT1ParentGenesis = function (_a) {
        var tokenName = _a.tokenName, tokenTicker = _a.tokenTicker, tokenAmount = _a.tokenAmount, documentUri = _a.documentUri, documentHash = _a.documentHash, tokenReceiverAddress = _a.tokenReceiverAddress, batonReceiverAddress = _a.batonReceiverAddress, bchChangeReceiverAddress = _a.bchChangeReceiverAddress, inputUtxos = _a.inputUtxos, _b = _a.decimals, decimals = _b === void 0 ? 0 : _b;
        var genesisOpReturn = __1.Slp.buildGenesisOpReturn({
            ticker: tokenTicker,
            name: tokenName,
            documentUri: documentUri,
            hash: documentHash,
            decimals: decimals,
            batonVout: batonReceiverAddress ? 2 : null,
            initialQuantity: tokenAmount,
        }, 0x81);
        // Create/sign the raw transaction hex for Genesis
        var genesisTxHex = this.slp.buildRawGenesisTx({
            slpGenesisOpReturn: genesisOpReturn,
            mintReceiverAddress: tokenReceiverAddress,
            batonReceiverAddress: batonReceiverAddress,
            bchChangeReceiverAddress: bchChangeReceiverAddress,
            input_utxos: __1.Utils.mapToUtxoArray(inputUtxos)
        });
        // Return raw hex for this transaction
        return genesisTxHex;
    };
    TransactionHelpers.prototype.simpleNFT1ChildGenesis = function (_a) {
        var nft1GroupId = _a.nft1GroupId, tokenName = _a.tokenName, tokenTicker = _a.tokenTicker, documentUri = _a.documentUri, documentHash = _a.documentHash, tokenReceiverAddress = _a.tokenReceiverAddress, bchChangeReceiverAddress = _a.bchChangeReceiverAddress, inputUtxos = _a.inputUtxos, _b = _a.allowBurnAnyAmount, allowBurnAnyAmount = _b === void 0 ? false : _b;
        var genesisOpReturn = __1.Slp.buildGenesisOpReturn({
            ticker: tokenTicker,
            name: tokenName,
            documentUri: documentUri,
            hash: documentHash,
            decimals: 0,
            batonVout: null,
            initialQuantity: new bignumber_js_1.default(1),
        }, 0x41);
        // make sure that the first input item is a a token from the parent nft1GroupId
        if (inputUtxos[0].slpUtxoJudgement !== __1.SlpUtxoJudgement.SLP_TOKEN) {
            throw Error("First input does not include a valid SLP NFT1 parent token.");
        }
        else if (inputUtxos[0].slpTransactionDetails.tokenIdHex !== nft1GroupId) {
            throw Error("First input does not include a valid parent token with the specified group id.");
        }
        else if (!allowBurnAnyAmount && !inputUtxos[0].slpUtxoJudgementAmount.isEqualTo(1)) {
            throw Error("NFT1 parent token burn amount is not 1. If you would like to allow burning quanity != 1 you can set the 'allowBurnAnyAmount' parameter.");
        }
        // Create/sign the raw transaction hex for Genesis
        var genesisTxHex = this.slp.buildRawGenesisTx({
            slpGenesisOpReturn: genesisOpReturn,
            mintReceiverAddress: tokenReceiverAddress,
            batonReceiverAddress: null,
            bchChangeReceiverAddress: bchChangeReceiverAddress,
            input_utxos: __1.Utils.mapToUtxoArray(inputUtxos),
            allowed_token_burning: [nft1GroupId]
        });
        // Return raw hex for this transaction
        return genesisTxHex;
    };
    // Create raw transaction hex to: Mint new tokens or move the minting baton
    TransactionHelpers.prototype.simpleTokenMint = function (_a) {
        // // convert address to cashAddr from SLP format.
        // let fundingAddress_cashfmt = bchaddr.toCashAddress(fundingAddress);
        var tokenId = _a.tokenId, mintAmount = _a.mintAmount, inputUtxos = _a.inputUtxos, tokenReceiverAddress = _a.tokenReceiverAddress, tokenReceiverSatoshis = _a.tokenReceiverSatoshis, batonReceiverAddress = _a.batonReceiverAddress, changeReceiverAddress = _a.changeReceiverAddress, _b = _a.extraFee, extraFee = _b === void 0 ? 0 : _b, _c = _a.disableBchChangeOutput, disableBchChangeOutput = _c === void 0 ? false : _c, batonReceiverSatoshis = _a.batonReceiverSatoshis, _d = _a.burnBaton, burnBaton = _d === void 0 ? false : _d;
        var token_type = inputUtxos.filter(function (i) {
            return i.slpUtxoJudgement === __1.SlpUtxoJudgement.SLP_BATON;
        })[0].slpTransactionDetails.versionType;
        // 1) Create the Send OP_RETURN message
        var mintOpReturn = __1.Slp.buildMintOpReturn({
            batonVout: burnBaton ? null : 2,
            mintQuantity: burnBaton ? new bignumber_js_1.default(0) : mintAmount,
            tokenIdHex: tokenId,
        }, token_type);
        // 2) Create the raw Mint transaction hex
        var txHex = this.slp.buildRawMintTx({
            input_baton_utxos: __1.Utils.mapToUtxoArray(inputUtxos),
            slpMintOpReturn: mintOpReturn,
            mintReceiverAddress: tokenReceiverAddress,
            mintReceiverSatoshis: tokenReceiverSatoshis,
            batonReceiverAddress: burnBaton ? null : batonReceiverAddress,
            batonReceiverSatoshis: batonReceiverSatoshis,
            bchChangeReceiverAddress: changeReceiverAddress,
            extraFee: extraFee,
            disableBchChangeOutput: burnBaton ? false : disableBchChangeOutput
        });
        // Return raw hex for this transaction
        return txHex;
    };
    // Create raw transaction hex to: Burn a precise quantity of SLP tokens
    //  with remaining tokens (change) sent to a single output address
    TransactionHelpers.prototype.simpleTokenBurn = function (_a) {
        var tokenId = _a.tokenId, burnAmount = _a.burnAmount, inputUtxos = _a.inputUtxos, changeReceiverAddress = _a.changeReceiverAddress;
        // Set the token send amounts
        var totalTokenInputAmount = inputUtxos
            .filter(function (txo) {
            return __1.Slp.preSendSlpJudgementCheck(txo, tokenId);
        })
            .reduce(function (tot, txo) {
            return tot.plus(txo.slpUtxoJudgementAmount);
        }, new bignumber_js_1.default(0));
        // Compute the token Change amount.
        var tokenChangeAmount = totalTokenInputAmount.minus(burnAmount);
        var txHex;
        if (tokenChangeAmount.isGreaterThan(new bignumber_js_1.default(0))) {
            // Create the Send OP_RETURN message
            var sendOpReturn = __1.Slp.buildSendOpReturn({
                tokenIdHex: tokenId,
                outputQtyArray: [tokenChangeAmount],
            });
            // Create the raw Send transaction hex
            txHex = this.slp.buildRawBurnTx(burnAmount, {
                slpBurnOpReturn: sendOpReturn,
                input_token_utxos: __1.Utils.mapToUtxoArray(inputUtxos),
                bchChangeReceiverAddress: changeReceiverAddress
            });
        }
        else if (tokenChangeAmount.isLessThanOrEqualTo(new bignumber_js_1.default(0))) {
            // Create the raw Send transaction hex
            txHex = this.slp.buildRawBurnTx(burnAmount, {
                tokenIdHex: tokenId,
                input_token_utxos: __1.Utils.mapToUtxoArray(inputUtxos),
                bchChangeReceiverAddress: changeReceiverAddress
            });
        }
        else {
            throw Error('Token inputs less than the token outputs');
        }
        // Return raw hex for this transaction
        return txHex;
    };
    TransactionHelpers.prototype.get_transaction_sig_filler = function (input_index, pubKeyBuf) {
        return { signatureBuf: Buffer.from('ff', 'hex'), pubKeyBuf: pubKeyBuf, index: input_index };
    };
    TransactionHelpers.prototype.get_transaction_sig_p2pkh = function (txHex, wif, input_index, input_satoshis, sigHashType) {
        // deserialize the unsigned transaction
        if (sigHashType === void 0) { sigHashType = 0x41; }
        var txn = new Bitcore.Transaction(txHex);
        // we need to get the key pair from wif
        // this will be used by bitcore-lib input sig generation
        // NOTE: Only works for compressed-WIF format
        var ecpair = this.slp.BITBOX.ECPair.fromWIF(wif);
        // we set the previous output for the input
        // again, this is for bitcore-lib input sig generation
        txn.inputs[input_index].output = new Bitcore.Transaction.Output({
            satoshis: input_satoshis,
            script: Bitcore.Script.fromAddress(__1.Utils.toCashAddress(ecpair.getAddress()))
        });
        // Update input to be non-abstract type so we can get the p2pkh sign method
        txn.inputs[input_index] = new Bitcore.Transaction.Input.PublicKeyHash(txn.inputs[input_index]);
        // produce a signature that is specific to this input
        // NOTE: currently only uses ecdsa
        var privateKey = new Bitcore.PrivateKey(wif);
        var sig = txn.inputs[input_index].getSignatures(txn, privateKey, input_index, sigHashType);
        // add have to add the sighash type manually.. :(
        // NOTE: signature is in DER format and is specific to ecdsa & sigHash 0x41
        var sigBuf = Buffer.concat([sig[0].signature.toDER(), Buffer.alloc(1, sigHashType)]);
        // we can return a object conforming to InputSigData<P2pkhSig> interface
        return {
            index: input_index,
            pubKeyBuf: ecpair.getPublicKeyBuffer(),
            signatureBuf: sigBuf
        };
    };
    TransactionHelpers.prototype.get_transaction_sig_p2sh = function (txHex, wif, input_index, input_satoshis, redeemScript, scriptCode, sigHashType) {
        // deserialize the unsigned transaction
        if (sigHashType === void 0) { sigHashType = 0x41; }
        var txn = new Bitcore.Transaction(txHex);
        // we need to get the key pair from wif
        // this will be used by bitcore-lib input sig generation
        // NOTE: Only works for compressed-WIF format
        var ecpair = this.slp.BITBOX.ECPair.fromWIF(wif);
        // we set the previous output for the input
        // again, this is for bitcore-lib input sig generation
        txn.inputs[input_index].output = new Bitcore.Transaction.Output({
            satoshis: input_satoshis,
            script: redeemScript
        });
        // produce a signature that is specific to this input
        // NOTE: currently only uses ecdsa
        var privateKey = new Bitcore.PrivateKey(wif);
        var sig = Bitcore.Transaction.Sighash.sign(txn, privateKey, sigHashType, input_index, scriptCode, Bitcore.crypto.BN.fromNumber(input_satoshis));
        // add have to add the sighash type manually.. :(
        // NOTE: signature is in DER format and is specific to ecdsa & sigHash 0x41
        var sigBuf = Buffer.concat([sig.toDER(), Buffer.alloc(1, sigHashType)]);
        // we can return a object conforming to InputSigData<P2pkhSig> interface
        return {
            index: input_index,
            pubKeyBuf: ecpair.getPublicKeyBuffer(),
            signatureBuf: sigBuf
        };
    };
    TransactionHelpers.prototype.build_P2PKH_scriptSig = function (sigData) {
        return sigData;
    };
    // build_P2PK_scriptSig(sigData: InputSigData): scriptSigP2PK {
    //     return {
    //         index: sigData.index,
    //         signatureBuf: sigData.signatureBuf
    //     }
    // }
    TransactionHelpers.prototype.build_P2SH_multisig_redeem_data = function (m, pubKeys) {
        // allow pubkeys to be passed in as strings
        pubKeys.forEach(function (k, i) {
            if (typeof k === "string")
                pubKeys[i] = Buffer.from(k, 'hex');
        });
        // use bitbox function to get multisig redeem script
        var redeemScript = this.slp.BITBOX.Script.encodeP2MSOutput(m, pubKeys);
        // compute this multisig address
        var addr = this.slp.BITBOX.Address.fromOutputScript(this.slp.BITBOX.Script.scriptHash.output.encode(this.slp.BITBOX.Crypto.hash160(redeemScript)));
        return {
            m: m,
            pubKeys: pubKeys,
            address: __1.Utils.toSlpAddress(addr),
            lockingScript: redeemScript
        };
    };
    TransactionHelpers.prototype.insert_input_values_for_EC_signers = function (txnHex, input_values) {
        var source = new primatives_1.Primatives.ArraySource(Array.from(Buffer.from(txnHex, 'hex').values()));
        var stream = new primatives_1.Primatives.ByteStream(source);
        var txn = primatives_1.Primatives.Transaction.parse(stream);
        input_values.forEach(function (v, i) {
            if (v && v > 0) {
                txn.inputs[i].satoshis = v;
                txn.inputs[i].incomplete = true;
            }
        });
        return txn.toHex();
    };
    TransactionHelpers.prototype.build_P2SH_multisig_scriptSig = function (redeemData, input_index, sigs) {
        // check we have enough signatures
        if (sigs.length < redeemData.m)
            throw Error("Not enough signatures.");
        // check not too many signataures 
        if (sigs.length > redeemData.pubKeys.length)
            throw Error("Too many pubKeys provided.");
        // check all provided signatures belong to the given possible pubkeys
        var pubKeysHex = redeemData.pubKeys.map(function (k) { return k.toString('hex'); });
        var pubKeysGivenHex = sigs.map(function (d) { return d.pubKeyBuf.toString('hex'); });
        pubKeysGivenHex.forEach(function (k) {
            if (!pubKeysHex.includes(k)) {
                throw Error("One of the public keys provided is a signer");
            }
        });
        // ordered sigs properly for OP_CHECKMULTISIG
        var orderedSigs = pubKeysHex.map(function (pub) {
            var sig = sigs.find(function (s) { return s.pubKeyBuf.toString('hex') === pub; });
            return sig.signatureBuf;
        });
        // build the unlocking script for multisig p2sh
        var unlockingScript = __spread([0x00], orderedSigs); //this.slp.BITBOX.Script.encodeP2MSInput(orderedSigs)
        return {
            index: input_index,
            lockingScriptBuf: redeemData.lockingScript,
            unlockingScriptBufArray: unlockingScript
        };
    };
    TransactionHelpers.prototype.addScriptSigs = function (unsignedTxnHex, scriptSigs) {
        // deserialize unsigned transaction so we can add sigs to it
        var _this = this;
        var txn = new Bitcore.Transaction(unsignedTxnHex);
        var bip62Encoded;
        scriptSigs.forEach(function (s) {
            // for p2pkh encode scriptSig
            if (s.pubKeyBuf) {
                var sigBuf = s.signatureBuf;
                var pubKeyBuf = s.pubKeyBuf;
                bip62Encoded = _this.slp.BITBOX.Script.encode([sigBuf, pubKeyBuf]);
            }
            // for p2sh encode scriptSig 
            else if (s.lockingScriptBuf) {
                var unlockingBufArray = s.unlockingScriptBufArray;
                var lockingBuf = s.lockingScriptBuf;
                bip62Encoded = _this.slp.BITBOX.Script.encode(__spread(unlockingBufArray, [lockingBuf]));
            }
            // p2pk encode scriptSig
            else if (!s.pubKeyBuf && s.signatureBuf) {
                bip62Encoded = _this.slp.BITBOX.Script.encode([s.signatureBuf]);
            }
            // throw if input data did not result in encoded scriptSig
            if (!bip62Encoded)
                throw Error("Was not able to set input script for index=" + s.index);
            // actually set the input's scriptSig property
            var script = new Bitcore.Script(bip62Encoded);
            txn.inputs[s.index].setScript(script);
            // console.log("scriptSig for index", s.input_index, ":", bip62Encoded.toString('hex'))
        });
        return txn.toString();
    };
    TransactionHelpers.prototype.setTxnLocktime = function (unsignedTxnHex, locktime) {
        var source = new primatives_1.Primatives.ArraySource(Array.from(Buffer.from(unsignedTxnHex, 'hex').values()));
        var stream = new primatives_1.Primatives.ByteStream(source);
        var txn = primatives_1.Primatives.Transaction.parse(stream);
        txn.lockTime = locktime;
        return txn.toHex();
    };
    TransactionHelpers.prototype.enableInputsCLTV = function (unsignedTxnHex) {
        var source = new primatives_1.Primatives.ArraySource(Array.from(Buffer.from(unsignedTxnHex, 'hex').values()));
        var stream = new primatives_1.Primatives.ByteStream(source);
        var txn = primatives_1.Primatives.Transaction.parse(stream);
        txn.inputs.forEach(function (input) {
            input.sequenceNo = 'fffffffe';
        });
        return txn.toHex();
    };
    return TransactionHelpers;
}());
exports.TransactionHelpers = TransactionHelpers;
//# sourceMappingURL=transactionhelpers.js.map