---
layout: base
title: "Working with the wallet"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

#Working with the wallet

_Learn how to use the wallet class and craft custom transactions with it._

##Introduction

The Wallet class is one of the most important classes in bitcoinj. It stores keys and the transactions that assign value to/from those keys. It lets you create new transactions which spend the previously stored transactions outputs, and it notifies you when the contents of the wallet have changed.

You'll need to learn how to use the Wallet to build many kinds of apps.

This article assumes you've read Satoshi's white paper and the [WorkingWithTransactions](working-with-transactions) article.

##Setup

For optimal operation the wallet needs to be connected to a `BlockChain` and a `Peer` or `PeerGroup`. The block chain can be passed a Wallet in its constructor. It will send the wallet blocks as they are received so the wallet can find and extract _relevant transactions_, that is, transactions which send or receive coins to keys stored within it. The Peer/Group will send the wallet transactions which are broadcast across the network before they appear in a block.

A Wallet starts out its life with no transactions in it, and thus a balance of zero, regardless of what the block chain contains. To use it you need to download the block chain, which will load the wallet up with transactions that can be analyzed and spent.

{% highlight java %}
Wallet wallet = new Wallet(params);
BlockChain chain = new BlockChain(params, wallet, ...);
PeerGroup peerGroup = new PeerGroup(params, chain);
peerGroup.addWallet(wallet);
peerGroup.startAndWait();
{% endhighlight %}

##Getting addresses

Of course, the snippet of code is fairly useless because there's no way to get money into it. You can obtain keys and addresses from the wallet with the following API calls:

{% highlight java %}
Address a = wallet.currentReceiveAddress();
ECKey b = wallet.currentReceiveKey();
Address c = wallet.freshReceiveAddress();

assert b.toAddress(wallet.getParams()).equals(a);
assert !c.equals(a);
{% endhighlight %}

These can then be handed out to receive payments on. The Wallet has a notion of a "current" address. This is intended for GUI wallets that wish to display an address at all times. Once the current address is seen being used, it changes to a new one. The freshReceiveKey/Address methods on the other hand always return a newly derived address.

##Seeds and mnemonic codes

The keys and addresses returned by these methods are derived deterministically from a seed, using the algorithms laid out in BIP 32 and BIP 39. The life of a key looks like this:

1. A new Wallet object selects 128 bits of random entropy using `SecureRandom`.
2. This randomness is transformed into a "mnemonic code"; a set of 12 words using a dictionary pre-defined by the BIP 39 standard.
3. The string form of the 12 words is used as input to a key derivation algorithm (PBKDF2) and iterated numerous times to obtain the "seed". Note that the seed is *not* simply the original random entropy represented using words as you might expect, rather, the seed is a derivative of the UTF-8 byte sequence of the words themselves.
4. The newly calculated seed is then split into a master private key and a "chain code". Together, these allow for iteration of a key tree using the algorithms specified in BIP 32. This algorithm exploits properties of elliptic curve mathematics to allow the public keys in a sequence to be iterated without having access to the equivalent private keys, which is very useful for vending addresses without needing the wallet to be decrypted if a password has been supplied. bitcoinj uses the default recommended tree structure from BIP 32.
5. The wallet pre-calculates a set of *lookahead keys*. These are keys that were not issued by the Wallet yet via the current/freshReceiveKey APIs, but will be in future. Precalculation achieves several goals. One, it makes these APIs fast, which is useful for GUI apps that don't want to wait for potentially slow EC math to be done. Two, it allows the wallet to notice transactions being made to/from keys that were not issued yet - this can happen if the wallet seed has been cloned to multiple devices, and if the block chain is being replayed.

The seed and keys that were (pre) calculated are saved to disk in order to avoid slow rederivation loops when the wallet is loaded.

The "wallet words" are intended to be easier to work with and write down than a raw private key: users can easily work with them using a pen and paper with less chance of accidentally writing things down wrong. So you're encouraged to expose the words to users as a backup mechanism (make sure they write down the date too, to speed up restore).

You can work with seeds like this:

{% highlight java %}
DeterministicSeed seed = wallet.getKeyChainSeed();
println("Seed words are: " + Joiner.on(" ").join(seed.getMnemonicCode()));
println("Seed birthday is: " + seed.getCreationTimeSeconds());

