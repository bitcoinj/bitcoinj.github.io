---
layout: base
title: "How the different components of your app fit together"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

#How the different components of your app fit together

##Introduction

This article shows you how the different objects and interfaces in a typical bitcoinj based application interact. We will see how data arrives from the network, is converted into Java objects, and then how those objects travel around until they are eventually used to perform various actions or saved to disk.

For the purposes of this article we will assume the application is a wallet.

##The network

The life of a piece of Bitcoin data starts in two ways - when it is sent to us by another node in the peer-to-peer network, or when a transaction is created by ourselves.

The lowest level of the [Networking](/networking) API is an object that implements `ClientConnectionManager`. This interface provides methods for opening new connections, and requesting that some (randomly chosen) connections be closed. To open a new connection, an object that implements the `StreamParser` interface must be provided along with the network address to connect to. The client connection manager will then set up a socket and manage reads/writes to it. There are no guarantees about threading here - the manager may run methods of the provided `StreamParser` on any number of threads or just one. There are two implementations provided: `BlockingClientManager` and `NioClientManager`. If you create a high level `PeerGroup` object then by default a `NioClientManager` will be created, though you can also provide your own via the constructors. The difference between them is that `NioClientManager` uses a single thread and async epoll/select based IO, and `BlockingClientManager` uses a thread per connection with standard Java blocking sockets. Why does bitcoinj support both approaches?

* Blocking IO is useful when you want features. Java can transparently support SSL, SOCKS proxying and via the Orchid library, Tor, but only when blocking sockets are used.
* Async IO is useful when you want to handle thousands of connections simultaneously without the additional memory pressure of a thread per connection.

Note that for many types of apps, notably wallets or merchant apps, you don't need lots of simultaneous connections and thus the performance difference between the two is largely irrelevant. Also, whilst the scalability difference between thread-per-connection and async IO was once very large in recent times the advent of much better kernel schedulers and multi-core systems means the differences are often no longer so clear cut. With careful attention paid to thread stack sizes it can be the case that a thread per connection is not as expensive as it once was.

In theory, `NioClientManager` could easily support both async IO and multiple threads together, however the current implementation does not.

##De/serialization

As noted above, the client manager classes require an implementation of the `StreamParser` interface. This interface provides methods for notification that a connection is opened or closed, receiving raw byte buffers and being given an implementation of the `MessageWriteTarget` interface. `StreamParser`s are given data packets read from the network _without any kind of framing or parsing done_. For instance it's valid for half a message to show up on a `StreamParser`'s front door. The parser buffers data, handles framing and consumes the data in some way.

When a client manager is given a new parser, it sets an internal object as the `MessageWriteTarget`. This interface just exposes a method for writing bytes, and closing the connection. Thus the parser object usually manages the lifecycle of a connection once started.

The abstract `PeerSocketHandler` class implements `StreamParser` for the Bitcoin P2P networking protocol, by providing buffering, checksumming and parsing of the byte streams into `Message` objects. This is done using the `BitcoinSerializer` class, which knows how to read the type of the message and its checksum from the wire, then build the appropriate object to represent that kind of message. It has a static map of names to object types. Each object it can construct is a descendent of the `Message` class. Each message class is responsible for its own deserialization from raw byte form.

Once a `Message` is fully constructed and finished deserializing itself, it's passed to an abstract method on `PeerSocketHandler`. Thus if you want to just get access to a stream of parsed messages, you should subclass at this point.

The serialization of messages is a custom binary format designed by Satoshi. It has minimal overhead and consequently minimal flexibility.

##Peer logic

However, most likely your app does not want to handle a stream of raw Bitcoin protocol messages, but rather operate at a higher level. For this purpose, the `Peer` class subclasses `PeerSocketHandler`, tracks state related to the connection and processes incoming messages. It provides high level operations like downloading blocks, the entire chain, transactions, performing pings and so on.

It also dispatches messages to various other objects to which it is connected, specifically:

* Any `PeerEventListener`s that are registered with it.
* A `MemoryPool`, if one is provided (see below).
* Any `Wallet`s that are connected to it.
* The provided block chain object, if any.

On receiving a message, each `PeerEventListener` has a chance to read and intercept the message, possibly modifying it, replacing it with a different message or suppressing further processing entirely. If processing is not suppressed, the following will happen:

* A received "inv" message that advertises new blocks or transactions will result in a "getdata" being sent, if the `Peer` has been instructed to download data. The `MemoryPool` will be notified about the "inv".
* A received "tx" message that contains transaction data is first passed through the `MemoryPool`. Then each `Wallet` is asked via `isPendingTransactionRelevant` whether it cares about that particular transaction, and if it does all the transactions pending dependencies are also downloaded recursively. Once recursive download is done, the transaction and all pending dependencies are passed to `Wallet.receivePending()`. Finally `PeerEventListener.onTransaction` is invoked.
* Received blocks, filtered blocks or block headers are sent to the `AbstractBlockChain` object for further processing.
* If a remote peer asks for our transaction data using "getdata", wallets and listeners are polled to see if any can provide that data, and if one does it is sent in response.
* Misc messages like pings or alerts are handled as appropriate.

##The memory pool

It can be convenient to know how many peers (and which ones) have announced a particular transaction. See the article on the bitcoinj [SecurityModel](/security-model) for information on why this may be interesting. To implement this, the `MemoryPool` class keeps track of transactions and transaction hashes that have been seen.

