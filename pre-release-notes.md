---
layout: base
title: "Release notes"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

# Pre-release notes

These versions are not yet released. For official releases, see the <a href="/release-notes">release notes</a>.

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
    * `org.bitcoinj.crypto: we've removed direct usage of BouncyCastle in our crypo API. If you've been using BC
      `KeyParameters` to encrypt wallets, please use our very similar `AesKey` wrapper.

  In general, an "optimize imports" should be enough to resolve the new packages. Many method signatures have
  changed though. We tried to provide deprecation stubs for the old signatures to ease the migration.
* We're extracting many aspects of `NetworkParameters` to a new `Network` interface and its implementing
  `BitcoinNetwork` enum. Many APIs that used `NetworkParameters` now use `Network`. Again, we're providing deprecation
  stubs.
* We're not usin the term "prod" (or "prodnet") any more. It's now `BitcoinNetwork.MAINNET`.
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
    * On GitHub Actions, we're testing a large matrix of less common operating systems, supported and future JDKs and
      various Gradle versions. We're also testing for accidental usage of API only available past JDK 8. A new
      `testOnJdk8` task has been added for this (requires Gradle 6.7+).
    * On Gitlab CI, the focus is on testing compatibility with an "all free software" toolchain (Debian) and reproducible
      builds.
* We now have a <a href="/#community">Matrix space</a>!

TODO

* vision of WalletAppKit
* vision of `base` (and `crypto`?)
* vision of GraalVM
* vision of ForwardingService
* modular-architecture.md
* usage of Bech32 for Nostr?

</div>