String seedCode = "yard impulse luxury drive today throw farm pepper survey wreck glass federal";
long creationtime = 1409478661L;
DeterministicSeed seed = new DeterministicSeed(seedCode, null, "", creationtime);
Wallet restoredWallet = Wallet.fromSeed(params, seed);
// now sync the restored wallet as described below.
{% endhighlight %}

The lookahead zone plays an important role when keeping wallets synchronised together. The default zone is 100 keys in size. This means that if wallet A is cloned to wallet B, and wallet A issues 50 keys of which only the last one is actually used to receive payment, wallet B will still notice that payment and move its lookahead zone such that B is tracking 150 keys in total. If wallet A handed out 120 keys and only the 110th received payment, wallet B would not notice anything had happened. For this reason when trying to keep wallets in sync it's important that you have some idea of how many outstanding addresses there may be awaiting payment at any given time. The default of 100 is selected to be appropriate for consumer wallets, but in a merchant scenario you may need a larger zone.

##Replaying the chain

If you import non-fresh keys to a wallet that already has transactions in it, to get the transactions for the added keys you must clear the wallet (using the `clearTransactions` method) and re-download the chain. Currently, there is no way to replay the chain into a wallet that already has transactions in it and attempting to do so may corrupt the wallet. This is likely to change in future. Alternatively, you could download the raw transaction data from some other source, like a block explorer, and then insert the transactions directly into the wallet. However this is currently unsupported and untested. For most users, importing existing keys is a bad idea and reflects some deeper missing feature. Talk to us if you feel a burning need to import keys into wallets regularly.

The Wallet works with other classes in the system to speed up synchronisation with the block chain, but only some optimisations are on by default. To understand what is done and how to configure a Wallet/PeerGroup for optimal performance, please read [SpeedingUpChainSync](/speeding-up-chain-sync).

##Creating spends

After catching up with the chain, you may have some coins available for spending:

{% highlight java %}
System.out.println("You have " + Coin.FRIENDLY_FORMAT.format(wallet.getBalance()));
{% endhighlight %}

Spending money consists of four steps:

1. Create a send request
2. Complete it
3. Commit the transaction and then save the wallet
4. Broadcast the generated transaction

For convenience there are helper methods that do these steps for you. In the simplest case:

{% highlight java %}
// Get the address 1RbxbA1yP2Lebauuef3cBiBho853f7jxs in object form.
Address targetAddress = new Address(params, "1RbxbA1yP2Lebauuef3cBiBho853f7jxs");
// Do the send of 1 BTC in the background. This could throw InsufficientMoneyException.
Wallet.SendResult result = wallet.sendCoins(peerGroup, targetAddress, Coin.COIN);
// Save the wallet to disk, optional if using auto saving (see below).
wallet.saveToFile(....);
// Wait for the transaction to propagate across the P2P network, indicating acceptance.
result.broadcastComplete.get();

{% endhighlight %}

The `sendCoins` method returns both the transaction that was created, and a `ListenableFuture` that let's you block until the transaction has been accepted by the network (sent to one peer, heard back from the others). You can also register a callback on the returned future to learn when propagation was complete, or register your own `TransactionConfidence.Listener` on the transaction to watch the progress of propagation and mining yourself.

At a lower level, we can do these steps ourselves:

{% highlight java %}
// Make sure this code is run in a single thread at once.
Wallet.SendRequest request = Wallet.SendRequest.to(address, value);
// The SendRequest object can be customized at this point to modify how the transaction will be created.
wallet.completeTx(request);
// Ensure these funds won't be spent again.
wallet.commitTx(request.tx);
wallet.saveToFile(...);
// A proposed transaction is now sitting in request.tx - send it in the background.
ListenableFuture<Transaction> future = peerGroup.broadcastTransaction(request.tx);

// The future will complete when we've seen the transaction ripple across the network to a sufficient degree.
// Here, we just wait for it to finish, but we can also attach a listener that'll get run on a background
// thread when finished. Or we could just assume the network accepts the transaction and carry on.
future.get();
{% endhighlight %}