For example, if a peer sends us an "inv" stating it has the transaction with hash 87c79f8d77fe2078333c612e2bdf1735127c6c02 then the `Peer` will inform the `MemoryPool` of that, and it will record that this peer has seen that transaction. We may eventually download the given transaction to find out if it belongs to us, and at that point it's also given to the `MemoryPool` which keeps it around in case some part of the app is interested in it. As further invs come in, the transactions confidence object is updated.

It may be that the same "tx" message is sent to us multiple times. Normally this shouldn't happen. But if it does the `MemoryPool` deduplicates them to ensure only one Java object is floating around, even if it was deserialized multiple times. 

##Chains and stores

A subclass of `AbstractBlockChain` is responsible for receiving blocks, fitting them together, and doing validation on them. The `BlockChain` class does SPV level validation, the `FullPrunedBlockChain` does full validation as the name implies.

You pass the block chain to a `Peer` or `PeerGroup` and the block data flows via that connection from the network, through the block chain object and towards an implementation of the `BlockStore` interface. There are multiple kinds of block store, but all of them take block data and save at least the headers, and possibly (for a full store) the transaction data as well. For SPV clients a `SPVBlockStore` is the usual choice and for full mode clients an implementation of `FullPrunedBlockStore` is needed, for example, `H2FullPrunedBlockStore`.

The stores talk directly to a database or disk file. There are no other objects beneath them.

Chains invoke callbacks on their `BlockChainListener`s. A `Wallet` is an example of a block chain listener, although it's recommended to use the more specific `BlockChain.addWallet()` method (it does the same thing as `addListener()` but this may change in future). 

Listeners are invoked for the following events:

* `notifyNewBestBlock`: called when a new block is found that extends the best known chain. This is a normal continuation of the system. The block parameter is a block header only - no transaction data is available.
* `reorganize`:  called when a block is received that extends a side chain and makes it the new best chain. A reorganize results in one timeline being replaced by a different one in which transactions may have been re-ordered, replaced or dropped entirely. For this reason, on hearing about a reorg, a listener must update its internal book-keeping to account for the new reality. The reorganize method is given the block chain segments that have changed so they can figure out what to do. It may be tempting to skip this if you are implementing your own listeners, and your app will appear to work, but ignoring reorgs opens your app to security attacks and data corruption.
* `isTransactionRelevant`:   called for each transaction in a block to find out if a listener is interested in it. This is an optimization step that may be removed in future - it allows the block chain to avoid validating the merkle tree in SPV mode when it has full (unfiltered) blocks, unless there's an actual transaction in the block that may be relevant to our wallet (sending money to/from our keys). This makes a big difference on mobile phones but with the rollout of Bloom filtering, it will become less and less useful.
* `receiveFromBlock`:  called for each transaction considered relevant by the previous method when a block is received that contains it. The block may or may not be on the best chain, a parameter tells you which one it is. Note that when Bloom filtering is active, not every transaction may show up here - if transactions were previously sent to us by peers then they won't bother sending it again when a block containing it is solved, we'll only be sent the hash. This is to save bandwidth. Therefore there is also a ...
* `notifyTransactionIsInBlock`:   this is the same as `receiveFromBlock` but you are provided with a hash instead of the full transaction. A listener is expected to already have a copy of the transaction data at this point.

In order, a new full block on the best chain triggers `isTransactionRelevant` for each transaction, `receiveFromBlock`, then `notifyNewBestBlock`. A new filtered block on the best chain triggers `isTransactionRelevant`, a mix of `receiveFromBlock` or `notifyTransactionIsInBlock`, then `notifyNewBestBlock`. New blocks that extend a side chain have the same sequence but not `notifyNewBestBlock` and new blocks that extend a side chain and cause a reorganize have the same sequence but call `reorganize` instead of `notifyNewBestBlock` at the end.

For an SPV mode app, the block store is given all non-orphan blocks regardless of where they connect, and is informed when the new best chain head changes so it can be written to disk. It is only expected to store headers.

###Data pruning

For a fully validating node, the store is expected to do a lot more and must implement the `FullPrunedBlockStore` interface. Together the chain and store implement the _ultraprune_ algorithm, the same as Bitcoin 0.8+ does. However unlike Bitcoin 0.8 the store will actually permanently delete unneeded data after a while, so it cannot serve the chain to other nodes, but the utilized disk space is a lot lower.

A pruning node does not attempt to store the entire block chain. Instead it stores only the set of unspent transaction outputs (UTXO set). Once a transaction output is spent, its data is no longer needed and it can be deleted. Reorganize events complicate the picture somewhat because they can rewrite history, therefore pruning stores are expected to also keep around a number of "undo blocks" which allow a reversal of the changes to the UTXO set. The number of undo blocks stored is a tradeoff between disk space used and the largest reorganize that can be processed. If undo blocks are thrown away too aggressively, a large reorg might permanently kick the node off the chain forcing re-initialization from scratch, so it's best to be conservative.

The `FullPrunedBlockStore` interface provides methods for adding, removing and testing the UTXO set. It also has methods for inserting blocks and undo blocks and beginning/ending database transactions (note: as distinct from Bitcoin transactions).

##The wallet

The `Wallet` class acts as a block chain listener and receives data and events from the chain object. It saves the data it receives within itself and keeps track of all transactions that might be interesting for the wallet user, such as ones that send money to its keys. The wallet can be saved to a protocol buffer using `WalletProtobufSerializer`, and functionality is provided to automatically do so from time to time when the wallet has changed.

Currently, the Wallet doesn't have any way to store itself to a database. It would be a nice addition for the future.

The Wallet also takes responsibility for updating the confidence levels of transactions placed within it. A transaction outside of the wallet might be updated by the MemoryPool as new peers announce it, but ultimately will not learn about its position in the chain.

</div>
