---
layout: base
title: "Release notes"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

# Release notes

## Version 0.16

_This version is not yet released and corresponds to changes in git master_

New requirements for developers and users:

* JDK 8+ and Gradle 4.4+ is required for building the project (except `bitcoinj-wallettemplate`).
* JDK 11+ and Gradle 4.10+ is required for building `bitcoinj-wallettemplate`.
* `bitcoinj-core` developers can use up to Java 8 language features, but need to stay API compatible to both Java 8 _and_ Android 6.0.
  In practice, using only Java 7 API is a safe bet.
* `bitcoinj-examples` and `bitcoinj-tools` developers can use language features and API from Java 8.
* `bitcoinj-wallettemplate` developers can use language features and API from Java 11.
* `bitcoinj-core` users on Java SE need to provide a Java 8+ runtime. We run CI on LTS releases, so Java 8, 11 and 17 are tested well.
* `bitcoinj-core` users on Android need to provide API level 23 (Android 6.0).

New features:

* Implement BIP350 – Bech32m format for v1+ witness addresses.
* Implement Taproot BIP341 – send to P2TR addresses. Receiving to and spending from P2TR addresses and chains will be implemented in a future release.
* Support for BIP155 `addrv2` messages, including Tor hidden service addresses.
* Support for BIP133 `feefilter` messages.

Feature removals:

* Remove micropayment channels.
  Now that HTLC-based bi-directional payment channels are state of the art, nobody uses the old style any more.
* Remove alert messages.
  The alert message facility has been removed from the Bitcoin protocol due to its centralized nature.
* Warning: Script execution/full verification is still on the hot seat.
  It's still present, but it isn't maintained any more and will probably be removed in a future release.

General improvements:

* Lots of bug fixes everywhere!
* Dependencies have been updated, and dependencies that are part of the API are now properly declared as such.
* The `protobuf` dependency has been migrated to `protobuf-lite`. It's mostly API compatible, but you cannot use both at the same time.
  So if you can't migrate to `protobuf-lite`, please exclude that dependency and continue referencing `protobuf`.
* Lots of previously deprecated methods and variables are removed.
* Work towards immutable data types has progressed.

P2P network connection and protocol:

* `Peer`/`PeerGroup`: P2P connection and blockchain download strategy has been improved:
  * We now select a (new) download peer only if there is a clear consensus about a common chain height between
    connected peers. This also meant more than maxConnections/2 peers need to be connected.
    If there is a tie between two common heights, we stay safe and don't change anything.
    Generally, a Segwit capable peer is required for downloading the blockchain.  
    (This had already been backported to 0.15.6.)
  * There is now also a priority for connecting and being selected for blockchain download.
    This can be used to improve stickiness to trusted peers.  
    (This had already been backported to 0.15.7.)
  * Disconnect remote peers which repeatedly don't respond to pings.
  * Drop any peer a transaction has been broadcast to.
    These peers will not send us back useful broadcast confirmations.  
    (This had already been backported to 0.15.7.)
  * Add a method `PeerGroup.dropAllPeers()`for gracefully dropping all connected peers.  
    (This had already been backported to 0.15.8.)
* Support for BIP155 `addrv2` messages, including Tor hidden service addresses.
* Support for BIP133 `feefilter` messages.
* The protocol version has been moved from the various `Message` types to `MessageSerializer`.
* `MultiplexingDiscovery`: Make shuffling of queried peers optional.
* `MultiplexingDiscovery`: Allow serially queried seeds, too.
* Change `PeerDiscovery.getPeers()` return type from array to list.
* Implement service bit filtering in `DnsDiscovery`. This adds a hex subdomain – representing the filter – to the seed's domain.  
  (This had already been backported to 0.15.7.)
* Make `Message.readVarInt()` return a `VarInt` rather than long.

Wallet:

* Remove wallet-global coinSelector from `Wallet` and `allowSpendingUnconfirmedTransactions()`.
  Coin selection is a per `SendRequest`, per `createSend()` or per `getBalance()` call affair.
  Having it wallet-global leads to race conditions.
* Introduce `Wallet.BadWalletEncryptionKeyException`
  which is thrown if the private keys and seed of this wallet cannot be decrypted due to the supplied encryption key or password being wrong.
* Rename `Wallet.addScriptChangeEventListener()` to `.addScriptsChangeEventListener()`,
  and `removeScriptChangeEventListener()` to `removeScriptsChangeEventListener()`, for the sake of naming consistency.
* New `HDPath` type to replace `ImmutableList<ChildNumber>` and helpers in `HDUtils` (which is now deprecated).
* Add static convenience methods `HDKeyDerivation.deriveChildKeyFromPrivate()` and `.deriveChildKeyFromPublic()`.
* New method `DeterministicKeyChain.getRootKey()` to get the root key.
* New `CurrentKeyChangeEventListener` that fires when a current key and/or address changes.
  It can be registered to `Wallet` and `KeyChainGroup`.
* `DefaultCoinSelector` is now a singleton. Use `DefaultCoinSelector.get()` rather than the constructor.
* Remove `PeerFilterProvider.isRequiringUpdateAllBloomFilter()`.
  Bloom filters will now always be created with UPDATE_ALL.
* New convenience method `SendRequest.allowUnconfirmed()` to allow spending unconfirmed outputs.

Segregated witness latecomers:

* New method `SendRequest.setFeePerVkb()` to set a fee per virtual 1000 bytes.
* New method `Transaction.getWeight()` to calculate transaction weight.
* New method `Transaction.getVsize()` to calculate virtual transaction size.
* Consider the witness discount in `TransactionOutput.getMinNonDustValue()`.
* Add method `TransactionWitness.redeemP2WSH()` to create the stack pushes necessary to redeem a P2WSH output.

Block stores:

* For database-backed block stores, make sure the `openoutputs.toaddress` column is big enough for Bech32 addresses (74 chars).
  Existing database schemas should be updated manually.
* Double the default capacity of `SPVBlockStore`. This has proven to be a sensible value for mobile devices.
* New method `SPVBlockStore.clear()` to empty the store – useful for testing.
* Make PostgresFullPrunedBlockStore compatible with CockroachDB.  
  (This had already been backported to 0.15.9.)

Crypto:

* Introduce dedicated `KeyCrypterException.PublicPrivateMismatch` exception
  for when a private key or seed is decrypted and it doesn't match its public key.
* Introduce dedicated `KeyCrypterException.InvalidCipherText` exception
  for when a private key or seed is decrypted and the decrypted message is damaged.
* Migrate `AESFastEngine` to `AESEngine` in `KeyCrypterScrypt`. See https://nvd.nist.gov/vuln/detail/CVE-2016-1000339.  
  (This had already been backported to 0.15.2.)
* Use Bouncy Castle's Scrypt implementation rather than the standalone library.  
  (This had already been backported to 0.15.4.)
* Add helper method `ECKey.isPubKeyCompressed()` to determine if the given pubkey is in its compressed form.
* Track point compression in `LazyECPoint`, rather than `ECPoint`. The reason is BouncyCastle 1.64 (and later) removed point compression tracking.  
  (This had already been backported to 0.15.10.)
* Move `ECKey.compressPoint()`/`.decompressPoint()` helpers to `LazyECPoint.compress()`/`.decompress()`.

Development:

* Migrate repository from JCenter to Maven Central, as JCenter has shut down.  
  (This had already been backported to 0.15.10.)
* `bitcoinj-core` now produces Java 8 bytecode.
* Declare `Automatic-Module-Name` entry in `MANIFEST.MF` to make `bitcoinj-core` as a first step into the world of the Java Module System.
* The minimum Gradle version (4.4) is now enforced in `settings.gradle`.
* Migrated from using Travis for CI to GitHub Actions and GitLab CI.
* Migrate from the `maven` to `maven-publish` plugin in `build.gradle`.
  To publish to the local Maven repository, use `gradle publishToMavenLocal`.

Wallet-Tool:

* Use 'application' plugin to launch `WalletTool`. See main README for how to use.
* New options `--fee-per-vkb` and `--fee-sat-per-vbyte` to specify fee, segwit style.
* Migrate parsing of command line options from JOpt to picocli for `WalletTool`, and examples `BuildCheckpoints` and `FetchBlock`.
* Implement two coin selection options for sending in `WalletTool`: `--select-addr` and `--select-output`.

Wallet-Template:

* Move most sub-packages of `wallettemplate` to `org.bitcoinj.walletfx`
* Refactor the `Main` class to use an `AppDelegate` class and other related changes to make customization of the `wallettemplate` easier.
  (Further work in this area is planned.)
* Put wallet data files in a specified app data directory.
* Replace usage of QRGen by direct usage of ZXing 3.4.1 for generating QR codes.
* Use testnet3, rather than mainnet. This reflects the fact that WalletTemplate is not ready for production.

Misc:

