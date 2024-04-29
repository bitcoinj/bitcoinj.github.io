---
layout: base
title: "Pre-release notes"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

# Pre-release notes

These versions are not yet released. For official releases, see the <a href="/release-notes">release notes</a>.

## Version 0.17 alpha 4

See the preliminary <a href="/javadoc/0.17-alpha4/">API documentation</a>.

This release mostly has small fixes, documentation updates and dependency updates.

New feature:

* Methods `BitcoinNetwork.isValidAddress(Address)` and `.checkAddress(Address)` to validate Bitcoin addresses
* New service bits `Services.NODE_P2P_V2` and `.NODE_COMPACT_FILTERS`

## Version 0.17 alpha 3

See the preliminary <a href="/javadoc/0.17-alpha3/">API documentation</a>.

New feature:

* reproducible reference build, see `build.Containerfile`
* OpenJDK 21 is now supported
* Gradle up to 8.5 is now supported
* WalletTool: new `--filter` option for setting type of filter used
* BlockImporter: support signet and regtest

Bugfix:

* PBKDF2SHA512: set hLen to correct value of 64
* some symbols removed in previous alphas have been re-added as deprecated

Breaking changes:

* various fields have been made private in our quest to make more classes immutable
* protobuf:
  * moved protobufs to `org.bitcoinj.protobuf.*` packages
  * changed class generation into `build` directory, not under version control
* CoinSelector: new static constructor `fromPredicate()`
* TransactionInput/TransactionOutput/TransactionWitness/PartialMerkleTree: rename method `messageSize()` from `getMessageSize()`
* BlockLocator: migrate from native to static constructor `ofBlocks()`
* BlockFileLoader:
  * cannot be used directly as `Iterator` any more, call `.iterator()` first
  * added `.stream()` and `.streamBuffers()` to stream blocks
* FilteringCoinSelector: require list of `TransactionOutPoint` to be passed to the constructor
* PeerGroup, FilterMerger: deprecate setting false-positive rate
* TorUtils: new utility for Tor/Onion addresses

Feature removals:

* ECKey: remove native interface to `libsecp256k1`
* WalletTool: removed validation mode option

## Version 0.17 alpha 2

See the preliminary <a href="/javadoc/0.17-alpha2/">API documentation</a>.

* Message hierarchy refactoring:
  * extract interface and add `BaseMessage` abstract class
  * those classes are now immutable, got rid of caching
  * many constructors have been migrated to static constructors
  * constructors don't take `NetworkParameters` or `MessageSerializer` any more
  * got rid of the concept of parent/child messages; removed `ChildMessage` from the hierarchy and made previous child
    messages extend `Message` directly
  * `TransactionOutPoint`, `TransactionInput`, `TransactionOutput`, `PartialMerkleTree`, `PeerAddress`
    are not descendants of `Message` anymore (and made immutable)
* Transaction:
  * new `coinbase()` static helpers for coinbase transactions
  * make `allowWitness()` static
  * removed `toHexString()`
  * moved `isMature()` to `Wallet.isTransactionMature()`
  * made `verify()` a static helper method
* Block:
  * log warning if `solve()` runs a bit long
  * made `verify*()` static helper methods
* VersionMessage:
  * requires extended version handshake messages
  * deprecated `isPingPongSupported()` and `ProtocolVersion.PONG`
  * moved `isBloomFilteringSupported()` to `Peer`
  * removed field `fromAddr`; it's always filled up with zeros
  * field `receivingAddress` now takes `InetSocketAddress` and `Services`
  * dropped support for TORv2 messages; use TORv3
* Script:
  * new static constructors `parse()` and `of()`
  * made more immutable
* Services: wrapper for node services bitfield; use this in favor of the helpers in `VersionMessage`
* Buffers: new utils class for common operations on P2P message `ByteBuffer`
* ProtocolVersion: move to top-level class from `NetworkParameters`
* BitcoinURI:
  * the check against `maxMoney` has been removed
  * the check for negative amounts now throws `OptionalFieldValidationException`
* PaymentSession: doesn't validate the network of transactions in payment message any more; it's up to the caller to
  not mix networks
* MarriedKeyChain: removed the entire concept of married key chains
* AddressParser: simpler address parsing by making it a `@FunctionalInterface`
* Stopwatch: re-introduce tool for measuring time mainly for log messages
* many APIs that used `NetworkParameters` now use `Network`; we're providing deprecation stubs where possible
* again, many routines have been rewritten to use functional Java
* again, many fields and even entire classes have been made immutable

Notable fixes:

* Wallet: always enforce `OP_RETURN` limit in `completeTx()`
* Wallet: properly handle unconnected request inputs in `completeTx()`

## Version 0.17 alpha 1

See the preliminary <a href="/javadoc/0.17-alpha1/">API documentation</a>.

Requirements for developers and consumers:

* JDK 11+ is required for building the project. In particular, we support LTS releases JDK 11 and JDK 17.
* The Gradle requirement moderately updated: 4.4+ for everything except: `bitcoinj-wallettemplate`: 4.10+,
  `bitcoinj-integration-test`: 4.6+. If you want to use the new `testOnJdk8` task, Gradle 6.7+ is required.
* The Java API requirement for `bitcoinj-core` remains unchanged at Java 8. For any other module it has been raised to
  Java 11.
* The Android API requirement for `bitcoinj-core` has been raised to API level 26 (Android 8.0).
* Unchanged is the possibility to use up to Java 8 language features (except `bitcoinj-wallettemplate`: Java 11).

Breaking changes:

