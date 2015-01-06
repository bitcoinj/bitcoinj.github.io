---
layout: base
title: "Release notes"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

#Release notes

##Version 0.13

_0.13 has not been released yet. These release notes reflect changes in git master._

* A MySQL block store has been added, it has the same feature as the PostgreSQL block store (can index the UTXO set and do balance queries for arbitrary addresses)
* Checkpoints have now been integrated into the WalletAppKit class so you don't need to set them up manually any more when using the JAR. Dalvik/Android users still must do it themselves, as classes.dex files cannot contain embedded files.
* Peer discovery now works differently: peers handed back by a `PeerDiscovery` implementation are used in order and discoverers will be polled until a configurable max is reached, rather than stopping as soon as any discoverer returns peers.
* References to prodnet have all been replaced with the more standard "main net" terminology.
* There is now support for HTTP seeds using the Cartographer protocol.

API changes:

* PeerEventListener has a new onPeersDiscovered event.
* The PeerFilterProvider interface has replaced the getLock method with begin/end methods.

##Version 0.12.1

This is a bug fix / maintenance release:

* 10x fee drop by default.
* Fixes to key rotation. HD upgrades now take place using keys past the rotation time regardless of whether the rotation feature is enabled. HD chains can be rotated to new HD chains based on non-rotating random keys.
* Updates and new docs for the wallet maintenance API.
* A small bugfix to micropayment channels.
* Don't try IPv6 peers again if the first IPv6 attempt fails with "no route to host"
* Narrow the wallet lock to allow faster/lower latency access to the key chain and methods that use it.
* Misc other bug fixes.

##Version 0.12

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

##Version 0.11.3

This is a bugfix release.

* Various fixes to Bloom filtering for failures that could occur in rare edge cases.
* A fix for transactions that are dropped by risk analysis and then later confirmed.
* Fix wallet autosaving on Windows.
* Minor security fix for non-ncaonical block difficulty encodings. Thanks to Sergio Damian Lerner for the report.
* DNS seeds update
* Now throws a transaction if a BIP70 payment request doesn't match the expected network params.
* A few other small misc changes.

##Version 0.11.2

This is a bugfix release.

* Risk analysis following the fee drop: you MUST upgrade to get this, or else users will start missing transactions sent to them.
* Fix a crash that can occur when connecting to a peer that reports a chain height of zero.
* Fix backoff behaviour so when the network is down and discovery fails, things backoff properly.
* Email addresses are now extracted properly from S/MIME certs.
* Disallow adding of keys that don't match the wallet's encryption state.
* Correct handling of OP_0 (full verification mode)
* A bundled/unified JAR is now always built.
* Misc other crash and bug fixes.

##Version 0.11.1

* Wallet default risk analysis now drops dust transactions by default. A new cleanup() method is added to drop risky (i.e. not going to confirm) transactions that were allowed into the wallet by previous versions.
* PkiVerificationData.rootAuthorityName now exposes a user friendly name of the CA that verified the certificate of a payment request.
* A bloom filter bug was fixed that stopped filters from updating when a key was added. 
* Wallet.toString() was re-arranged so that its mostly sorted from new to old.

##Version 0.11

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

##Version 0.10.3

* A regression in broadcast handling was fixed.

##Version 0.10.2

* Some bugs related to re-org handling were fixed. All users should upgrade to get these fixes.
* A crash related to signing non-ASCII messages with ECKey was fixed.
* Misc other bugfixes

##Version 0.10.1

* Emptying the wallet now only empties selectable outputs.

##Version 0.10

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


##Version 0.9

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

##Version 0.8

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


##Version 0.7.1

* A variety of minor bugs were fixed in this release
* Some Java7-isms were removed.
* Handle a crash in Bouncy Castle that can be caused by deliberately invalid sigs. Thanks to Sergio Damian Lerner for this fix.

##Version 0.7

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

##Version 0.6

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

##Version 0.5

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

##Version 0.4.1

Minor bugfixes:

* A fix for Android users only to do with alert processing

##Version 0.4

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

##Version 0.3

New in this release:

* Many bugfixes, robustness and test suite improvements.
* Major optimizations to reduce parsing overhead, most protocol messages are now parsed on demand.
* A new PeerGroup API that handles the management of multiple peer connections.
* Switched to using Maven for the build process, removed the bundled Bouncy Castle as a result. You can now depend on BitCoinJ using Maven if you don't need any special patches.
* A bunch of new APIs to make writing Bitcoin apps easier.

</div>