* Remove support for protocol versions older than 106 from `VersionMessage`.
* Many `toString()` messages have been improved.
* Support satoshi denomination in `MonetaryFormat`.
* Allow all-caps `BITCOIN:` schema in `BitcoinURI`, to allow for smaller QR codes in combination with all-caps Bech32 addresses.  
  (This had already been backported to 0.15.2.)
* New method `DeterministicSeed.getMnemonicString()` to do the string concatenation.
* Deprecate `Transaction.MIN_NONDUST_OUTPUT` and `NetworkParameters.getMinNonDustOutput()`,
  and remove `DefaultRiskAnalysis.MIN_ANALYSIS_NONDUST_OUTPUT`.
  The dust threshold has always been dependent on the actual output script type. Even more so with the
  segwit discount. So use `TransactionOutput.getMinNonDustValue()` or `.isDust()`.
* Accept `OP_FALSE` and `OP_TRUE` in `ScriptOpCodes.getOpCode()`.
* Remove `ScriptChunk.startLocationInProgram`. This is breaking, if you have used it.
* The `AppDataDirectory` class has been moved from `bitcoinj-wallettemplate` to `bitcoinj-core`, so it can be used by tools.
* Update seeds in various network parameters.
* Remove methods `Utils.maxOfMostFreq()`.
* Rename parameter of `AbstractBitcoinNetParams.isRewardHalvingPoint()` and `.isDifficultyTransitionPoint()` to make unexpected API more obvious.
* Remove unused mock sleep support from `Utils`.
* Add `Comparable` interface to `Address`, remove from `PrefixedChecksummedBytes`.
  Requires address subclasses to implement `compareTo()` and provide the `compareAddressPartial()` method for comparing the first two fields.
  This changes the natural ordering of addresses, and removes the natural ordering entirely for other `PrefixedChecksummedBytes` subclasses.
  It also fixes a bug where in some corner cases different addresses could appear equal in a call to `compareTo()`.
* New conversion helpers in `Coin`: `btcToSatoshi()`, `satoshiToBtc()`, `ofBtc()`, `toBtc()`.
* Add `Transaction.toHexString()` for converting a transaction to raw hex format.
* Deprecate non-segwit variant of `Script.correctlySpends()`.
* Cut short script execution in `Script.correctlySpends()` for the standard P2PK and P2PKH cases. They are matched by pattern now.
* Introduce `VarInt.intValue()` and `.longValue()` accessors.
* Remove Java serialization from `UTXO`.
* Migrate constructor that takes a stream to a static constructor `UTXO.fromStream()`.
* Add method `Block.createGenesisTransaction()`.
* Ignore `time` in `PeerAddress.equals()`/`.hashCode()`.
* Replace deprecated `AccessControlException` by `SecurityException` in `Secp256k1Context`.

## Version 0.15.10

This is a bug fix and maintenance release. Notable changes:

* Migrate repository from JCenter to Maven Central. JCenter is shutting down.
* Updates BouncyCastle to 1.68. This makes it necessary that bitcoinj tracks point compression itself, rather
  than BouncyCastle.
* Fixes for blockchain confirmations of outgoing P2WPKH transactions sometimes missed.

For a thorough list of changes, see the git history.

## Version 0.15.9

This is a bug fix / maintenance release:

* Fix P2WSH signing.
* Fix listeners when decrypting/encrypting key chains.
* Make PostgresFullPrunedBlockStore compatible with CockroachDB.

## Version 0.15.8

This is a bug fix / maintenance release:

* Fix/remove special handling of single connected peer case.
* Add PeerGroup.dropAllPeers() for gracefully dropping all connected peers.

## Version 0.15.7

This is a bug fix / maintenance release:

* Introduce a peer priority for connecting and being picked as for chain download.
* Implement service bit filtering for DnsDiscovery.
* When a transaction is broadcast, peers being broadcasted to are disconnected afterwards. Others will take their place.
  This improves privacy and avoids rarely tested code paths.
* Update dependencies:
  * JUnit to 4.13,
  * slf4j to 1.7.30,
  * OkHttp to 3.12.8,
  * Guava to 28.2-android.

## Version 0.15.6

This is a bug fix / maintenance release:

* Select a download peer only if there is a clear consensus about a common chain height between connected peers.
* For database-backed block stores, make sure the openoutputs.toaddress column is big enough for Bech32 addresses (74 chars).
  Existing database schemas should be updated manually.
* Update hardcoded DNS seeds and seed node addresses.

## Version 0.15.5

This is a bug fix / maintenance release:

* Fix issue with Bloom filtering of P2WPKH transactions that send anything back to the wallet (e.g. sweeping).

## Version 0.15.4

This is a bug fix / maintenance release:

* Update dependencies:
  * BouncyCastle to 1.63,
  * slf4j to 1.7.28,
  * Guava to 27.1-android,
  * OkHttp to 3.12.3.
* Use Bouncy Castle's Scrypt implementation rather than the standalone library.
* Fix minor bugs.
* Improve some logging.

## Version 0.15.2

This is a bug fix / maintenance release:

* Various crash fixes for basic wallets.
* BitcoinURI: Allow uppercase schema.
* KeyCrypterScrypt: Migrate AESFastEngine to AESEngine. See https://nvd.nist.gov/vuln/detail/CVE-2016-1000339
* Fix script type in deprecated Wallet.findKeyFromPubHash().
* Fix/improve a lot of logging.

## Version 0.15.1

This is a bug fix / maintenance release:

* Fix crash when Wallet.isAddressMine() is called with a P2SH or a P2WSH address.

## Version 0.15

Wallet:

* Use `Wallet.createBasic()` if you want just a basic keychain and no key derivation.
* Use `Wallet.createDeterministic()` if you want a deterministic keychain.
* Avoid the old-style contructors, they are now mostly deprecated.

Segregated witness:

* Bech32/Native Segwit addresses are supported via the new `SegwitAddress` class. The `Address` class for old Base58 addresses has been renamed to `LegacyAddress`.
  A new common ancestor class tries to stay compatible to the old `Address` class as closely as possible. Notable changes:
  * Use `Address.fromKey()`, `LegacyAddress.fromKey()` or `SegwitAddress.fromKey()` rather than the removed `ECKey.toAddress()`.
  * Use `Address.fromString()`, `LegacyAddress.fromString()` or `SegwitAddress.fromString()` rather than the deprecated `Address.fromBase58()`.
  * Use `Address.toString()` rather than the deprecated `toBase58()`.
  * Use `Address.getHash()` rather than the deprecated `getHash160()`.
  * The new base class for the entire hierarchy is now `PrefixedChecksummedBytes` rather than `VersionedChecksummedBytes`.
  * Exceptions:
    * Renamed `WrongNetworkException` to `AddressFormatException.WrongNetwork`.
    * Add `AddressFormatException.InvalidChecksum` that is thrown when a Base58 or Bech32 checksum is invalid.
    * Add `AddressFormatExcepiion.InvalidCharacter` that is thrown when a character is used that is invalid in the encoding.
    * Add `AddressFormatException.InvalidDataLength` that is thrown when the data part isn't of the right size.
    * Add `AddressFormatException.InvalidPrefix` that is thrown when the prefix (version header or HRP) is invalid.
* New low-level utility classes `Bech32` (thanks Coinomi) and `Base58` (extracted from the old `Address` class).
* New low-level methods for calculating witness signatures `Transaction.calculateWitnessSignature()` and
  witness signature hashes `hashForWitnessSignature()` (thanks Chang Ming)
* Support for sending to any segwit address (Bech32 or Base58).
* Support for receiving to and spending from `P2WPKH` (native segwit addresses).
* `DeterministicKeyChain` now has an output script type, which determines the type of addresses derived.
* Made the `BitcoinURI` class aware of native segwit addresses.
* New `TransactionWitness` class that holds the script witnesses (thanks Nicolas Dorier, Oscar Guindzberg, Fabrice Drouin).
* Use `Transaction.getTdId()` or `getWTxId()` rather than `getHash()` and `getHashAsString()`.
* Support for new extended public keys: `zpub` (Mainnet) and `vpub` (Testnet) for `P2WPKH` chains via `Wallet.fromWatchingKeyB58()`.
* `KeyChainGroup` now manages multiple active keychains (sharing a common seed). The newest active keychain is the default.
  All other active keychains are meant as fallback for if a sender doesn't understand a certain new script type.
* Limitation: Full verificiation is incomplete for Segwit (as it always was for pre-segwit as well). However a few basic building blocks are implemented:
  * Blocks are fetched including witnesses.
  * New method `Transaction.findWitnessCommitment()` to find the witness commitment (if any) in a coinbase transaction.
  * New methods `Block.getWitnessRoot()` to calculate the witness root hash, and `checkWitnessRoot()` to check it.

Block store:

* `SPVBlockStore` can now be configured to a larger capacity. Migration for growing blockstores is seamless, while shrinking is unsupported. 
* `SPVBlockStore` got rid of the mmap hack that is needed for Windows, but prevents Java 9 compatibility.

Networking (Peer, PeerGroup):

