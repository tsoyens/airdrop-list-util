const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const SLPSDK = require('slp-sdk');
const eccrypto = require("eccrypto");
const keccak256 = require('keccak256')
const privateKeyToAddress = require('ethereum-private-key-to-address')
const publicKeyToAddress = require('ethereum-public-key-to-address')
const bitcoin = require('bitcoinjs-lib')
const fetch = require('node-fetch');
const inquirer  = require('./lib/inquirer');
const CryptoUtils = require("@tronscan/client/src/utils/crypto");
const url = 'https://explorer.zcl.zelcore.io/api/txs?address=t1ZefiGenesisBootstrapBURNxxxyfs71k';
const bigInt = require("big-integer");
const bs58 = require('bs58');
const ripemd160 = require("ripemd160");
const bs58check = require('bs58check')  // https://github.com/bitcoinjs/bs58check
let BITBOX = require('bitbox-sdk').BITBOX;
let bitbox = new BITBOX();

function pad_with_zeroes(number, length) {
    var retval = '' + number;
    while (retval.length < length) {
        retval = '0' + retval;
    }
    return retval;
}

// Consts for secp256k1 curve. Adjust accordingly
// https://en.bitcoin.it/wiki/Secp256k1
const prime = new bigInt('fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f', 16),
pIdent = prime.add(1).divide(4);

/**
 * Point decompress secp256k1 curve
 * @param {string} Compressed representation in hex string
 * @return {string} Uncompressed representation in hex string
 */
function ECPointDecompress( comp ) {
    var signY = new Number(comp[1]) - 2;
    var x = new bigInt(comp.substring(2), 16);
    // y mod p = +-(x^3 + 7)^((p+1)/4) mod p
    var y = x.modPow(3, prime).add(7).mod(prime).modPow( pIdent, prime );
    // If the parity doesn't match it's the *other* root
    if( y.mod(2).toJSNumber() !== signY ) {
        // y = prime - y
        y = prime.subtract( y );
    }
    return '04' + pad_with_zeroes(x.toString(16), 64) + pad_with_zeroes(y.toString(16), 64);
}

const run = async () => {
  var txns = await get_airdrop_list();
  console.log(JSON.stringify(txns, null, 2));

  var total_zefi = 0;
  var total_zcl = 0;
  for (var i=0; i<txns.length; i++) {
      total_zefi += txns[i].zefi_reward;
  }
  console.log("number of txns: " +txns.length);
  console.log("Total Zefi Supply: " +total_zefi);
  console.log("Average ZeFi per ZCL: " + (total_zefi / 390070));
//  get_keys('radar limit release tackle during fever addict dog half idea cargo quality')

};

clear();

console.log(
  chalk.yellow(
    figlet.textSync('Zefi', { horizontalLayout: 'full' })
  )
);

run();

async function get_filtered_txns(key_list){
  var txn_keys = await get_txn_keys();
  var filtered_txns = txn_keys.filter(function(txn_key) {
           return key_list.map(key =>{return key.compressed_pub_key}).includes(txn_key.compressed_pub_key)
         });
  filtered_txns = filtered_txns.map( txn => {
    txn["pub_key"] = key_list.filter(function(key){
      return key.compressed_pub_key == txn.compressed_pub_key
    })[0].pub_key;

    txn["private_key"] = key_list.filter(function(key){
      return key.compressed_pub_key == txn.compressed_pub_key
    })[0].private_key;

    txn["zclassic_address"] = key_list.filter(function(key){
      return key.compressed_pub_key == txn.compressed_pub_key
    })[0].zclassic_address;

    txn["ethereum_address"] = key_list.filter(function(key){
      return key.compressed_pub_key == txn.compressed_pub_key
    })[0].ethereum_address;

    txn["tron_address"] = key_list.filter(function(key){
      return key.compressed_pub_key == txn.compressed_pub_key
    })[0].tron_address;

    txn["zefi_amount"] = zefi_amount(parseFloat(txn.value_out), txn.block_height);

    return txn;
  });
  console.log(filtered_txns);
  return filtered_txns;
}

async function get_filtered_keys(key_list){
  var txn_keys = await get_txn_keys();
  var filtered_keys = key_list.filter(function(key) {
           return txn_keys.map(txn =>{return txn.compressed_pub_key}).includes(key.compressed_pub_key)
         });
  console.log(filtered_keys);
  return filtered_keys;
}

async function get_txns() {
  var txns = [];

  const getPages = async url => {
    try {
      const response = await fetch(url);
      const json = await response.json();
      return(json['pagesTotal'])
    } catch (error) {
      console.log(error);
    }
  };

  const getTxns = async url => {
    try {
      const response = await fetch(url);
      const json = await response.json();
      txns.push(...json['txs'])
    } catch (error) {
      console.log(error);
    }
  };

  var pages = await getPages(url);

  for (var i = 0; i< pages; i++){
    console.log("Getting Burn txns page: " + i)
    await getTxns(url+'&pageNum='+i);
  }
  return txns;
};