To create a transaction we first build a `SendRequest` object using one of the static helper methods. A `SendRequest` consists of a partially complete (invalid) `Transaction` object. It has other fields let you customize things that aren't done yet like the fee, change address and maybe in future privacy features like how coins are selected. You can modify the partial transaction if you like, or simply construct your own from scratch. The static helper methods on `SendRequest` are simply different ways to construct the partial transaction.

Then we complete the request - that means the transaction in the send request has inputs/outputs added and signed to make the transaction valid. It's now acceptable to the Bitcoin network.

Note that between `completeTx` and `commitTx` no lock is being held. So it's possible for this code to race and fail if the wallet changes out from underneath you - for example, if the keys in the wallet have been exported and used elsewhere, and a transaction that spends the selected outputs comes in between the two calls. When you use the simpler construction the wallet is locked whilst both operations are run, ensuring that you don't end up trying to commit a double spend.

##When to commit a transaction

To _commit_ a transaction means to update the spent flags of the wallets transactions so they won't be re-used. It's important to commit a transaction at the right time and there are different strategies for doing so. 

The default sendCoins() behaviour is to commit and then broadcast, which is a good choice most of the time. It means there's no chance of accidentally creating a double spend if there's a network problem or if there are multiple threads trying to create and broadcast transactions simultaneously. On the other hand, it means that if the network doesn't accept your transaction for some reason (eg, insufficient fees/non-standard form) the wallet thinks the money is spent when it wasn't and you'll have to fix things yourself.

You can also just not call `wallet.commitTx` and use `peerGroup.broadcastTransaction` instead. Once a transaction has been seen by a bunch of peers it will be given to the wallet which will then commit it for you. The main reason you may want to commit after successful broadcast is if you're experimenting with new code and are creating transactions that won't necessarily be accepted. It's annoying to have to constantly roll back your wallet in this case. Once you know the network will always accept your transactions you can create the send request, complete it and commit the resulting transaction all under a single lock so multiple threads won't create double spends by mistake.

##Understanding balances and coin selection

The `Wallet.getBalance()` call has by default behaviour that may surprise you. If you broadcast a transaction that sends money and then immediately afterwards check the balance, it may be lower than what you expect (or even be zero).

The reason is that bitcoinj has a somewhat complex notion of _balance_. You need to understand this in order to write robust applications. The `getBalance()` method has two alternative forms. In one, you pass in a `Wallet.BalanceType` enum. It has two values, `AVAILABLE` and `ESTIMATED`. Often these will be the same, but sometimes they will vary. The other overload of `getBalance()` takes a `CoinSelector` object.

The `ESTIMATED` balance is perhaps what you may imagine as a "balance" - it's simply all outputs in the wallet which are not yet spent. However, that doesn't mean it's really safe to spend them. Because Bitcoin is a global consensus system, deciding when you can really trust you received money and the transaction won't be rolled back can be a subtle art. 

This concept of safety is therefore exposed via the `AVAILABLE` balance type, and the `CoinSelector` abstraction. A coin selector is just an object that implements the `Wallet.CoinSelector` interface. That interface has a single method, which given a list of all unspent outputs and a target value, returns a smaller list of outputs that adds up to at least the target (and possibly more). Coin selection can be a complex process that trades off safety, privacy, fee-efficiency and other factors, which is why it's pluggable.

The default coin selector bitcoinj provides (`Wallet.DefaultCoinSelector`) implements a relatively safe policy: it requires at least one confirmation for any transaction to be considered for selection, except for transactions created by the wallet itself which are considered spendable as long as it was seen propagating across the network. This is the balance you get back when you use `getBalance(BalanceType.AVAILABLE)` or the simplest form, `getBalance()` - it's the amount of money that the spend creation methods will consider for usage. The reason for this policy is as follows:

1. You trust your own transactions implicitly, as you "know" you are yourself trustworthy. However, it's still possible for bugs and other things to cause you to create unconfirmable transactions - for instance if you don't include sufficient fees. Therefore we don't want to spend change outputs unless we saw that network nodes relayed the transaction, giving a high degree of confidence that it will be mined upon.
2. For other transactions, we wait until we saw at least one block because in SPV mode, you cannot check for yourself that a transaction is valid. If your internet connection was hacked, you might be talking to a fake Bitcoin network that feeds you a nonsense transaction which spends non-existent Bitcoins. Please read the [SecurityModel](/security-model) article to learn more about this. Waiting for the transaction to appear in a block gives you confidence the transaction is real. The original Bitcoin client waits for 6 confirmations, but this value was picked at a time when mining hash rate was much lower and it was thus much easier to forge a small fake chain. We've not yet heard reports of merchants being defrauded using invalid blocks, so waiting for one block is sufficient.