* Also connect to peers which serve only the last two days worth of blocks (`NODE_NETWORK_LIMITED`), but download only from those
  that have the full blockchain (`NODE_NETWORK`).
* Peer is now dropping Bitcoin Cash nodes early.
* Peer now requests witnesses for transactions.
* Peer will honor `NODE_BLOOM` if bloom filtering is configured.

Persistence (Protobuf):

* The wallet protobuf has changed:
  * The outptScriptType of a `DeterministicKeyChain` is persisted. Chains in old protobufs are assumed to be of
    type `P2PKH`. As long as you don't use `P2WPKH` chains, you can switch back and forth bitcoinj 0.14 and 0.15.
  * The `TransactionSigner` message has been removed, as the entire concept of stateful transaction signers. If
    you haven't used stateful transaction signers, you can switch back and forth bitcoinj 0.14 and 0.15.
  * A new `ScriptWitness` message is stored with `TransactionInputs`. It's currently not terribly useful, since after
    braodcasting of transactions it isn't needed by bitcoinj and script execution isn't implemented for segwit yet.
    If you switch from pre-0.15 to 0.15 and you've got unbroadcasted witness transactions in your wallet, those will not
    be accepted by the network any more.
* The buffer size used for the saving of wallets can now be specified using
  `WalletProtobufSerializer.setWalletWriteBufferSize()` (thanks Justas Dobiliauskas).
* Loading wallets can be made to fail on an unknown extension via
  `WalletProtobufSerializer.setRequireAllExtensionsKnown()` (thanks Jarl Fransson).

Full verification:

* Implemented the `CHECKSEQUENCEVERIFY` script operator (thanks Nicola Atzei).
* Added `ScriptBuilder.opTrue()` and `opFalse()` helpers (thanks Nicola Atzei).

Misc:

* `Transaction.calculateSignature()` now supports signing with an encrypted key (thanks Will Shackleton).
* Increased the `OP_RETURN` payload limit to 80 bytes (thanks johnygeorge).
* New method `AbstractBitcoinNetParams.isRewardHalvingPoint()` tells if a certain height is a reward halving point.
* Added `ClientChannelProperties` and `ServerChannelProperties` to allow configuration of payment channels (thanks cyberzac).
* `Monetary.parseCoinInexact()` and `Fiat.parseFiatInexact()` works like their exact counterparts except that they round rather than throw on fractional satoshis.
* `SendRequest.recipientsPayFees` will make the recipients pay the fee, rather than the sender as usual.
* New `SendHeaders` message (thanks Anton Kumaigorodski).
* Moved `ScriptException` from the `.core` to the `.script` package.
* Support for version 2 transactions.
* Support for creating wallets with an arbitrary account path (thanks Nelson Meilna, Giuseppe Magnotta).
* Wallets can also follow an account structure using the new `KeyChainGroupStructure` class. `KeyChainGroupStructure.DEFAULT` is used as a default.
* New class `ScriptPattern` offers matchers and data extractors for the common types of scripts (thanks John L. Jegutanis). 
* Ability to import an account key that allows for a wallet to spend from it (thanks HashEngineering, Nelson Melina).
* The `UTXOProvider` interface has been changed to take a list of publlic keys rather than addresses.
* The `Script.ScriptType.PUB_KEY` has been changed to `P2PK` to be more consistent with the other script types.
* The address fields in `VersionMessage` were confusing. They're now clearly named `fromAddr` and `receivingAddr`.
* New `BlockLocator` class to represent block locators as used in `GetBlocksMessage` and `GetHeadersMessage` (thanks BigAdam2005).
* Removed most constructors from `KeyChainGroup`, `DeterministicKeyChain` and `MarriedKeyChain`. Please use the `builder()` helper
  and follow the builder pattern.
* New `Wallet.isAddressMine()` and `findKeyFromAddress()` convenience methods.
* Method `KeyBag.findKeyFromPubHash()` has been renamed to `findKeyFromPubKeyHash()` for consistency.
* Add `TransactionInput.getIndex()` helper, same as the already existing `TransactionOutput.getIndex()`.
* Many `toString()` implementations have been added or reformatted for better readability.
* The bundled checkpoints have been updated to the 2019 era.
* The bundled seeds have been updated.
* Most dependencies have been brought up to the latest versions. We switched back from SpongyCastle to BouncyCastle.
* Adjusted `DEFAULT_TX_FEE`, `REFERENCE_DEFAULT_MIN_TX_FEE` and `MIN_NONDUST_OUTPUT` to the 2019 era.
* `WalletAppKit`, Wallet-Tool and Wallet-Template have been brought up to date with the new features -- most notably segwit.
* Add `Utils.isLinux()` and `isMac()` helpers to complement the existing `isWindows()` helper.
* Likewise, add `Utils.isOpenJDKRuntime()` and `isJavaSERuntime()`.
* New `MonetaryFormat()` constructor that uses the new Unicode Bitcoin symbol at code point `U+20BF`.
* Many bugs have been fixed. For details see the git log.

Removals:

* Removed Tor support via Orchid. If you need Tor, you could configure it at OS level.
* Finally removed `TransactionInput.getFromAddress()` and `Script.getFromAddress()`.
* Removed `acceptableAddressCodes` from `NetworkParameters`. The two codes we will likely ever need are now hardcoded.
* Removed `WalletEventListener`. Use one or more of the finer grained listners instead.
* Removed concept of stateful transaction signers.
* TestNet2 is gone. Use TestNet3.
* Remove ability to change default `KeyChainGroup` lookaheadSize and lookaheadThreshold after construction. Use
  the builder, or manage lookahead on `DeterministicKeyChains` directly.
* There is no implicit wallet upgrade (e.g. from Basic to Deterministic) any more, since for encrypted wallets this
  requires the encryption key. Use `Wallet.upgradeToDeterministic()` explicitly.
* The bundled jar is gone from the distribution.

Development:

* Gradle for building!
  * `gradle test` to run the unit tests
  * `gradle build` to build
  * `gradle install` to install the aritfacts into your local Maven repository
  * `gradle eclipse` to generate the Eclipse project files
* Java requirements:
  * `.core` can now use Java 7 language features and Java 7 API / Android API level 19.
  * `.wallettemplate` now uses Java 11.
  * `.examples` and `.tools` stay at Java 8.
* The Travis configuration has been updated to use their Ubuntu Xenial image.
* The build has been made compatible with Jitpack, so you can use it to fetch pre-compiled development SNAPSHOTs. See the README.md
  for more information.
* Manual installation of the `protoc` protobuf compiler is not necessary any more.

## Version 0.14.7

This is a bug fix / maintenance release:

* Fix DoS vector in Transaction.
* New WalletFiles.getWallet() for getting the wallet that is managed by the WalletFiles.
* Bugfixes with autosaving wallet after shutdown.
* Another context propagation fix.

## Version 0.14.6

This is a bug fix / maintenance release:

* New methods Transaction.hasRelativeLockTime() and TransactionInput.hasRelativeLockTime().
* DefaultRiskAnalysis looks at version 2 transactions more closely and dislikes only those which have a relative lock time set.
* Fix minimal number encoding in scripts for -1. This could lead to delayed confirmation for the affected transactions.
* Fix base58 representation of DumpedPrivateKey for the case where the key is compressed.
* Slash minimum fee by factor 5 to 1000 satoshis.

## Version 0.14.5

This is a bug fix / maintenance release:

* Disconnects from incompatible peers much quicker.

## Version 0.14.4

This is a bug fix / maintenance release:

* Fixed a protobuf wallet corruption if a transaction version 2 is received and added to the wallet.

## Version 0.14.3

This is a bug fix / maintenance release:

* Fixed a crash when broadcasting unconfirmed transactions after two conflicting transactions were received.
* The OP_RETURN limit was doubled to allow 80 bytes.

## Version 0.14.2

This is a bug fix / maintenance release:

* Fixes a rare occurence of wrong balance calculation.
* Misc other bug fixes.

## Version 0.14.1

This is a bug fix / maintenance release:

* There are no code changes. The quick followup release in order to get all binaries deployed to Maven Central.

## Version 0.14

* Thanks to Ross Nicoll, BIP 34 (height in coinbase) is now supported and enforced in fully verifying mode.
* The Wallet code has been optimised again.
* The Travis build now runs on their new container-based infrastructure and skips tests that require the network.
* The concept of lazy parsing of the `Message` hierarchy has been removed.
* Block stores:
  * All database backed block stores now expect lowercase column names (if their database engines care).
  * There is a new `LevelDBFullPrunedBlockStore`!
  * The `H2FullPrunedBlockStore` constructor now accepts database credentials.
* Tools:
  * The BuildCheckpoints tool now takes a couple of options (e.g. the desired network). Also see the --help option.
  * Wallet-tool now can set the creation time of wallets, both retroactively and when creating a read-only wallet from an xpub.
  * Wallet-tool also now uses checkpoints to speed up the blockchain sync.
