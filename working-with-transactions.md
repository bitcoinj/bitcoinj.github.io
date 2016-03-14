---
layout: base
title: "Working with transactions"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

# Working with transactions

## Introduction

Transactions are the fundamental atoms of the Bitcoin protocol. They encapsulate a claim upon some value, and the conditions needed for that value to itself later be claimed.

This article will discuss:

 * What a transaction is
 * The Transaction class and what it gives you
 * Transaction confidences
 * Different ways in which transactions can be used

## What is a transaction?

Transactions are, at heart, a collection of _inputs_ and _outputs_. They also have a lock time, which is not used in the current Bitcoin network, and a few bits of metadata only represented in bitcoinj like when the transaction was last seen and a confidence measurement. All this is represented using the `Transaction` class.

An output is a data structure specifying a _value_ and a _script_, conventionally called the _scriptPubKey_. An output allocates some of the value gathered by the transactions inputs to a particular program. Anyone who can satisfy the program (make it return true) is allowed to claim that outputs value in their own transaction. Output scripts most often check signatures against public keys, but they can do many other things.

An input is a data structure that contains a _script_, which in practice is just a list of byte arrays, and an _outpoint_, which is a reference to an output of another transaction. Because Bitcoin identifies transactions by their hash, an outpoint is therefore a (hash, index) pair in which the index simply identifies which output in the given transaction is intended. We say the input is _connected_ to an output. Input scripts, conventionally called _scriptSigs_ can theoretically contain any script opcodes, but because the programs are run with no input there is little point in doing that, therefore, real input scripts only ever push constants like signatures and keys onto the stack.

