---
layout: base
title: "Working with contracts"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

#Working with contracts

_How to design and implement contract based applications._

##Introduction

[Contracts](https://en.bitcoin.it/wiki/Contracts) are an exciting feature of Bitcoin that has opened up a new research field - using flexible digital money to produce compelling and innovative applications. The linked wiki page contains some examples of what can be done, but it can sometimes be unclear how to convert them into code.

In this article, we'll look at a few common techniques that are used when implementing contract-based applications. It assumes you're already familiar with how the Bitcoin protocol works and have understood the theory on the contracts page - if something is unclear, please ask on the mailing list.

##Creating multi-signature outputs

Contracts very often use multi-signature outputs in order to allocate value to a group of users ... typically, the participants in the contract protocol. Multi-signature outputs are easy to create with bitcoinj. For the next few examples, we will _not_ be using P2SH (pay to script hash),
so the set of keys chosen won't be representable as a 3... type address. We'll learn more about P2SH at the end.

Let's see how to do it:

{% highlight java %}
// Create a random key.
ECKey clientKey = new ECKey();
// We get the other parties public key from somewhere ...
ECKey serverKey = new ECKey(null, publicKeyBytes);

// Prepare a template for the contract.
Transaction contract = new Transaction(params);
List<ECKey> keys = ImmutableList.of(clientKey, serverKey);
// Create a 2-of-2 multisig output script.
Script script = ScriptBuilder.createMultiSigOutputScript(2, keys);
// Now add an output for 0.50 bitcoins that uses that script.
Coin amount = Coin.valueOf(0, 50);
contract.addOutput(amount, script);

// We have said we want to make 0.5 coins controlled by us and them.
// But it's not a valid tx yet because there are no inputs.
Wallet.SendRequest req = Wallet.SendRequest.forTx(contract);
wallet.completeTx(req);   // Could throw InsufficientMoneyException

// Broadcast and wait for it to propagate across the network.
// It should take a few seconds unless something went wrong.
peerGroup.broadcastTransaction(req.tx).get();
{% endhighlight %}

Alright, now we have broadcast the transaction - note that in some contract protocols, you don't actually broadcast right away. The example above just does it for completeness.

But how do we get the money back again? For that, we need a transaction that includes two signatures, one calculated by us, and one by them.

##Partial signing

A common requirement when implementing contract protocols is to pass around and sign incomplete transactions.

The `Wallet` class doesn't know how to handle outputs that aren't fully owned by it. So we'll have to sign the spending transaction ourselves.

The key point to bear in mind is that when you sign a transaction, what you actually sign is only parts of that transaction. Which parts are controlled by the signature hash (sighash) flags. But no matter which flags you select, the contents of input scripts are never signed. Indeed that must be the case, because otherwise you could never build a transaction - the act of signing the second input would modify the version of the transaction signed by the first, breaking the signature.

This means that signatures can be calculated and sent between different parties in a contract, then inserted into a transaction to make it valid.

Let's look at what the server-side code might look like:

{% highlight java %}
// Assume we get the multisig transaction we're trying to spend from 
// somewhere, like a network connection.
ECKey serverKey = ....;
Transaction contract = ....;
TransactionOutput multisigOutput = contract.getOutput(0);
Script multisigScript = multisigOutput.getScriptPubKey();
// Is the output what we expect?
checkState(multisigScript.isSentToMultiSig());
Coin value = multisigOutput.getValue();

// OK, now build a transaction that spends the money back to the client.
Transaction spendTx = new Transaction(params);
spendTx.addOutput(value, clientKey);
spendTx.addInput(multisigOutput);

// It's of the right form. But the wallet can't sign it. So, we have to
// do it ourselves.
Sha256Hash sighash = spendTx.hashTransactionForSignature(0, multisigScript, Transaction.SIGHASH_ALL, false);
ECKey.ECDSASignature signature = serverKey.sign(sighash);
// We have calculated a valid signature, so send it back to the client:
sendToClientApp(signature);
{% endhighlight %}

The server receives the contract and decides to give all the money back to the client (how generous of it!). It constructs a transaction and signs it. Now the client must repeat the process and construct exactly the same transaction and calculate a signature in the same way. It is then in possession of two valid signatures over the same transaction, one from itself and one from the server. All that is left is to put them both into the transaction:

{% highlight java %}
TransactionOutput multisigContract = ....;
ECKey.ECSDASignature serverSignature = ....;

// Client side code.
Transaction spendTx = new Transaction(params);
spendTx.addOutput(value, clientKey);
TransactionInput input = spendTx.addInput(multisigOutput);
Sha256Hash sighash = spendTx.hashTransactionForSignature(0, multisigScript, Transaction.SIGHASH_ALL, false);
ECKey.ECDSASignature mySignature = clientKey.sign(sighash);

// Create the script that spends the multi-sig output.
Script inputScript = ScriptBuilder.createMultiSigInputScript(
    ImmutableList.of(mySignature, serverSignature), Transaction.SIGHASH_ALL, false);
// Add it to the input.
input.setScriptSig(inputScript);

// We can now check the server provided signature is correct, of course...
input.verify(multisigOutput);  // Throws an exception if the script doesn't run.

// It's valid! Let's take back the money.
peerGroup.broadcastTransaction(spendTx).get();
// Wallet now has the money back in it.
{% endhighlight %}

As you can see, the process involves building a transaction that spends the first one, calculating a signature and then manually building the script that can spend the multi-signature output. Once we've built it, we use `verify()` to ensure the script we wrote satisfies the multisig output correct, and thus that the other side didn't hand us a garbage signature.

##Other SIGHASH modes

You can specify alternative SIGHASH modes to control what is signed and how the other parties can modify the transaction without breaking your signature. These modes are documented on the contracts page linked to above. However, please note that the API for this is likely to change a bit in future.

##P2SH (pay to script hash)

Many kinds of application that use contracts don't need to expose their inner workings to end users, because they can use custom protocols to move the necessary data around instead. But if you want to represent a complex script in a form that a regular wallet can send to, you can create a P2SH address. This looks a bit like a regular Bitcoin address but instead of encoding the hash of a public key, it encodes the hash of a complete script. A P2SH output includes a special kind of non-script which is pattern matched and special rules applied instead of being executed as normal. The scriptSig of the spending input then includes both the "real" scriptPubKey, which must hash to the value in the output, and the inputs to the so-called redeem script.

There are utility methods for creating P2SH style scripts using the `ScriptBuilder` class. When signing for a P2SH output, you should pass the redeem script (not the P2SH scriptPubKey) to `Transaction.hashTransactionForSignature`.

</div>