* Thanks to Oscar Guindzberg, the wallet now supports double spend forwarding. Two pending transactions double spending each other will be moved into the IN_CONFLICT state until the conflict is resolved.
* Fee related changes:
  * There is no "base fee" any more. All fees are to be specified as a fee rate (fee per kB).
  * Fee is calculated on byte precision (rather than kB). Still all fee rates are per kB.
  * The cent rule is removed.
  * The REFERENCE_DEFAULT_MIN_TX_FEE is now 5000 satoshis, and thus MIN_NONDUST_OUTPUT is now 2730 satoshis.
  * A new `Transaction.DEFAULT_TX_FEE` constant is used for the default fee rate.
* The pull-tester tool (BitcoindComparisonTool) isn't packaged into pull-tests.jar any more.
* Many misc cleanups and bug fixes.
* There is a new HTTP seed available for the main network.
* The wrappers for the native ECDSA implementation have been updated for the latest libsecp256k1.

API changes:

* Event listener APIs (for example on peer, peer group and wallet) are split into single-method interfaces, enabling easy use from languages that support lambda functions. The old functions and interfaces are still available but deprecated. This change to separate interfaces for each event means new events can be added without breaking existing code.
* Coin API:
  * New method aliases to activate operator overloading support in Kotlin.
  * No chain-specifc limit of its value any more. The inherent long limit still applies though.
* ProtobufParser, StreamParser and friends have been renamed to ProtobufConnection, StreamConnection etc to better reflect what they actually do.
* Checkpoints:
  * CheckpointManager now exposes a `openStream(NetworkParameters)` method to get an InputStream to the bundled checkpoints.
  * The bundled checkpoints are now text bases, for easier audit. The binary format is still supported though.
* Transaction.Purpose has a new value RAISE_FEE to indicate transactions that are simply meant to raise the fee of a previous transaction.
* The VersionChecksummedBytes hierarchy now has a consistent fromBase58/toBase58 API.
* These classes don't support Java serialization any more: ECKey, DeterministicKey, NetworkParameters, Block, StoredBlock, StoredUndoableBlock, TransactionConfidence, UTXO, DeterministicHierarchy, MemoryFullPrunedBlockStore, KeyCrypterScrypt, Wallet and the entire Message hierarchy.
* Context now has a strict mode. If enabled, it throw if a Context is needed but doesn't exist.
* Improvements to message serialization:
  * A common `MessageSerializer` interface has been extracted from `BitcoinSerializer` so that other implementations can be plugged.
  * Support for variable length block headers has been added.
* There is now a specific `ChainFileLockedException` if a lock on a block store file could not be acquired.
* `AddressFormatException` is now unchecked.
* Better support for services in the seeds:
  * `PeerDiscovery.getPeers()` now requires a services bitmask, which is used when querying HTTP seeds.
  * A new `MultiplexingDiscovery forServices()` returns an appropriate MultiplexingDiscovery.
  * PeerGroup can be told to connect only to peers that serve specific services with a new `PeerGroup.setRequiredServices()`.
* A new `WalletProtobufSerializer.readWallet()` variant allows to load a wallet without loading its transactions. This is useful if you were going to reset it anyway.
* A new `PeerGroup.setPeerDiscoveryTimeoutMillis()` allows to set the peer discovery timeout.
* Protocol versions needed for specific features are now stored in the NetworkParameters.
* A couple of new `Block.isBIP()` variants tell if a block conforms to a specific BIP.
* Payment channels:
  * Thanks to Will Shackleton, there is now support for modern CLTV-based payment channels!
  * `StoredPaymentChannelServerStates.getChannelMap()` exposes a copy of the channel map.
* The whole `org.bitcoinj.testing` package has been moved to the test classpath.
* A new `BitcoinURI.convertToBitcoinURI()` variant allows to generate URIs for non-Bitcoin networks.
* Wallet/SendRequest/Transaction improvements:
  * All wallet related classes have been moved to the `org.bitcoinj.wallet` package!
  * New `Wallet.isConsistentOrThrow()`, a variant of `.isConsistent()` that throws an exception describing the inconsistency.
  * New statistical methods in Wallet: `getTotalReceived()` and `getTotalSent()`.
  * There is now a `TransactionInput.clearScriptBytes()`.
  * New `TransactionOutput.isDust()` to determine if a transaction containing that output is relayable.
  * `TransactionInput.isOptInFullRBF()` and `Transaction.isOptInFullRBF()` tell if a transactions opt into being replaced. DefaultRiskAnalysis uses this to evaluate these transactions as risky.
  * Moved `Transaction.isConsistent()` to `Wallet.isTxConsistent()`.
  * `Wallet.getChangeAddress()` is now called `.currentChangeAddress()`.
  * Added `TransactionConfidence.lastBroadcastedAt`, the time a transaction was last announced to us.
  * Renamed `Wallet.doesAcceptRiskyTransactions()` to `.isAcceptRiskyTransactions()`.
  * SendRequest is now a top level class.
  * New `SendRequest.childPaysForParent()` method to construct a CPFP transaction.
* Peer:
  * The initial handshake now needs to complete both directions for the protocol to continue.
  * `Wallet.getDownloadData()` was renamed to `.isDownloadData()`.
  * `Wallet.getDownloadTxDependencies()` was renamed to `.isDownloadTxDependencies()`.
  * A maximum recusion level when requesting dependent transactions can be configured with `.setDownloadTxDependencies()`.
  * `Wallet.getKeyRotationTime()` will now return null if left unconfigured.

## Version 0.13.6

This is a bug fix / maintenance release:

* Fix protobuf serialization of large sequence numbers.
* Wallet: Fix bug in cleanup() that sometimes would put foreign outputs in myUnspents
when disconnecting. This wrongly increases the balance.

## Version 0.13.5

This is a bug fix / maintenance release:

* Evaluate incoming RBF transactions as risky.
* The "max coins" checks have changed a bit: Previously a wallet
could be rendered inconsistent by receiving a few transactions that add
up to a balance higher than max coins. Now, this state is allowed while
the obviously fake transactions will go dead at some time. Note a single
transaction with a value higher than max coins is still invalid.

## Version 0.13.4

This is a bug fix / maintenance release:

* Adjusts the minimum network fee to the one imposed by Bitcoin Core.
* Peer dicovery timeout is now configurable via a new method PeerGroup.setPeerDiscoveryTimeoutMillis().
* Those using an SQL block store need to migrate their schema to use lower case column names only.

## Version 0.13.3

This is a bug fix / maintenance release:

* Handle the "high/low S signature component" malleability.

## Version 0.13.2

This is a bug fix / maintenance release:

* Some bugs/regressions were fixed.

## Version 0.13.1

This is a bug fix / maintenance release:

* There are no code changes. The quick followup release in order to get all binaries deployed to Maven Central.

## Version 0.13

From most to least notable:

* Major performance improvements:
  * Chain sync is now faster
  * Much faster handling of large wallets, especially on Android.
  * Tor bootstrap is significantly faster, and is now just a couple of seconds on desktops once the local caches are warm. This takes us one step closer to Tor-by-default.
* Thanks to Kalpesh Parmar:
  * A MySQL block store has been added, it has the same feature as the PostgreSQL block store (can index the UTXO set and do balance queries for arbitrary addresses)
  * The Wallet class can now be connected to a UTXO database such as those created by the MySQL or Postgres block stores (or a remote block explorer). Unspent transaction outputs will be fetched from the given `UTXOProvider` for the purposes of creating spends and calculating the balance. Combined with the HD wallet support this allows for server side wallets with much higher scalability than previously possible.
* A LevelDB SPV block store has been added. It doesn't store the UTXO set or block contents, but lets you quickly look up any block header by hash, if you need that.
* Checkpoints have now been integrated into the WalletAppKit class so you don't need to set them up manually any more when using the JAR. Dalvik/Android users still must do it themselves, as classes.dex files cannot contain embedded files.
* PeerGroup now implements a stalled peer detector: peers that are serving us the chain slower than a configurable bytes/second threshold will be disconnected and chain download will restart from another. The defaults are chosen conservatively so only peers that can't filter >20 blocks per second will trigger a stall.
* There is now support for HTTP seeds using the Cartographer protocol, which gives signed and thus auditable results.
* Support for the `getutxos` message defined in BIP 65 has been added.
* Some improvements to the WalletTemplate app. You can now send any amount out, and password scrypt hashing strength adaptation was improved.
* Tor tweaks:
  * Track directory authority changes: turtles has been replaced by longclaw.
  * A workaround for thread safety bugs in some Linux glibc's has been added, which resolves a segfault that could occur when trying to use Tor.
