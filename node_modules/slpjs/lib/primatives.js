"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Sapling note magic values, copied from src/zcash/Zcash.h
var NOTEENCRYPTION_AUTH_BYTES = 16;
var ZC_NOTEPLAINTEXT_LEADING = 1;
var ZC_V_SIZE = 8;
var ZC_RHO_SIZE = 32;
var ZC_R_SIZE = 32;
var ZC_MEMO_SIZE = 512;
var ZC_DIVERSIFIER_SIZE = 11;
var ZC_JUBJUB_POINT_SIZE = 32;
var ZC_JUBJUB_SCALAR_SIZE = 32;
var ZC_NOTEPLAINTEXT_SIZE = ZC_NOTEPLAINTEXT_LEADING + ZC_V_SIZE + ZC_RHO_SIZE + ZC_R_SIZE + ZC_MEMO_SIZE;
var ZC_SAPLING_ENCPLAINTEXT_SIZE = ZC_NOTEPLAINTEXT_LEADING + ZC_DIVERSIFIER_SIZE + ZC_V_SIZE + ZC_R_SIZE + ZC_MEMO_SIZE;
var ZC_SAPLING_OUTPLAINTEXT_SIZE = ZC_JUBJUB_POINT_SIZE + ZC_JUBJUB_SCALAR_SIZE;
var ZC_SAPLING_ENCCIPHERTEXT_SIZE = ZC_SAPLING_ENCPLAINTEXT_SIZE + NOTEENCRYPTION_AUTH_BYTES;
var ZC_SAPLING_OUTCIPHERTEXT_SIZE = ZC_SAPLING_OUTPLAINTEXT_SIZE + NOTEENCRYPTION_AUTH_BYTES;
var ZC_NUM_JS_INPUTS = 2;
var ZC_NUM_JS_OUTPUTS = 2;
// leading + v + rho + r + memo + auth
var ZC_NOTECIPHERTEXT_SIZE = 1 + 8 + 32 + 32 + 512 + 16;
var Primatives;
(function (Primatives) {
    var Hex = /** @class */ (function () {
        function Hex() {
        }
        Hex.decode = function (text) {
            return text.match(/.{2}/g).map(function (byte) {
                return parseInt(byte, 16);
            });
        };
        Hex.encode = function (bytes) {
            var result = [];
            for (var i = 0, hex = void 0; i < bytes.length; i++) {
                hex = bytes[i].toString(16);
                if (hex.length < 2) {
                    hex = "0" + hex;
                }
                result.push(hex);
            }
            return result.join("");
        };
        return Hex;
    }());
    // tslint:disable-next-line: max-classes-per-file
    var LittleEndian = /** @class */ (function () {
        function LittleEndian() {
        }
        LittleEndian.decode = function (bytes) {
            return bytes.reduce(function (previous, current, index) {
                return previous + current * Math.pow(256, index);
            }, 0);
        };
        LittleEndian.encode = function (number, count) {
            var rawBytes = [];
            for (var i = 0; i < count; i++) {
                rawBytes[i] = number & 0xff;
                number = Math.floor(number / 256);
            }
            return rawBytes;
        };
        return LittleEndian;
    }());
    // tslint:disable-next-line: max-classes-per-file
    var ArraySource = /** @class */ (function () {
        function ArraySource(rawBytes, index) {
            this.rawBytes = rawBytes;
            this.index = index || 0;
        }
        ArraySource.prototype.readByte = function () {
            if (!this.hasMoreBytes()) {
                throw new Error("Cannot read past the end of the array.");
            }
            return this.rawBytes[this.index++];
        };
        ArraySource.prototype.hasMoreBytes = function () {
            return this.index < this.rawBytes.length;
        };
        ArraySource.prototype.getPosition = function () {
            return this.index;
        };
        return ArraySource;
    }());
    Primatives.ArraySource = ArraySource;
    // tslint:disable-next-line: max-classes-per-file
    var ByteStream = /** @class */ (function () {
        function ByteStream(source) {
            this.source = source;
        }
        ByteStream.prototype.readByte = function () {
            return this.source.readByte();
        };
        ByteStream.prototype.readBytes = function (num) {
            var bytes = [];
            for (var i = 0; i < num; i++) {
                bytes.push(this.readByte());
            }
            return bytes;
        };
        ByteStream.prototype.readInt = function (num) {
            var bytes = this.readBytes(num);
            return LittleEndian.decode(bytes);
        };
        ByteStream.prototype.readVarInt = function () {
            var num = this.readByte();
            if (num < 0xfd) {
                return num;
            }
            else if (num === 0xfd) {
                return this.readInt(2);
            }
            else if (num === 0xfe) {
                return this.readInt(4);
            }
            else {
                return this.readInt(8);
            }
        };
        ByteStream.prototype.readString = function () {
            var length = this.readVarInt();
            return this.readBytes(length);
        };
        ByteStream.prototype.readHexBytes = function (num) {
            var bytes = this.readBytes(num);
            return Hex.encode(bytes.reverse());
        };
        ByteStream.prototype.hasMoreBytes = function () {
            return this.source.hasMoreBytes();
        };
        ByteStream.prototype.getPosition = function () {
            return this.source.getPosition();
        };
        return ByteStream;
    }());
    Primatives.ByteStream = ByteStream;
    // tslint:disable-next-line: max-classes-per-file
    var Transaction = /** @class */ (function () {
        function Transaction(version, inputs, outputs, lockTime) {
            this.version = version || 1;
            this.inputs = inputs || [];
            this.outputs = outputs || [];
            this.lockTime = lockTime || 0;
        }
        Transaction.parseFromBuffer = function (buffer) {
            var source = new Primatives.ArraySource(buffer.toJSON().data);
            var stream = new Primatives.ByteStream(source);
            return Transaction.parse(stream);
        };
        Transaction.parse = function (stream, mayIncludeUnsignedInputs) {
            if (mayIncludeUnsignedInputs === void 0) { mayIncludeUnsignedInputs = false; }
            var transaction = new Transaction();
            transaction.version = stream.readInt(4);
            var nVersionGroupId = stream.readInt(4);
            var txInNum = stream.readVarInt();
            for (var i = 0; i < txInNum; i++) {
                var input = {
                    previousTxHash: stream.readHexBytes(32),
                    previousTxOutIndex: stream.readInt(4),
                    scriptSig: stream.readString(),
                    sequenceNo: stream.readHexBytes(4),
                    incomplete: false
                };
                if (mayIncludeUnsignedInputs &&
                    Buffer.from(input.scriptSig).toString('hex').includes('01ff')) {
                    input.satoshis = stream.readInt(8);
                    input.incomplete = true;
                }
                transaction.inputs.push(input);
            }
            var txOutNum = stream.readVarInt();
            for (var i = 0; i < txOutNum; i++) {
                transaction.outputs.push({
                    value: stream.readInt(8),
                    scriptPubKey: stream.readString()
                });
            }
            transaction.lockTime = stream.readInt(4);
            var expiryHeight = stream.readInt(4);
            var valueBalance = stream.readInt(8);
            var spendDescsNum = stream.readVarInt();
            for (var i = 0; i < spendDescsNum; i++) {
                var cv = stream.readBytes(32);
                var anchor = stream.readBytes(32);
                var nullifier = stream.readBytes(32);
                var rk = stream.readBytes(32);
                var proof = stream.readBytes(192);
                var spendAuthSig = stream.readBytes(64);
            }
            var outputDescsNum = stream.readVarInt();
            for (var i = 0; i < outputDescsNum; i++) {
                var cv = stream.readBytes(32);
                var cmu = stream.readBytes(32);
                var ephemeralKey = stream.readBytes(32);
                var encCipherText = stream.readBytes(ZC_SAPLING_ENCCIPHERTEXT_SIZE);
                var outCipherText = stream.readBytes(ZC_SAPLING_OUTCIPHERTEXT_SIZE);
                var proof = stream.readBytes(192);
            }
            var JSDescsNum = stream.readVarInt();
            for (var i = 0; i < JSDescsNum; i++) {
                var vpub_old = stream.readInt(8);
                var vpub_new = stream.readInt(8);
                var anchor = stream.readBytes(32);
                for (var j = 0; j < ZC_NUM_JS_INPUTS; j++) {
                    stream.readBytes(32);
                }
                for (var j = 0; j < ZC_NUM_JS_OUTPUTS; j++) {
                    stream.readBytes(32);
                }
                var ephemeralKey = stream.readBytes(32);
                var randomSeed = stream.readBytes(32);
                for (var j = 0; j < ZC_NUM_JS_INPUTS; j++) {
                    stream.readBytes(32);
                }
                var proof = stream.readBytes(192);
                for (var j = 0; j < ZC_NUM_JS_OUTPUTS; j++) {
                    stream.readBytes(ZC_NOTECIPHERTEXT_SIZE);
                }
            }
            if (JSDescsNum > 0) {
                var joinSplitPubKey = stream.readBytes(32);
                var joinSplitSig = stream.readBytes(64);
            }
            if (!(spendDescsNum == 0 && outputDescsNum == 0)) {
                var bindingSig = stream.readBytes(64);
            }
            return transaction;
        };
        Transaction.prototype.toHex = function () {
            var sink = new ArraySink();
            this.serializeInto(sink);
            return Buffer.from(sink.rawBytes).toString("hex");
        };
        Transaction.prototype.serializeInto = function (stream) {
            stream.writeInt(this.version, 4);
            stream.writeVarInt(this.inputs.length);
            for (var i = 0, input = void 0; input = this.inputs[i]; i++) {
                stream.writeHexBytes(input.previousTxHash);
                stream.writeInt(input.previousTxOutIndex, 4);
                stream.writeString(input.scriptSig);
                stream.writeHexBytes(input.sequenceNo);
                if (input.satoshis && input.incomplete) {
                    stream.writeInt(input.satoshis, 8);
                }
            }
            stream.writeVarInt(this.outputs.length);
            for (var i = 0, output = void 0; output = this.outputs[i]; i++) {
                stream.writeInt(output.value, 8);
                stream.writeString(output.scriptPubKey);
            }
            stream.writeInt(this.lockTime, 4);
        };
        ;
        return Transaction;
    }());
    Primatives.Transaction = Transaction;
    // tslint:disable-next-line: max-classes-per-file
    var ArraySink = /** @class */ (function () {
        function ArraySink(rawBytes) {
            this.rawBytes = rawBytes || [];
        }
        ArraySink.prototype.writeByte = function (byte) {
            this.rawBytes.push(byte);
        };
        ArraySink.prototype.writeBytes = function (bytes) {
            Array.prototype.push.apply(this.rawBytes, bytes);
        };
        ArraySink.prototype.writeInt = function (number, count) {
            this.writeBytes(LittleEndian.encode(number, count));
        };
        ArraySink.prototype.writeVarInt = function (num) {
            if (num < 0xfd) {
                this.writeByte(num);
            }
            else if (num <= 0xffff) {
                this.writeByte(0xfd);
                this.writeBytes(LittleEndian.encode(num, 2));
            }
            else {
                throw new Error("Not implemented.");
            }
        };
        ArraySink.prototype.writeString = function (bytes) {
            this.writeVarInt(bytes.length);
            this.writeBytes(bytes);
        };
        ArraySink.prototype.writeHexBytes = function (text) {
            this.writeBytes(Hex.decode(text).reverse());
        };
        return ArraySink;
    }());
    Primatives.ArraySink = ArraySink;
})(Primatives = exports.Primatives || (exports.Primatives = {}));
//# sourceMappingURL=primatives.js.map