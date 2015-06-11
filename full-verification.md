---
layout: base
title: "Using the experimental full verification mode"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

#Using the experimental full verification mode

##Introduction

Starting with version 0.7, bitcoinj can be run fully verifying. This means it behaves the same way as the standard Bitcoin node does: all transaction scripts are run, signatures verified and double spends are checked for, amongst other things.

You may wish to experiment with this mode if you are building an application that falls into the following categories:

* You want direct access to the set of unspent outputs.
* You want to be able to test validity of an unconfirmed transaction without depending on randomly selected peers.
* You want a higher degree of security than is possible with simplified payment verification.

To review the tradeoffs involved with full vs SPV mode, read the [SecurityModel](/security-model) page.

##Understanding the risks

Before you begin, it is vitally important that you read and understand this warning.

**Full verification in bitcoinj is not the focus of the library and almost certainly contains chain splitting bugs. If you rely on it, an attacker may exploit bugs in the code to fork you onto a separate chain and potentially defraud you of money.**

In particular _**UNDER NO CIRCUMSTANCES SHOULD YOU MINE ON A BITCOINJ VALIDATED CHAIN**_.

It is difficult to overemphasize this risk. To be safe, bitcoinj must match the behavior of Satoshi's code exactly, including all the bugs. Any deviation at all can be potentially used to split the consensus. This is problematic if you are a merchant and could put the entire system at risk if you are a miner.

The most reliable configuration in which to use bitcoinj is in SPV mode, connected to a regular C++ Bitcoin node that you control. In this way, you are sure that the data feed your app gets has been validated by your node and many obscure avenues for attack can be filtered out.

##Using the H2 block store

H2 is an embedded Java database that requires no external installation or setup. However, the H2 store does not provide fully indexed access to the block chain: it just calculates and stores the unspent output set, the same as Bitcoin Core.

If you decide you want to use this, setting it up is straightforward. Instead of using `BlockChain` and `BoundedOverheadBlockStore` create a `FullPrunedBlockChain` and an `H2FullPrunedBlockStore`. Then plug them in to the rest of the system as normal (see [HowThingsFitTogether](/how-things-fit-together) to learn more). The system will perform pruning validation, thus at the end you will have access to the set of unspent outputs.

##Using the PostgreSQL block store

Starting from bitcoinj 0.11, there is a  block store backed by PostgreSQL. This is fast, uses an external database and indexes the UTXO set so you can quickly look up the balance of any address. To use this:

1. Enable the postgres JDBC driver dependency in your Maven POM. There's an example in the bitcoinj POM, you can either enable it there and rebuild bitcoinj or you can just add it to your own project.
2. Install PostgreSQL and create a database/user for it to use.
3. Use `FullPrunedBlockChain` and `PostgresFullPrunedBlockStore` instead of `BlockChain` and `SPVBlockStore`. The constructor for the postgres store takes arguments telling it how to connect to the database server and what credentials/db name to use.
4. You can then use the `calculateBalanceForAddress` method with an `Address` object to look up the balance.

Currently, this store does not provide a method to actually let you generate spends for any address, even if you have the corresponding private key. Such functionality is often desired in generic "hosted" or "web" wallets. However, the database has all the information needed to do this, so once someone writes the small amount of code needed, it should be easy to drop in.

##Using the MySQL block store

Starting from bitcoinj 0.13, there is a block store backed by MySQL. Using it is similar to using the Postgres store.

</div>
