---
layout: base
title: "Using the experimental full verification mode"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

# Using the experimental full verification mode

## Introduction

Starting with version 0.7, bitcoinj can be run fully verifying. This means it aims to behave the same way as the standard Bitcoin node does: all transaction scripts are run, signatures verified and double spends are checked for, amongst other things. It's very far from achieving that goal however, so it cannot be relied on.

You may wish to experiment with this mode if you are building an application that falls into the following categories:

* You want direct access to the set of unspent outputs.
* You want to be able to test validity of an unconfirmed transaction without depending on randomly selected peers.
* You want a higher degree of security than is possible with simplified payment verification.

To review the tradeoffs involved with full vs SPV mode, read the [SecurityModel](/security-model) page.

## Understanding the risks

Before you begin, it is vitally important that you read and understand this warning.

**Full verification in bitcoinj is not the focus of the library and almost certainly contains chain splitting bugs. If you rely on it, an attacker may exploit bugs in the code to fork you onto a separate chain and potentially defraud you of money.**

In particular _**UNDER NO CIRCUMSTANCES SHOULD YOU MINE ON A BITCOINJ VALIDATED CHAIN**_.

It is difficult to overemphasize this risk. To be safe, bitcoinj must match the behavior of Satoshi's code exactly, including all the bugs. Any deviation at all can be potentially used to split the consensus. This is problematic if you are a merchant and could put the entire system at risk if you are a miner.

Full verification currently doesn't support Segwit or Taproot at all. By design of Segwit, all witness transactions will bypass verification.

The most reliable configuration in which to use bitcoinj is in SPV mode, connected to a regular C++ Bitcoin node that you control. In this way, you are sure that the data feed your app gets has been validated by your node and many obscure avenues for attack can be filtered out.

</div>