Inputs also contain _sequence numbers_. Sequence numbers are not currently used on the Bitcoin network and are not exposed by bitcoinj. They exist to support [contracts](https://en.bitcoin.it/wiki/Contracts).

The mismatch, if any, between the value gathered by a transactions inputs and spent by its outputs is called the _fee_. Obviously, a transaction that has more value in its outputs than gathered by its inputs is considered invalid, but the reverse is not true. Value not re-allocated can be legitimately claimed by whoever successfully mines a block containing that transaction.

Note that an input does not contain a value field. To find the value of an input, you must check the value of its connected output. That implies that given a standalone transaction, you cannot know what its fee is, unless you also have all of the transactions its inputs connect to.

Transactions can be serialized and either broadcast across the P2P network, in which case miners may start trying to include it in a block, or passed around outside the network using other protocols.

## The Transaction class

The `Transaction` class lets you deserialize, serialize, build and inspect transactions. It also helps you track interesting metadata about a transaction such as which blocks (if any) it has been included in, and how much confidence you can have that the transaction won't be reversed/double spent.

Inputs are represented with the `TransactionInput` class, and outputs are of course handled by the `TransactionOutput` class. Inputs can be unsigned, in which case the transaction won't be considered valid by the network, but the intermediate state can be useful to work with sometimes.

**Common tasks**:

1. Access inputs and outputs using getInputs(), getOutputs(), addInput() and addOutput(). Note that addInput() has two forms, one which takes a `TransactionInput` - logical enough. The other takes a `TransactionOutput`, and will create an unsigned input for you that connects to that output.
2. Sign the transactions inputs with `signInputs()`. Currently you must always pass `SigHash.ALL` as the first parameter. Other types of `SigHash` flags will become supported in future. They are used for contracts. This method also requires a wallet that contains the keys used by the inputs connected outputs. If you don't have the private keys, then obviously you cannot claim the value.
3. Find which blocks the transaction appears in using `getAppearsInHashes()`. Because the transaction only stores the hashes of the block headers, you may need to use a populated `BlockStore` to get the block data itself.
4. Learn about the state of the transaction in the chain using `getConfidence`. This returns a `TransactionConfidence` object representing various bits of data about when and where the transaction was included into the block chain.

## Confidence levels

A transaction has an associated _confidence_. This is data you can use to calculate the probability of the transaction being reversed (double spent). This is always a risk in Bitcoin although at high network speeds, the probability becomes extremely low, certainly relative to traditional payment systems.

Confidence is modelled with the `TransactionConfidence` object. You can get one by calling `Transaction.getConfidence()`. Confidence data does not exist in Bitcoin serialization, but will survive Java and protobuf serialization. 

A confidence object has one of several states:

* If **BUILDING**, then the transaction is included in the best chain and your confidence in it is increasing.
* If **PENDING**, then the transaction is unconfirmed and should be included shortly as long as it is being broadcast from time to time and is considered valid by the network. A pending transaction will be announced if the containing wallet has been attached to a live `PeerGroup` using `PeerGroup.addWallet()`. You can estimate how likely the transaction is to be included by measuring how many nodes announce it after sending it to one peer, using `TransactionConfidence.numBroadcastPeers()`. Or if you saw it from a trusted peer, you can assume it's valid and will get mined sooner or later as well. 
* If **DEAD**, then it means the transaction won't confirm unless there is another re-org, because some other transaction is spending one of its inputs. Such transactions should be alerted to the user so they can take action, eg, suspending shipment of goods if they are a merchant.
* **UNKNOWN** is used if we have no information about the confidence of this transaction, because for example it has been deserialized from a Bitcoin structure but not broadcast or seen in the chain yet. UNKNOWN is the default state.

The confidence type, available via `TransactionConfidence.getConfidenceType()`, is a general statement of the transactions state. You can get a more precise view using getters on the object. For example, in the `BUILDING` state, `getDepthInBlocks()` should tell you how deeply buried the transaction is, in terms of blocks. The deeper it is buried in the chain, the less chance you have of the transaction being reversed.

Depth in blocks is easy to understand and roughly corresponds to how long the transaction has been confirmed for (1 block == 10 minutes on average). However, this is not a stable measure of how much effort it takes to reverse a transaction because the amount of _work done_ on a block varies over time, depending on how much mining is happening, which itself depends on the exchange rate (vs the dollar/euro/etc).

### Understanding difficulty and confidence

The most common reason you are interested in confidence is you wish to measure the risk of losing money that was sent to you, for example, to delay dispatching of goods or provision of services. The Bitcoin community uses a rule of thumb of zero confirmations for things that aren't of much value like MP3s or ebooks, one or two blocks for things (10-20 minutes) for things that stand a risk of a double spend attack, or 6 blocks (an hour) for where rock solid certainty is required, like with currency exchanges.

In practice, reports of merchants suffering double-spend fraud are rare so this discussion is somewhat theoretical.

You'll notice that the rules of thumb quoted above are expressed as blocks, not work done. So if the exchange rate and thus mining falls, 2 blocks provides less assurance than before, meaning you may wish to wait longer. Conversely if the exchange rate rises, mining activity will increase, meaning you can wait less time before a transaction is valid, resulting in happier customers. This is why we also provide a way to measure confidence as work done.

## How transactions can be used

The most common and obvious way to use transactions is to:

1. Download them into your wallet from the block chain or network broadcasts
2. Create spends and then broadcast them

However there are many other possibilities.

### Direct transfer

It's possible to send someone money by directly giving them a transaction, which they can then broadcast at their leisure, or further modify. These use cases aren't well supported today, but in future may become a common way to use Bitcoin.

### Participation in contracts

[Contracts](https://en.bitcoin.it/wiki/Contracts) allow for a variety of low trust trades to take place, mediated by the Bitcoin network. By carefully constructing transactions with particular scripts, signatures and structures you can have low-trust dispute mediation, coins locked to arbitrary conditions (eg, futures contracts), assurance contracts, [smart property](https://en.bitcoin.it/wiki/Smart_Property) and many other possibilities.

You can learn more about this topic in the article [WorkingWithContracts](working-with-contracts).

</div>