* A new `Context` class has been introduced. Using Context is optional currently but will over time replace NetworkParameters in most cases as the general global object. A Context will be created and propagated between threads automatically for you in the 0.13 release as a backwards compatibility aid: however it is recommended that you create a Context yourself and pass it into core objects like Wallet and PeerGroup when possible to make the transition easier. In future, Context will hold various bits of configuration and global state that different parts of the library can use, to reduce repetitive re-configuration and wiring.
* `MarriedKeyChain` can now be constructed with a watching key.
* Thanks to Jarl Fransson, the payment channels library now has support for encrypted wallets.
* TransactionBroadcast has been improved and now recognises network rejection via the reject message much more reliably.
* Default number of peers has been bumped to 12 from 4 to avoid issues with flaky transaction broadcasts. Most wallet apps already have a similar change at the app level already.
* Thanks to Mike Rosseel, peer discovery now works differently: peers handed back by a `PeerDiscovery` implementation are used in order and discoverers will be polled until a configurable max is reached, rather than stopping as soon as any discoverer returns peers.
* The `LinuxSecureRandom` class that works around the Android random number generator faults has been integrated with bitcoinj and will be used automatically when appropriate. LinuxSecureRandom just reads entropy from /dev/urandom and bypasses the buggy userspace RNGs that all Android devices have shipped with. This change should help avoid issues with new Android developers that aren't branching existing wallets and haven't heard about the problems affecting the platform.
* Thanks to Matt Corallo and Dave Collins, there are many improvements to the block tester.
* References to prodnet have all been replaced with the more standard "main net" terminology.
* Thanks to Amichai Rothman for many code cleanups.
* Many, many bug fixes, small tweaks and new APIs, more API sanity checks and so on.

API changes:

* The `wallet.getBalance()` call now returns the balance *including* watched addresses/outputs. To exclude watched outputs you should use `wallet.getBalance(BalanceType.AVAILABLE_SPENDABLE)` (or `ESTIMATED_SPENDABLE` to include 
immature coinbases and unconfirmed transactions). If you were previously using `wallet.getWatchedBalance()` this is now a deprecated alias.
* The Script constructor no longer sets the creation time to the current time. If you're adding scripts to the wallet via `wallet.addWatchedScript()` then you should take care to set the creation time to something sensible and appropriate for your app, as otherwise you may end up with a wallet that has a creation time of zero meaning it will never use the checkpointing optimisation (as it doesn't know when the script might appear in the chain). You will see a log warning if you forget to do this.
* `PeerEventListener` has a new `onPeersDiscovered` event and the `onBlocksDownloaded` event now receives `FilteredBlock` objects when Bloom filtering is enabled. This allows apps to use the Merkle proofs calculated by remote peers for their own ends.
* The `PeerFilterProvider` interface has replaced the `getLock` method with begin/end methods.
* Changes to the `TransactionConfidence` API:
  * The `getBroadcastBy()` method now returns a set instead of an iterator.
  * Thanks to a collaboration with devrandom, confidence objects are no longer owned by Transaction objects: two different Transaction objects that represent the same logical transaction (i.e. same hash) will return the same confidence object from their `getConfidence()` methods. This eliminates bugs that could occur in previous versions if you ended up with the same transaction deserialized twice. Additionally confidence objects now pin themselves to the root object set when a listener is added to them, thus avoiding a common class of bugs in which a transaction is received from a network event listener, another listener is added to the confidence object and then it never runs because the entire object hierarchy gets garbage collected. These changes should be transparent to your app; they are here to remove sharp corners from the API and enable future scalability improvements.
* As part of the previous change the `MemoryPool` class has been renamed to `TxConfidenceTable` and has a significantly different internal implementation and API. It is unlikely you were directly using this class, but if you were you may need to adapt your code.
* `PeerGroup.broadcastTransaction` now returns a `TransactionBroadcast` object instead of a future: you can fix your code by just adding a `.future()` call on the result.
* `DownloadListener` has been renamed to `DownloadProgressTracker`
* `PeerGroup.addPeerFilterProvider` and `ClientConnectionManager.openConnection` now return futures instead of nothing.
* PeerGroup no longer implements the Guava service interface. It has its own start/startAsync and stop/stopAsync methods. You no longer need to call `awaitRunning()` or `awaitTerminated()` which have been removed.
* The PeerGroup lock is no longer held whilst invoking Bloom filter providers: this helps you to avoid circular deadlock when calling back into bitcoinj from inside your provider.
* Thanks to Jarl Fransson, when deserializing a wallet the lock order is now always `wallet->extension`.
* `Coin.parseCoin()` now throws IllegalArgumentException instead of ArithmeticException if the given string would result in fractional satoshis.

## Version 0.12.3

This is a bug fix / maintenance release:

* New Wallet APIs:
  * Wallet.reset() to prepare the wallet for a blockchain replay 
  * Wallet.getIssuedReceiveKeys()/getIssuesReceiveAddresses() for knowing the derived keys/addresses. 
* Syncing the blockchain on Android devices should be approximately twice as fast with large wallets. Also, loading wallets is considerably quicker.
* Misc small bug fixes.

## Version 0.12.2

This is a bug fix / maintenance release:

* Various fixes to wallet/keychain locking which frequently caused deadlocks. 
* In some cases, advancing the current address wasn't persisted, resulting in re-use of addresses. This is now fixed.
* Better support for OP_RETURN: Anti-dust rules do not apply, and we now can build these scripts using ScriptBuilder. 
* Tor directory authorities: switch out turtles for longclaw to track upstream changes.
* Misc small bug fixes.

## Version 0.12.1

This is a bug fix / maintenance release:

* 10x fee drop by default.
* Fixes to key rotation. HD upgrades now take place using keys past the rotation time regardless of whether the rotation feature is enabled. HD chains can be rotated to new HD chains based on non-rotating random keys.
* Updates and new docs for the wallet maintenance API.
* A small bugfix to micropayment channels.
* Don't try IPv6 peers again if the first IPv6 attempt fails with "no route to host"
* Narrow the wallet lock to allow faster/lower latency access to the key chain and methods that use it.
* Misc other bug fixes.

## Version 0.12

* Privacy enhancements:
  * Wallets are now hierarchical and deterministic (HD) by default, using the BIP32 specification. Support for mnemonic codes (BIP 39) is also included. Change and receive addresses are no longer being reused. Old wallets are upgraded in place using the private key of the oldest non-rotating key as the seed bytes, so old backups remain valid.
  * Thanks to devrandom, we have an integrated Tor mode using the Orchid library. The user does not have to install the Tor client as it's all pure Java. WalletAppKit users can enable usage of Tor with a single line of code. This support should be considered experimental for now.
* Thanks to Kosta Korenkov, we have an experimental multisig wallets implementation. Multisig (also "married") wallets are HD wallets that are connected to a third party risk analysis service or device. When married, the wallet tracks multiple BIP32 key trees, keeps them in sync and starts vending P2SH addresses.
  * As part of this work, transaction signing is now pluggable. TransactionSigner implementations can be added to the wallet and will be serialized into and out of the users saved wallet file. Signers are given a transaction to sign in sequence. This is intended for risk analysis providers to provide a class that talks to their server to get a signature of the right form, so that all bitcoinj based wallets can be easily upgraded to support the new provider.
* Reject messages are now deserialized and logged, though not yet exposed in the API.
* Upgraded to Guava 16 and Bouncy Castle 1.51. Thanks to Peter Dettman and the rest of the Bouncy Castle team, bitcoinj now uses deterministic ECDSA for signing and we're now using an accelerated secp256k1 implementation that exploits the special properties of this curve, for dramatically faster calculations.
* Payment protocol code improvements:  Some X.509 utility code was refactored out of PaymentSession for general usage. StartCom was added to the default trust store which was promoted to override the system trust store on non-Android platforms. A command line tool to dump requests to stdout was added.
* Thanks to Andreas Schildbach:
  * We are now BIP62 (canonical push encodings) compliant.
  * A new Coin class replaces usage of BigInteger for marking values that are quantities of bitcoin. Formatting has moved into the new MonetaryFormat class.
  * The wallet now saves the fee paid on transactions we calculated ourselves. This is useful for putting it into a wallet user interface.
  * Transactions can have user memos and exchange rates attached, that will be saved by the wallet.
  * Support for decrypting BIP 38 protected private keys has been added.
  * Checkpoints can now be stored textually as well as in the old binary format.
* There is also a new BtcFormat API that provides an alternative to MonetaryFormat that plugs in to the java.text framework.
* Added new DNS seed from Addy Yeow.
* Wallets can now have string->byte[] mappings attached to them, for lighter weight extensions.
* Thanks to Richard Green, there is now a Python version of the ForwardingService program from the getting started tutorial. This shows how to use bitcoinj from Python using the Jython interpreter.
* bitcoinj now probes localhost for a Bitcoin node and automatically uses that instead of the P2P network, when present. This means any bitcoinj based app can be easily upgraded from SPV to full security just by running Core at the same time: no setup needed.
* Thanks to Michael Bumann, there are now more example apps showing how to use parts of the API.
* WalletTemplate/WalletAppKit improvements. WalletTemplate is a demo app that shows how to create a cross-platform GUI wallet with a modern style and 60fps animations. WalletAppKit is a very high level API for creating apps that have a Bitcoin wallet:
  * Now supports mnemonic code and restore from seed words. A date picker is provided to cut down on the amount of chain that needs to be rescanned. 
  * Support for encrypting wallets. Password is requested when needed. The difficulty of the scrypt function is selected to always take a fixed number of seconds even if hardware gets more powerful.
  * Some new animation and utility code backported from Lighthouse.
  * Tor support