* A considerable number of previously deprecated methods and classes have been removed. If you want to ease the
  migration to bitcoinj 0.17, please migrate usages of deprecated API *before* updating your bitcoinj dependency.
* We moved many classes to two new packages:
    * `org.bitcoinj.base`: provides fundamental types with minimal dependencies. This will become its own module in
      bitcoinj 0.18.
    * `org.bitcoinj.crypto`: we've removed direct usage of BouncyCastle in our crypo API. If you've been using BC
      `KeyParameters` to encrypt wallets, please use our very similar `AesKey` wrapper.

  In general, an "optimize imports" should be enough to resolve the new packages. Many method signatures have
  changed though. We tried to provide deprecation stubs for the old signatures to ease the migration.
* We're extracting many aspects of `NetworkParameters` to a new `Network` interface and its implementing
  `BitcoinNetwork` enum. Many APIs that used `NetworkParameters` now use `Network`. Again, we're providing deprecation
  stubs.
* We're not using the term "prod" (or "prodnet") any more. It's now `BitcoinNetwork.MAINNET`.
* We moved many internal helpers/utils to `.internal` packages. These are not public API, please don't use them from
  your app. If there is a helper which you think would be useful for everyone, please drop us a note and we'll consider
  adding it to the public API.
* We removed the (semi-automatic) upgrade path from basic to deterministic keychains/wallets. It was useful back in the
  time, but nowadays it's becoming difficult to maintain code for unexpected behaviour.
  For more information see this [issue](https://github.com/bitcoinj/bitcoinj/issues/2342).
* We finally removed all `Serializable` and `Cloneable`!
* `PrefixedChecksummedBytes` has been renamed to `EncodedPrivateKey`.
* Constructors in the `Message` hierarchy previously taking a `byte[]` message payload are now consuming from
  `ByteBuffer`. There are no deprecation stubs provided for this change. Payloads are now never retained.
* If you've been using `PeerDataEventListener` to observe the blockchain download, use `BlockchainDownloadEventListener`
  now.

Feature removals:

* `HttpDiscovery`, implementing the protocol to discover seeds via HTTP, is no more. We suggest to use `DnsDiscovery`
  or use a hardcoded "seed node" (see new feature below).
* Removed support for querying Bitcoin XT nodes for UTXOs. `GetUTXOsMessage` and `UTXOsMessage` were removed.
* All database-backed block stores have been removed.
* The C++/JNI wallet interface has been deprecated and will be removed in a future release. For more information see
  this [issue](https://github.com/bitcoinj/bitcoinj/issues/2465).
* Likewise, the native interface to libsecp256k1 has been deprecated. For more information see this
  [issue](https://github.com/bitcoinj/bitcoinj/pull/2267).
* Setting tags on objects (`TaggableObject`) has been deprecated and will go away in a future release.
* On Android, `LinuxSecureRandom` isn't automatically installed anymore. The class is still around for manual
  installation if you're supporting Android 4.x affected by the
  [RNG vulnerability](https://bitcoin.org/en/alert/2013-08-11-android).

New noteworthy features:

* `PeerGroup` can now add addresses discovered via `addr` and `addrv2` messages to the pool of nodes to connect to.
  This means one or more hardcoded nodes can act as a seed for others. This means you can run realistically run a
  `PeerGroup` without any `PeerDiscovery` at all.
* Support for Signet.
* `Transaction.addSignedInput()` now also support segwit.
* Wallet has two new static constructors to load from file: `loadFromFile()`, `loadFromFileStream()`
* `KeyChainGroupStructure` now also supports a BIP-43/BIP-44/BIP-84 structure.
* We now have an `AddressParser`, which replaces the previous static `Address.fromString()` constructors.
* `ECKey` can now sign and verify messages with segwit addresses (BIP-137). There is a new `MessageVerifyUtils` to aid
  with signing and verifying messages.

General improvements:

* We're going all-in on Java 8 language features! Lambdas, method references, you name it! Generally speaking, we're
  on a quest to adopt functional programming style.
* In the API and internally, all integer timestamps have been replaced with `java.time.Instant`.
* Likewise, integer-based intervals now use `java.time.Duration`.
* Transaction lock time values are wrapped in a new class `LockTime`.
* Accessors that could previously return `null` are being migrated to `java.util.Optional`.
* In value-based/immutable classes we're in the process of stripping the prefix "get" from the accessor names.
* All usages of Guava `ListenableFuture` have been migrated to `CompletableFuture`. To ease the migration, we use
  `ListenableCompletableFuture` which implements both.
* We're on a mission to replace Guava with JDK 7+ equivalents. Our new `org.bitcoinj.base` package is not depending
  on Guava at all!
* WalletTool is slowly evolving into a standalone tool:
    * It now lives in its own `bitcoinj-wallettool` submodule.
    * Its build generates man, html5 and adoc manpages from the picocli annotations.
* We updated the DNS seeds.
* We refreshed the bundled checkpoints.
* We're now using SLF4J 2.0 with its fluent logging API.
* Our integration tests have moved to a new submodule `bitcoinj-integration-test`. It makes early use of JUnit 5 and
  requires Gradle 4.6+ because of that.
* Our CI has improved a lot:
    * On GitHub Actions, we're testing a large matrix of supported and future operating systems, JDKs and
      versions of Gradle. We're also testing for accidental usage of API only available past JDK 8. A new
      `testOnJdk8` task has been added for this (requires Gradle 6.7+).
    * On Gitlab CI, the focus is on testing compatibility with an "all free software" toolchain (Debian) and reproducible
      builds.
* We now have a <a href="/#community">Matrix space</a>! Join us there if you've got questions or suggestions.

</div>