The default coin selector also takes into account the age of the outputs, in order to maximise the probability of your transaction getting confirmed in the next block. 

The default selector is somewhat customisable via subclassing. But normally the only customisation you're interested in is being able to spend unconfirmed transactions. If your application knows the money you're receiving is valid via some other mechanism (e.g. you are connected to a trusted node), or you just don't care about fraud because the value at stake is very low, then you can call `Wallet.allowSpendingUnconfirmedTransactions()` to make the wallet drop the 1-block policy.

You can also choose the coin selector on a per-payment basis, using the `SendRequest.coinSelector` field.

As a consequence of all of the above, if you query the `AVAILABLE` balance immediately after doing a `PeerGroup.broadcastTransaction`, you are likely to see a balance lower than what you anticipate, as you're racing the process of broadcasting the transacation and seeing it propagate across the network. If you instead call `getBalance()` after the returned `ListenableFuture<Transaction>` completes successfully, you will see the balance you expect.

##Using fees

Transactions can have fees attached to them when they are completed by the wallet. To control this, the `SendRequest` object has several fields that can be used. The simplest is `SendRequest.fee` which is an absolute override. If set, that is the fee that will be attached. A more useful field is `SendRequest.feePerKb` which allows you to scale the final fee with the size of the completed transaction. When block space is limited, miners decide ranking by fee-per-1000-bytes so typically you do want to pay more for larger transactions, otherwise you may fall below miners fee thresholds. 

There are also some fee rules in place intended to avoid cheap flooding attacks. Most notably, any transaction that has an output of value less than 0.01 coins ($1) requires the min fee which is currently set to be 10,000 satoshis (0.0001 coins or at June 2013 exchange rates about $0.01). By default nodes will refuse to relay transactions that don't meet that rule, although mining them is of course allowed. You can disable it and thus create transactions that may be un-relayable by changing `SendRequest.ensureMinRequiredFee` to false.

bitcoinj will by default ensure you always attach a small fee per kilobyte to each transaction regardless of whether one is technically necessary or not. The amount of fee used depends on the size of the transaction. You can find out what fee was attached by reading the fee field of `SendRequest` after completion. There are several reasons for why bitcoinj always sets a fee by default:

* Most apps were already setting a fixed fee anyway.
* There is only 27kb in each block for free "high priority" transactions. This is a quite small amount of space which will often be used up already.
* SPV clients have no way to know whether that 27kb of free-high-priority space is already full in the next block.
* The default fee is quite low.
* It more or less guarantees that the transaction will confirm quickly.

Over time, it'd be nice to get back to a state where most transactions are free. However it will require some changes on the C++ and mining side along with careful co-ordinated rollouts.

##Learning about changes

The wallet provides the `WalletEventListener` interface for learning about changes to its contents. You can derive from `AbstractWalletEventListener` to get a default implementation of these methods. You get callbacks on:

* Receiving money.
* Money being sent from the wallet (regardless of whether the tx was created by it or not).
* Changes in transaction confidence. See [WorkingWithTransactions](working-with-transactions) for information about this.

##Saving the wallet at the right times

By default the Wallet is just an in-memory object, it won't save by itself. You can use `saveToFile()` or `saveToOutputStream()` when you want to persist the wallet. It's best to use `saveToFile()` if possible because this will write to a temporary file and then atomically rename it, giving you assurance that the wallet won't be half-written or corrupted if something goes wrong half way through the saving process.

It can be difficult to know exactly when to save the wallet, and if you do it too aggressively you can negatively affect the performance of your app. To help solve this, the wallet can auto-save itself to a named file. Use the `autoSaveToFile()` method to set this up. You can optionally provide a delay period, eg, of a few hundred milliseconds. This will create a background thread that saves the wallet every N milliseconds if it needs saving. Note that some important operations, like adding a key, always trigger an immediate auto-save. Delaying writes of the wallet can help improve performance in some cases, eg, if you're catching up a wallet that is very busy (has lots of transactions moving in and out). You can register an auto-save listener to learn when the wallet saved itself.