* Thanks to Martin Zachrison, the micropayment channels implementation has received various improvements.
* Thanks to Eric Tierney (Circle), the Postgres store can now take a custom schema.
* The Bloom filtering API has been extended so FilteredBlock objects can now be produced from Block objects given a BloomFilter. Previously there was support for client-side Bloom usage but no implementation of the generation part.
* Many other bugfixes, cleanups, minor tweaks and small new APIs.

Documentation and tutorials:

* A JavaScript tutorial has been added, showing how to use bitcoinj from this language. More tutorials in other languages will come in future.
* The "Working with the wallet" document has been significantly extended to cover encryption, watching wallets, HD wallets and multisig/married wallets.
* A new document and accompanying screencast shows how to extend the WalletTemplate app to have a transactions list, and then make a native/bundled packages that don't need the user to install Java. By following this tutorial you will learn how to make a basic cross platform desktop wallet of your own.
* All other docs were refreshed to the latest APIs.

API changes:

* The package name has changed to org.bitcoinj and the core Maven artifact name is now "bitcoinj-core". You can auto-port most of your code by running `find . -name '*.java' | xargs sed -i .bak 's/com.google.bitcoin./org.bitcoinj./g'`
* Wallet.completeTx now throws more precise unchecked exceptions in edge cases, instead of IllegalArgumentException.
* The use of BigInteger to represent quantities of Bitcoin has been replaced with the more efficient, type safe and useful class Coin. Coin is mostly source compatible with BigInteger so you can probably just do a search and replace to update your codebase. Utils.bitcoinValueToFriendlyString and friends moved to CoinFormat.
* NetworkParameters.getProofOfWorkLimit was renamed to getMaxTarget for consistency with other Bitcoin codebases.
* The library no longer uses the misleading term "nanocoins" to mean satoshis (the old term predated the use of the word satoshi to describe the smallest possible amount of bitcoin).
* TransactionConfidence no longer tracks total work done.
* Because outputs are now shuffled any code during that assumes the ordering is preserved will break. You can set the shuffleOutputs field of SendRequest to false to disable this behaviour if you need to.
* The ECKey and HD API's have changed quite a bit: several constructors were replaced with clearer static factory methods that make it more obvious how their parameters are interpreted. The new methods don't change their behaviour depending on the pattern of nulls passed into them.
* Some unit testing utilities have been moved to the new testing subpackage and cleaned up/rearranged. It should be easier to write unit tests for your app that need a simulated network now. DeterministicKey now derives from ECKey.
* We now use Utils.HEX.encode() and Utils.HEX.decode() to do translation to and from base 16.
* Transaction.hashTransactionForSignature was renamed to just hashForSignature.
* The subVer string sent by bitcoinj now has a lower cased first component.

## Version 0.11.3

This is a bugfix release.

* Various fixes to Bloom filtering for failures that could occur in rare edge cases.
* A fix for transactions that are dropped by risk analysis and then later confirmed.
* Fix wallet autosaving on Windows.
* Minor security fix for non-ncaonical block difficulty encodings. Thanks to Sergio Damian Lerner for the report.
* DNS seeds update
* Now throws a transaction if a BIP70 payment request doesn't match the expected network params.
* A few other small misc changes.

## Version 0.11.2

This is a bugfix release.

* Risk analysis following the fee drop: you MUST upgrade to get this, or else users will start missing transactions sent to them.
* Fix a crash that can occur when connecting to a peer that reports a chain height of zero.
* Fix backoff behaviour so when the network is down and discovery fails, things backoff properly.
* Email addresses are now extracted properly from S/MIME certs.
* Disallow adding of keys that don't match the wallet's encryption state.
* Correct handling of OP_0 (full verification mode)
* A bundled/unified JAR is now always built.
* Misc other crash and bug fixes.

## Version 0.11.1

* Wallet default risk analysis now drops dust transactions by default. A new cleanup() method is added to drop risky (i.e. not going to confirm) transactions that were allowed into the wallet by previous versions.
* PkiVerificationData.rootAuthorityName now exposes a user friendly name of the CA that verified the certificate of a payment request.
* A bloom filter bug was fixed that stopped filters from updating when a key was added. 
* Wallet.toString() was re-arranged so that its mostly sorted from new to old.

## Version 0.11

Notable changes and new features:

* Thanks to Ken Sedgwick, an implementation of [BIP39 ("Mnemonic code for generating deterministic keys")](https://en.bitcoin.it/wiki/BIP_0039) has been added. This is compatible with the latest Trezor implementation.
* Thanks to Mike Belshe, the wallet can now send to P2SH addresses.
* Thanks to Matt Corallo, the network layer was rewritten from scratch. It no longer depends on Netty, and it now supports both blocking and non-blocking sockets. In practice that means Java's built in support for transparent SSL and SOCKS becomes available again, which in turn means connecting via Tor is now possible. The new framework is lightweight, easy to understand and has been running a DNS seed crawler for some months now.
* Thanks to Kevin Greene, we've added some support for the BIP70 payment protocol. Wallet authors can now consume payment requests, check their signatures and submit payments with the new easy to use `PaymentSession` class. The wallet-tool command line UI has support and [an article explains how to use it](/payment-protocol).
* Thanks to Miron Cuperman, the wallet can now watch arbitrary addresses and scripts. The wallet could previously watch an address as long as the public key was known. Now it's possible to watch for addresses even when the public key is not known.
* Also thanks to Miron, Bloom filtering was also improved. The system now tracks false positive rates and cleans the filter when FP rates get too high. Unfortunately, some privacy bugs in Bloom filtering remain, which could (amongst other things) allow a malicious remote peer to test whether you own a particular key.
* Thanks to Alex Taylor (bitpos.me), a new PostgreSQL based pruning block store was added. This block store is fast, and indexes the UTXO set, allowing for fast lookup of the balance of any given address.
* A Java 8 based wallet template app is now included. The template is designed for people writing contract based applications. It provides a simple app that can be copy/pasted, which connects to the P2P network, manages a wallet, and provides a GUI that shows progress, balance, address+qrcode for receiving money and has a button that is used to empty the wallet out. It's designed to have an attractive and modern look, with tasteful animations and artwork.
* Micropayment channels got many big improvements to the API and implementation. The release in 0.10 can be seen as a beta, in this release the micropayments code has been taken for a test drive for a couple of real apps and many rough edges polished as a result.
* The default USER_THREAD executor can now be replaced, allowing a 1-line switch of all callbacks onto a thread of your choice instead of needing to override each callback, each time. This should simplify and clean up the GUI code of wallet apps significantly.
* The WalletTool command line app has a more convenient user interface now.
* A new DNS seed has been added. The seed is run by Christian Decker, from ETH Zurich.
* bitcoinj 0.11 will shortly be available via Maven Central. Please use the dependency verifier plugin and/or check the PGP signatures on the uploads, if you use this!

Smaller improvements:

* We finished adding nullity annotations to the API. You should now be able to assume that any method not annotated with @Nullable won't ever return null values.
* The `WalletAppKit` got a bunch of new features and convenience APIs.
* The wallet will now create inputs with dummy signatures if the private key for an output is missing, rather than throwing an exception. You can then edit the input later to substitute in a real signature. This is useful when the signing is being done elsewhere, outside of the library.
* In full verification mode, execution of scripts (i.e. checking signatures) can now be switched off. This is useful if you trust the source of the chain and just want to calculate the UTXO set.
* The wallet risk analysis code is now pluggable, better documented and checks for finality in a more sensible way.
* Various memory usage and flow control optimisations were made to allow much larger wallets to sync on Android.
* The transaction broadcast algorithm was changed to be more robust.
* Double spend handling in the wallet was improved.
* Generated signatures now use canonical S values. This will aid a future hard-forking rule change which bans malleable signatures.
* Some fixes were made for enable usage with the Orchid Tor library. Further support for Tor is planned for future releases.

Notable bug fixes:

* Some hard-forking full verification bugs were fixed.
* Thanks to Miron, `PeerGroup` now performs exponential backoff for peer connections, for instance if we cannot connect to them or if they disconnect us. This resolves an annoying bug in which if the library was configured with a single peer that was down, it would spin in a tight loop consuming battery.

API changes:

* Some functionality of the Wallet class was moved into separate classes under the wallet package.
* The micropayments API and protocol changed. New clients/servers are not compatible with apps running against previous releases.
* The Wallet sendCoins/completeTx methods no longer return booleans or null to indicate failure, they now throw InsufficientMoneyException or a subclass if the transaction cannot be completed. The exception object typically contains information on how much money is missing. 
* Some mis-named methods in the HD key derivation API were renamed.
* The `WalletEventListener` interface has an extra method for watching scripts now.
* Peer discovery classes moved under the net.discovery package
* Any APIs that relied on Netty are now different.

New documentation:

* An article on the networking API
* Info on testing your apps, and how to use regtest mode to make a private Bitcoin network that allows you to mine blocks instantly.
* A reference table showing which API's implement which Bitcoin Improvement Proposals (BIPs).

Please note that as I am no longer employed by Google, after 0.11 signing the Google contributor license agreement will no longer be necessary. I look forward to welcoming contributions from Andreas Schildbach now this requirement has gone away. Also, in future I plan to re-namespace the library from com.google.bitcoin to org.bitcoinj - auto-migration scripts will be provided when this is done.

## Version 0.10.3

* A regression in broadcast handling was fixed.

## Version 0.10.2

* Some bugs related to re-org handling were fixed. All users should upgrade to get these fixes.
* A crash related to signing non-ASCII messages with ECKey was fixed.
* Misc other bugfixes

## Version 0.10.1

* Emptying the wallet now only empties selectable outputs.

## Version 0.10

* An implementation of micropayment channels was added. There have been many bugfixes and improvements since the first announcement. This feature allows you to set up a 1:1 payment relationship with a remote server and after a short setup process send very tiny payments, very rapidly. It's suitable for metered billing applications. An article, "Working with micropayments" explains how to use it. This work was a joint effort between Matt and myself.
* A simple sublibrary has been added that provides async IO based client/server classes that transmit length prefixed protocol buffers.
* Thanks to Matija Mazi, some classes have been added that implement the BIP 32 deterministic wallet algorithm. Note that these classes are not yet used elsewhere in the system and full deterministic wallet support is therefore not available, however, a low level API is available for experimentation. That API is very likely to change in future releases so don't get too attached to it.
* Thanks to Gary Rowe, we have integrated a new Maven plugin that checks the SHA1 hashes of downloaded dependencies against a hard-coded list. This means that even if an upstream Maven repository or developer were to be compromised, library dependencies could not be switched out for corrupted versions without someone noticing. For 0.10 the dependency hashes were just initialised based on what was already downloaded. In future, reproducible builds of upstream dependencies and auditing of changes would provide better security. You can and should use [Gary's plugin](https://github.com/gary-rowe/BitcoinjEnforcerRules) in your own projects to defend against a possible compromise of the bitcoinj repository.
* Callback handling has been much improved. Each event listener can have an `Executor` specified which takes responsibility for running the callback. If you don't specify one they run by default on a single background thread, the "user thread", instead of the origin framework threads. This means your callbacks no longer need to be thread safe as they're always run serially. You can also change the default executor if you would like to control the thread on which callbacks run, for example to marshal them into your GUI toolkit thread automatically. This fixes some of the most painful parts of the pre-0.10 API, for instance that transaction confidence listeners were not allowed to re-enter the library.
* Exception handling has also improved. You can assign a global `Thread.UncaughtExceptionHandler` which receives any exceptions thrown on the user thread (i.e. by your own event listeners), as well as any internal exceptions thrown by network threads (like inability to parse a message sent by a remote peer). Because your listeners now run on a separate thread by default, you can no longer accidentally cause internal data corruption or prevent other callbacks from running by leaking exceptions out of your callbacks; a subtle knife-edge in the previous API.
* We now require Bloom-capable (0.8+) peers by default and will disconnect from older nodes. This avoids accidental bandwidth saturation on mobile devices.
* The wallet now accepts timelocked transactions if it created them itself.
* The wallet can be told to empty itself out, in which case the fee will be subtracted from the total amount instead of added. This simplifies the common case of wanting to send your entire balance whilst still including a fee.
* Some JNI peers for event listeners were added. Auto-generated JNI bindings are experimental and not yet merged in to the mainline codebase: for now they are available as part of a separate project on github. This work allows you to access the bitcoinj API using relatively natural looking C++ code and an embedded JVM.
* You can now register custom `PeerFilterProvider` implementors to add things to Bloom filters that aren't necessarily in wallets.
* We have begun adding nullity annotations to the API. Combined with a strong static analysis engine like FindBugs or the IntelliJ Inspector, you can find cases where you aren't handling possible null pointers. Note that you should configure your static analysis system to understand the Guava Preconditions assertions, as otherwise you will get false positives.
* You can now control how much information Wallet toString() dumps contain more precisely. Extensions can contribute to a wallets debug dump as well, and transaction data is now optional.
* Support for automatic wallet key rotation has been added.
* Documentation: The getting started tutorial and PingService example were rewritten. New articles were added that cover optimising chain sync and using the library from non-Java languages. Existing articles were also extended and refreshed.
* Many bug fixes and new methods. You should upgrade as soon as possible to get the bug fixes, in particular, one that could cause transactions inside the same block to be incorrectly re-ordered when using Bloom filtering (which can affect the wallet). The library code now has more internal annotations to help static analysis engines, and several bugs were fixed as a result of that.

API Changes:

* The `ScriptBuilder` class now takes `TransactionSignature` objects, these wrap a raw ECDSA signature and the SIGHASH flags together, with utility methods to work with them.
* The `Locks` class has been renamed to `Threading`. The thread on which callbacks run has been changed, see above.
* The `WalletEventListener.onKeyAdded` method became `onKeysAdded` and now takes a list, to make processing of bulk adds more efficient.
* `BitcoinURIParseException` is now checked so you can't forget to handle bogus URIs.
* The `Wallet.toString(..)` method has additional parameters now so you can control what is included in the dump.


## Version 0.9

* Thanks to Matt Corallo, we now have a basic fee solver that will attach the correct (minimum) fee per kilobyte to a created transaction using the 0.8.2+ fee rules. Note that there's no attempt to minimize the size of a calculated transaction and thus fee, but some other optimisations are applied. By default bitcoinj will always attach a fee, to learn how to customise this refer to the article _Working with the wallet_.
* The wallet's re-org handling code was rewritten and simplified.
* A new class, `WalletAppKit`, simplifies the process of instantiating all the objects and files that are needed to run a basic app that can send/receive money.
* Add optional support for Pieter Wiulle's native secp256k1 implementation, which is significantly faster than Bouncy Castle.
* Improvements to coin selection in the wallet.
* Many new functions and minor API improvements, for instance, it's now easier to tell the wallet to allow spending of unconfirmed coins.
* A new `ScriptBuilder` class simplifies the process of constructing various kinds of scripts.
* A new block importer tool can parse bitcoind block files and process them, which is faster than streaming them over a network connection. 
* Support for the regtest mode added by the C++ side pull req 2632. This makes app development and testing easier by eliminating the need to wait for a block.
* Many bug fixes and testing improvements.

API changes:

* `NetworkParameters` has now been refactored into separate classes.
* Wallet extensions have been tweaked, please refer to the javadocs for details.
* Many other minor additions and changes that are mostly backwards compatible.

## Version 0.8

* Thanks to Jim Burton, encryption of private keys in the wallet is now supported. Keys are encrypted using an AES key derived using scrypt.
* A new `SPVBlockStore` provides dramatically better performance and bounded disk usage by storing block headers in an mmapped ring buffer. This makes syncing headers for new chains/wallets network bounded instead of disk io bounded.
* A new tool is provided to create lists of block header checkpoints that can then be used to initialize a new block store. This allows most headers to not be downloaded when initializing a new chain/wallet, making first-run of new wallets much faster.
* Bloom-filtering capable nodes are now queried for transactions at startup, meaning you can receive payments that weren't confirmed yet even if your wallet wasn't running at the time.
* Many static analysis warnings have been cleared.
* All event listeners except transaction confidence listeners now run unlocked and core objects have been converted to use cycle detecting locks. Multiple lock inversions were fixed.
* DNS seeds are now supported for testnet.
* `PeerEventListener` now lets you catch and process exceptions thrown during peer message processing. This is useful for reporting crashes that don't take out your entire app, but just result in disconnection of a peer.
* Matt Corallo's bitcoind comparison tool was merged in. It runs a large set of regression tests that compares the behaviour of bitcoinj in full verification mode against bitcoind.
* The vast bulk of the changes in this release are bug fixes, optimizations and minor API improvements. They are too numerous to list here, please refer to the commit logs for details.

API changes:

* Event listeners were previously locked before being called, and the object being listened to was also locked. This is no longer true - your event listeners must be thread safe and the objects that triggered the event may be changing in parallel.
* `IrcDiscovery` is now deprecated, as LFnet has gone offline and DNS seeding can be used for both test and production networks. The code is still there in case you want to use IRC bootstrapping for a private experimental network.
* `BoundedOverheadBlockStore` is now deprecated. It was replaced by `SPVBlockStore`. The file format has changed, so BOBS will stick around for a while so users can be upgraded.
* The Derby based block store has been deleted. It only supported SPV mode and wasn't used much.
* The static `NetworkParameters` methods now vend singleton objects.
* `WalletEventListener.onCoinsSent` is no longer run when a transaction sends to self but the balance doesn't change.

Known issues:

* Transaction confidence listeners are still run with the wallet lock held, which means it's possible to trigger unexpected lock inversions by doing certain things inside them. Also, confidence listeners sometimes run in places where the wallet code is not fully re-entrant, meaning that modifying the wallet whilst inside a confidence listener may cause problems. A simple fix is to run your listener code in a separate thread. A future release will fix this by ensuring that listeners only ever run at the end of wallet mutating operations and with the wallet unlocked. Core objects will also switch to using non-reentrant locks so unexpected reentrancy deadlocks early and reliably.
* If multiple peers disconnect simultaneously it's possible for the system to deadlock due to Netty allowing uncontrolled reentrancy when sending outbound messages (issue 381).
* The Wallet expects that it can store all transactions in memory (including spent transactions), eg, for rendering in lists and availability during re-orgs. On highly constrained devices like old Android phones it is possible to run out of RAM if a wallet gets very large.
* There are some bugs that can cause the wallet to get into an inconsistent state in various rare situations. The wallets can be fixed by replaying them. These bugs will be addressed as the next highest priority.


## Version 0.7.1

* A variety of minor bugs were fixed in this release
* Some Java7-isms were removed.
* Handle a crash in Bouncy Castle that can be caused by deliberately invalid sigs. Thanks to Sergio Damian Lerner for this fix.

## Version 0.7

* Thanks to Matt Corallo, we now support a fully verifying mode in addition to simplified verification. This is a tremendous amount of work that wouldn't have happened without Matt! Right now, we strongly discourage anyone from using it for mining (which is not supported out of the box anyway). Use it in a production environment only if you know what you're doing and are willing to risk losing money. If you do use it, let us know so we can contact you when problems are discovered. Read the documentation carefully before you begin.
* Also thanks to Matt, Bloom filtering is now implemented and activated by default. When bitcoinj connects to a peer that supports Bloom filtering, only transactions relevant to the wallet will be downloaded which makes bandwidth usage scale with the size of your wallet, not global system activity. A configurable false positive ratio allows you to trade off bandwidth vs privacy. App developers don't need to do anything to take advantage of this, it is enabled automatically.
* `PeerGroup` now pings its peers and calculates moving averages of the ping times. Ping time, versions and block heights are taken into account when selecting the peer to download the chain from.
* You can now customize which outputs the wallet uses to create spends. The new default coin selector object allows you to spend unconfirmed change as long as it's been seen propagating across the network, addressing a common end-user pain point in wallet apps.
* Optimized networking code for faster startup.
* A new `PeerMonitor` example app shows how to put properties of connected peers into a GUI.
* The Wallet is now decoupled from the `BlockChain` using the new `BlockChainListener` interface. This will simplify the development of some apps that want to process transactions but not maintain an actual wallet.
* The dependencies of broadcast transactions are now downloaded and risk analyzed. At the moment they are only being checked for having a timelock. In future we may also analyze tree depth. The goal is to make certain kinds of protocol abuse harder. Wallets will reject timelocked transactions by default, this can be overridden via a property.
* You can now create timelocked transactions with WalletTool if you want to.
* Compressed public keys are now used by default.
* Support testnet3
* Support bitcoin-qt compatible message signing and verification.
* ECDSA key recovery is now implemented and allows you to obtain the public key from an extended  signature. If the signature is not extended then there are multiple key possibilities returned.
* Many bugfixes and minor improvements

API changes:

 * `ECKey.sign()` now takes a `Sha256Hash` as an argument and returns an `ECDSASignature` object in response. To get DER encoded signatures, use the `encodeToDER()` method of `ECDSASignature`.
 * `ECKey.publicKeyFromPrivate` now takes an additional compressed parameter.
 * `PeerGroup.start()/PeerGroup.shutDown()` now run asynchronously and return futures you can use to wait for them. You cannot restart a `PeerGroup` once it has been shut down any more.

## Version 0.6

* Thanks to Jim Burton, the wallet now stores the depth and work done for all transactions, and coinbase transactions are now processed correctly. The ability to handle pubkey-only outputs was added, so these are now spendable. Migration from 0.5 wallets that don't store this is supported, but only for depth, by using `WalletProtobufSerializer.setChainHeight()`.
* Made some more APIs documented and public.
* Improved block chain download handling.
* Added compatibility with the broken URIs generated by blockchain.info, meaning that the iPhone app and Android apps can now read each others QRcodes.
* Wallets can now auto-save themselves, taking the hassle of managing wallet persistence away from your app. See the javadocs for Wallet.autoSaveToFile() for information on this.
* The network layer was rewritten on top of Netty to be more robust, more scalable and to remove flakyness in the unit tests. Thanks to Miron Cuperman for this work.
* Thanks to Matt Corallo the ping/pong protocol is now supported. Also various protocol conformance issues and other misc bugs were resolved.
* `WalletTool` now has a RAW_DUMP option that prints the raw protocol buffer form as text.
* You can now explicitly set fees on a created transaction using the fee member of `SendRequest`. Please note that the correct fees for a transaction are still not auto-calculated or minimized. This will come in a future release.
* Many bug fixes.

API changes:

* `TransactionConfidence.OVERRIDDEN_BY_DOUBLE_SPEND` is now called `DEAD`
* `PeerGroup.broadcastTransaction` now returns a Guava `ListenableFuture` (which is a subclass of Future, so it's compatible). The future completes when the transaction has been heard back from the network, instead of just being written out.
* `Wallet.sendCoins()` now returns a `SendResult` that contains both the transaction, and the future returned by `PeerGroup.broadcastTransaction()`, so it will no longer block. As a result `sendCoinsAsync()` has been removed.
* Various send methods on Wallet now take a `SendRequest` object that lets you customize the created transactions. The methods that let you explicitly set the change address are removed, you should set the `changeAddress`  member of the `SendRequest` instead.

## Version 0.5

* Address.getParameters() and Address#getParametersFromAddress() let you figure out for what network the address is for (test, production, etc). BitcoinURI no longer requires a NetworkParameters for the same reason.
* Updated to latest bouncy castle version, remove the need for the Android artifact by using the SpongyCastle build
* Receives pending transactions much faster than before
* Update to new testnet rules
* Wallets now store the current chain head
* wallet-tool can now create and broadcast transactions from the command line
* Wallets will now be auto-migrated to protobuf format if they were previously serialized Java objects
* Now uses the standard Maven directory layout
* Many important bugfixes

This release included the first preview of the native API, allowing you to access bitcoinj from C++/Objective-C++ using a straightforward, intuitive mapping from the Java API. Much easier than JNI and no JVM is required, just the libgcj support library. Examples of a native Cocoa app for OS X and a command line hello world app are included. Because it's not fully finished/documented yet, this work is available on a branch.

## Version 0.4.1

Minor bugfixes:

* A fix for Android users only to do with alert processing

## Version 0.4

New in this release:

* Ability to use "getheaders" to quickly catch up new users to the head of the chain.
* ECKeys no longer require the private part, allowing for "watching wallets" that cannot spend, but still gather and track the transactions associated with the public keys.
* A new API that implements transaction confidences. Get a quick summary or detailed information about how much confidence you can have that a given transaction won't be reversed.
* A new DerbyBlockStore that stores block headers and related data in the Apache Derby relational database.
* Protocol buffers are now a supported serialization format for the wallet. Java serialization will continue to be supported for the next release, and then we'll start breaking serialize compatibility. This means BitCoinJ based protobuf wallets can be read and manipulated by any language/platform with a protobufs implementation, which is most of them. There are extension points in the format to allow third parties to add new features.
* Various new event listeners that help you learn when the state of the wallet or transactions change.
* Support for post February 20th version handshakes (most library users already got this fix via backports)
* All event listeners are now allowed to remove themselves during their own execution.
* New APIs that allow you to create offline transactions and then broadcast them at a later point. Pending relevant transactions are recorded and announced to all newly connected nodes, ensuring a transaction won't "get lost" if there was flaky network connectivity at the time of creation. Pending transactions are supported much better in this release than in previous releases.
* Wallet now can now take an invalid transaction and complete it by adding sufficient inputs and a change output. This enables the creation of multi-sends, as well as making experimentation with contracts easier.
* Updated DNS seeds list.
* A new WalletTool program for command line usage, and a ToyWallet app showing how to set everything up.
* Support for BIP 14: apps can now set their own "user agent" which will be put in the subVer field along with the library version.
* Support parsing and checking of alert messages.
* New articles explaining how to use the library.
* The usual assortment of bugfixes, new APIs, robustness and test suite improvements.

## Version 0.3

New in this release:

* Many bugfixes, robustness and test suite improvements.
* Major optimizations to reduce parsing overhead, most protocol messages are now parsed on demand.
* A new PeerGroup API that handles the management of multiple peer connections.
* Switched to using Maven for the build process, removed the bundled Bouncy Castle as a result. You can now depend on BitCoinJ using Maven if you don't need any special patches.
* A bunch of new APIs to make writing Bitcoin apps easier.

</div>