async function get_airdrop_list() {
  SLP = new SLPSDK({ restURL: 'https://rest.zslp.org/v2/' });

  var txns = await get_txns();
  var keys = txns.map(txn => {

    var compressed_pub_key = txn.vin[0].scriptSig.asm.split(' ')[1];

    var pubkey = SLP.ECPair.fromPublicKey(Buffer.from(compressed_pub_key, 'hex'));
    var bitcoin_address = SLP.ECPair.toLegacyAddress(pubkey);

    var zcl_value = 0.0;
    for (var i = 0; i < txn.vout.length; i++){
      if(txn.vout[i].scriptPubKey.addresses && txn.vout[i].scriptPubKey.addresses[0] === "t1ZefiGenesisBootstrapBURNxxxyfs71k"){
        zcl_value = zcl_value + parseFloat(txn.vout[i].value);
      }
    }

   return { "txn_id": txn.txid,
              "compressed_pub_key": txn.vin[0].scriptSig.asm.split(' ')[1],
              "uncompressed_pub_key": ECPointDecompress(txn.vin[0].scriptSig.asm.split(' ')[1]),
              "value_out": "" + zcl_value,
              "block_height": txn.blockheight,
              "bitcoin_address": bitcoin_address,
              "zclassic_address": baddr_to_taddr(bitcoin_address),
              "zefi_reward": zefi_amount(zcl_value, txn.blockheight),
              "ethereum_address": publicKeyToAddress(ECPointDecompress(txn.vin[0].scriptSig.asm.split(' ')[1])),
              "tron_address": CryptoUtils.getBase58CheckAddressFromPubBytes(Buffer.from(ECPointDecompress(txn.vin[0].scriptSig.asm.split(' ')[1]), 'hex')),

                                      }
                             }
                     );
  return keys
}


async function get_txn_keys() {
  var txns = await get_txns();
  var keys = txns.map(txn => { return { "txn_id": txn.txid,
                                        "compressed_pub_key": txn.vin[0].scriptSig.asm.split(' ')[1],
                                        "value_out": txn.vout[0].value,
                                        "block_height": txn.blockheight
                                      }
                             }
                     );
  return keys;
}

function zefi_amount(zcl, block_height){
  var multiplier = 2000;
  var over = block_height - 846500;
  var rounds = Math.floor(over / 50)+1;


  if (block_height >= 846500){
    multiplier = multiplier - rounds;
    // cutoff time
    if(multiplier < 1337) {
      multiplier = 0;
    }
  }

  var zefi = Math.floor(zcl * multiplier);
  return zefi;
}



function get_keys(mn, derive = 0) {
  SLP = new SLPSDK({ restURL: 'https://rest.zslp.org/v2/' });
  const lang = "english";

  const rootSeed = SLP.Mnemonic.toSeed(mn);
  var masterHDNode = SLP.HDNode.fromSeed(rootSeed);

  var nodeZero = masterHDNode.derivePath(`m/44'/147'/0'/0/` + derive);
  var addressZero = SLP.HDNode.toCashAddress(nodeZero);
  var addressZeroWif = SLP.HDNode.toWIF(nodeZero);

  var ecpair = SLP.ECPair.fromWIF(addressZeroWif);
  var privateKeyA = ecpair.getPrivateKeyBuffer();
  var publicKeyA = eccrypto.getPublic(privateKeyA);

  const pubkeyBuf = Buffer.from(Buffer.from(publicKeyA).toString('hex'), 'hex');

  const pubkey = bitcoin.ECPair.fromPublicKey(pubkeyBuf);
  var compressedPubKey = pubkey.publicKey.toString('hex');
  console.log(ECPointDecompress(compressedPubKey));
  return {
            "pub_key": Buffer.from(publicKeyA).toString('hex'),
            "compressed_pub_key": compressedPubKey,
            "private_key": Buffer.from(privateKeyA).toString('hex'),
            "zclassic_address": addressZero,
            "tron_address": CryptoUtils.getBase58CheckAddressFromPubBytes(publicKeyA),
            "ethereum_address": publicKeyToAddress(publicKeyA)
          }
  // console.log("Public key: " + Buffer.from(publicKeyA).toString('hex'));
  // console.log("Compressed Public Key: " + compressedPubKey)
  // console.log("Private key: " + Buffer.from(privateKeyA).toString('hex'));
  // console.log("Zclassic Address: " + addressZero);
  // console.log("Tron Address: " + addressZero);
  // console.log("Ethereum Address: " + publicKeyToAddress(publicKeyA));
}


/**
 * Converts a Bitcoin "Pay To Public Key Hash" (P2PKH) public
 * address to a ZCash t-address. (Such Bitcoin addresses always
 * start with a '1'.
 *
 * The same private key (aka "spending key") that generated
 * the Bitcoin address can be used to control funds associated
 * with the ZCash t-address. (This requires a ZCash wallet system
 * which allows that private key to be imported. For example,
 * zcashd with its `importprivkey` function.)
 */
function baddr_to_taddr(baddr_str) {
    var baddr = bs58check.decode(baddr_str).slice(1);  // discard type byte
    var taddr = new Uint8Array(22);
    taddr.set(baddr, 2);
    taddr.set([0x1c,0xb8], 0);  // set zcash type bytes
    return bs58check.encode(Buffer.from(taddr));
}

/**
 * Converts a ZCash t-address (transparent address) to a Bitcoin
 * "Pay To Public Key Hash" (P2PKH) address.
 *
 * The same private key (aka "spending key") that generated
 * the ZCash t-address can be used to control funds associated
 * with the Bitcoin address. (This requires a Bitcoin wallet system
 * which allows that private key to be imported. For example,
 * bitcoin-core/bitcoind with its `importprivkey` function.)
 */
function taddr_to_baddr(taddr_str) {
    var taddr = bs58check.decode(taddr_str).slice(2);  // discard type bytes
    var baddr = new Uint8Array(21);
    baddr.set(taddr, 1);  // leave 0x00 as Bitcoin's type byte
    return bs58check.encode(Buffer.from(baddr));
}