##Creating multi-sends and other contracts

The default `Wallet.SendRequest` static methods help you construct transactions of common forms, but what if you want something more advanced? You can customize or build your own transaction and put it into a `SendRequest` yourself.

Here's a simple example - sending to multiple addresses at once. A fresh `Transaction` object is first created with the outputs specifying where to send various quantities of coins. Then the incomplete, invalid transaction is _completed_, meaning the wallet adds inputs (and a change output) as necessary to make the transaction valid.

{% highlight java %}
Address target1 = new Address(params, "17kzeh4N8g49GFvdDzSf8PjaPfyoD1MndL");
Address target2 = new Address(params, "1RbxbA1yP2Lebauuef3cBiBho853f7jxs");
Transaction tx = new Transaction(params);
tx.addOutput(Utils.toNanoCoins(1, 10), target1);
tx.addOutput(Utils.toNanoCoins(2, 20), target2);
Wallet.SendRequest request = Wallet.SendRequest.forTx(tx);
if (!wallet.completeTx(request)) {
  // Cannot afford this!
} else {
  wallet.commitTx(request.tx);
  peerGroup.broadcastTransaction(request.tx).get();
}
{% endhighlight %}

You can add arbitrary `TransactionOutput` objects and in this way, build transactions with exotic reclaim conditions. For examples of what is achievable, see [contracts](https://en.bitcoin.it/wiki/Contracts).

At this time `SendRequest` does not allow you to request unusual forms of signing like `SIGHASH_ANYONECANPAY`. If you want to do that, you must use the lower level APIs. Fortunately it isn't hard - you can see examples of how to do that in the article [WorkingWithContracts](working-with-contracts).

##Encrypting the private keys

It's a good idea to encrypt your private keys if you only spend money from your wallet rarely. The `Wallet.encrypt("password")` method will derive an AES key from an Scrypt hash of the given password string and use it to encrypt the private keys in the wallet, you can then provide the password when signing transactions or to fully decrypt the wallet. You can also provide your own AES keys if you don't want to derive them from a password, and you can also customize the Scrypt hash parameters.

[Scrypt](http://www.tarsnap.com/scrypt.html) is a hash function designed to be harder to brute force at high speed than alternative algorithms. By selecting difficult parameters, a password can be made to take multiple seconds to turn into a key. In the WalletTemplate application you can find code that shows how to measure the speed of the host computer and then select scrypt parameters to give encryption/decryption time of a couple of seconds.

Once encrypted, you will need to provide the AES key whenever you try and sign transactions. You do this via the `SendRequest` object:

{% highlight java %}
Address a = new Address(params, "1RbxbA1yP2Lebauuef3cBiBho853f7jxs");
Wallet.SendRequest req = Wallet.SendRequest.to(a, Coin.parseCoin("0.12"));
req.aesKey = wallet.getKeyCrypter().deriveKey("password");
wallet.sendCoins(req);
{% endhighlight %}

The wallet can be decrypted by using the `wallet.decrypt` method which takes either a textual password or a `KeyParameter`.

Note that because bitcoinj saves wallets by creating temp files and then renaming them, private key material may still exist on disk even after encryption. Especially with modern SSD based systems deleting data on disk is rarely completely possible. Encryption should be seen as a reasonable way to raise the bar against adversaries that are not extremely sophisticated. But if someone has already gained access to their wallet file, they could theoretically also just wait for the user to type in their password and obtain the private keys this way. Encryption is useful but should not be regarded as a silver bullet.

##Watching wallets

A wallet can cloned such that the clone is able to follow transactions from the P2P network but doesn't have the private keys needed for spending. This arrangement is very useful and makes a lot of sense for things like online web shops. The web server can observe all payments into the shops wallet, so knows when customers have paid, but cannot authorise withdrawals from that wallet itself thus significantly reducing the risk of hacking.

To create a watching wallet from another HD BIP32/bitcoinj wallet:

{% highlight java %}
Wallet toWatch = ....;

DeterministicKey watchingKey = toWatch.getWatchingKey();

// Get the standardised base58 encoded serialization
System.out.println("Watching key data: " + watchingKey.serializePubB58());
System.out.println("Watching key birthday: " + watchingKey.getCreationTimeSeconds());

//////////////////////////////////////////////////////////////////////////////////////////

DeterministicKey key = DeterministicKey.deserializeB58(null, "key data goes here");
long keyBirthday = 12345678L;
Wallet watchingWallet = Wallet.fromWatchingKey(params, key, keyBirthday);
// now attach watchingWallet and replay the chain as normal.
{% endhighlight %}

The "watching key" in this case is the public form of the BIP32 account zero key i.e. it's the first key derived from the master. Because of how BIP32 works, the watching key cannot be the master public key itself. The internal (change) and external (for handing out) chains are both below this and thus all keys generated by each wallet will be in sync. In the web server case, the server can just call `wallet.freshReceiveAddress()` as normal. The original wallet will be able to see all the payments received to the watching wallet and also spend them, when synced. But it can be stored offline (a so called "cold wallet") for extra security. 

You can also create a wallet that watches arbitrary addresses or scripts even if you don't have the HD watching key:

{% highlight java %}
wallet.addWatchedAddress(...);
wallet.addWatchedScripts(List.of(script, script, script));
{% endhighlight %}

Obviously in this case you don't get auto synchronisation of new keys/addresses/scripts.

##Married/multi-signature wallets and pluggable signers

Starting from bitcoinj 0.12 there is some support for wallets which require multiple signers to cooperate to sign transactions. This allows the usage of a remote "risk analysis service" which may only countersign transactions if some additional authorisation has been obtained or if the transaction seems to be low risk. A wallet that requires the cooperation of a third party in this way is called a *married wallet*, because it needs the permission of its spouse to spend money :-)

To marry a wallet to another one, the spouse must also be an HD wallet using the default BIP 32 tree. You must obtain the watching key of that other wallet via some external protocol (it can be retrieved as outlined above) and then do:

{% highlight java %}
DeterministicKey spouseKey = ....;
wallet.addFollowingAccountKeys(Lists.newArrayList(spouseKey), 2);   // threshold of 2 keys, i.e. both are needed to spend.

Address a = wallet.freshReceiveAddress();
assert a.isP2SHAddress();
{% endhighlight %}

Once a wallet has a "following key" it becomes married and the API changes. You can no longer call `freshReceiveKey` or `currentReceiveKey` because those are specified to return single keys and a married wallet can only have money sent to it using pay-to-script-hash (P2SH) addresses, which start with the number 3 when written down. Instead you should use `currentReceiveAddress` and `freshReceiveAddress` exclusively.

The following key HD hierarchy must match the key hierarchy used by the wallet itself. That is, it's not possible for the remote server to have a single HD key hierarchy that is shared between all users: each user must have their own key tree.

The way you spend money also changes. Whilst the high level API remains the same, the Wallet will throw an exception if you try to send coins without installing a pluggable transaction signer. The reason is, whilst it knows how to sign with its own private keys, it doesn't know how to talk to the remote service and get the relevant signatures to finish things off.

A pluggable transaction signer is an object that implements the `TransactionSigner` interface. It must have a no-args constructor and can provide data that will be serialized to the wallet when saved, such as authentication credentials. During setup it should be created, configured with whatever info is required to let it talk to the remote service, authenticate and obtain signatures. Once configured the `isReady` method should start returning true, and it can now be added to the wallet using the `Wallet.addTransactionSigner` method. This only has to be done once as deserialization will recreate the object using reflection and then use the `TransactionSigner.deserialize(byte[])` method to reload it.

The Wallet class runs transaction signers in sequence. First comes the `LocalTransactionSigner` which knows how to use the private keys in the wallet's `KeyBag`. Then comes yours. The `TransactionSigner.signInputs(ProposedTransaction, KeyBag)` method is called and the transaction inside the `ProposedTransaction` object should have signatures fetched from the remote service and inserted as appropriate. The HD key paths to use can be retrieved from the `ProposedTransaction` object.

Married wallets support is relatively new and experimental. If you do something with it, or encounter problems, let us know!

</div>
