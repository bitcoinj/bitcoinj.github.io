---
layout: base
title: "Working with BIP47 payment codes"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

# Working with BIP47 payment codes

## Introduction

BIP47 payment codes are 80-byte BIP32 and BIP44 compatible addresses, designed to improve the privacy of the person who spends and receives. The implementation adds metadata to a bitcoinj wallet: payment codes to keep as contacts representing payment channels, used to generate deposit addresses specific to each channel and for each payment event.

In [version 1](https://github.com/justusranvier/bips/blob/master/bip-0047.mediawiki#Version_1) of payment codes, currently implemented, the person initiates the channel by spending the minimum allowed amount (546 satoshis) in a notification transaction to the recipient. After this, the recipient can receive payments  coming from the payer.

In [version 2](https://github.com/justusranvier/bips/commit/283aa14f77b633be67c647d294a35999723ce366#diff-182cbc866afabb49eef4dca7f3d38a96), the change script of the notification transaction is modified so that the amount transfered is destined for the payer. In this way, the output to the notification address of the recipient is completely eliminated.

In [version 3](https://github.com/OpenBitcoinPrivacyProject/bips/pull/8), the reusability of payment addresses is generalized to be used in Bitcoin and in other blockchains too.

Some benefits when using this API are:

- Reusing a payment code without privacy leaks such as revelation of total balance.
- Keeping the deposit address secret to senders and recipients.
- Knowing which contact sent a payment and using his code to reimburse.
- Preserving the ability to restore wallets from seeds.
- Relying only on the bitcoin protocol and not in third party services.

You can read the [original announcement](https://www.reddit.com/r/Bitcoin/comments/3alzga/bip47_reusable_payment_codes/) or read [how BIP47 is compared with Monero](https://medium.com/billion-crypto-stories/how-bip47-reusable-payment-codes-enrich-bitcoin-and-overall-cryptocurrency-user-experience-6f929c87a61b).

## Protocol overview (version 1)

In a notification that Alice sends to Bob:

```
0. Alice obtains Bob's payment code by some means external to the protocol.
1. Alice takes the xpub to create a BIP32 hierarchy for Bob.
2. Alice builds a transaction by sending the minimum allowed to Bob's notification address.
3. Alice calculates a (shared) secret key with the private key of her first input and the public key associated with Bob's notifications address.
4. Alice encrypts her payment code for Bob using the shared secret key wrapped in an OP_RETURN.
5. Alice sends the transaction notifying Bob.
```

In a notification that Bob receives from Alice:

```
1. Bob identifies a transaction in his notification address and checks whether it contains an OP_RETURN with a valid payment code.
2. Bob calculates the (shared) secret key using the private key of his notification address and the public key associated with the first input of Alice.
3. Bob decrypts Alices's payment code using the shared secret key and adds her as a contact in his wallet.
4. Bob generates the following N deposit addresses for Alice in his wallet and updates his bloom filters to monitor payment transactions.
```

In a payment that Alice sends to Bob:

```
1. Alice finds the next BIP44 child index not used for Bob (if it is the first payment in the channel, the child in index 1)
2. Alice calculates a (shared) secret key using the private key associated with her notification address and the public key associated with the child selected for Bob.
2. Alice finds a valid EC point that derives a public key that Bob will be watching.
3. Alice uses Bob's public key to send him the transaction.
4. Alice increases the child index to use for Bob in the future.
```

In a payment that Bob receives from Alice:

```
1. Bob generates another deposit address for Alice, keeping the following N directions of the channel monitored.
```

Alice's wallet persists Bob's deposit address in the payment channel metadata, so she will associate this payment to Bob efficiently in the future. Bob's wallet will generate a new deposit address and import it to his watch list.


## Creating a new BIP47 wallet

`BIP47AppKit` is the class that allows to send and receive BIP47 payments. It takes network and coin name parameters to support various coins, such as BTC, tBTC, BCH or tBCH. It takes a folder as a parameter to save the wallet, blockstore and bip47 metadata files.

```
String coin = "BTC";
NetworkParameters params;
File workingDir = new File("BIP47-Wallets");

switch (coin){
    case "BCH":
        params = BCCMainNetParams.get();
        break;
    case "tBCH":
        params = BCCTestNet3Params.get();
        break;
    case "BTC":
        params = MainNetPArams.get();
        break;
    case "tBTC":
        params = TestNet3Params.get();
        break;
}

System.out.println("Creating new " + coin + " wallet ...");
org.bitcoinj.core.Context.propagate(new org.bitcoinj.core.Context(params));
BIP47AppKit bip47App = new BIP47AppKit(coin, params, workingDir, null);
System.out.println("Creating new " + coin + " wallet ... done.");

System.out.print("Adding progress tracker ...")
class ProgressTracker extends BlockchainDownloadProgressTracker{
    private double percentage;
    public Listener(String coin){
        super(coin);
    }
    @Override
    protected void progress(double pct, int blocksSoFar, Date date) {
      this.percentage = pct;
    }
    @Override
    int getProgress() {
        return (int)percentage;
    }
}
bip47App.setBlockchainDownloadProgressTracker(new ProgressTracker())
System.out.print("Adding progress tracker ... done.")

System.out.print("Starting " + coin + " blockchain download ...")
bip47App.startBlockchainDownload()
System.out.print("Starting " + coin + " blockchain download ... done.")
```

The wallet will connect to peers in the network and the download in the background. To check what the wallet's last block is, see `bip47App.vWallet.getLastBlockSeenHeight().`

## Restoring a BIP47 wallet from seed

The last parameter in the constructor of `BIP47AppKit` is a `DeterministicSeed` that holds the bytes for replaying the entire balance of a BIP47 wallet using a BIP39 mnemonic. The mnemonic is a phrase of words of length divisible by 3, of which the largest possible mnemonic is 24 words long.

```
import org.bitcoinj.crypto;*;
long bornDate = MnemonicCode.BIP39_STANDARDISATION_TIME_SECS;
String mnemonic = "response seminar brave tip suit recall often sound stick owner lottery motion";
DeterministicSeed seed = new DeterministicSeed(mnemonic, null, "", bornDate);
BIP47AppKit bip47RestoredApp = new BIP47AppKit(coin, params, dir, seed);
```

## Sending a transaction to a payment code

Once a wallet is created and funded, it can establish a bip47 contact by making a payment.

```
String bip47PaymentCode = "PM8TJS2JxQ5ztXUpBBRnpTbcUXbUHy2T1abfrb3KkAAtMEGNbey4oumH7Hc578WgQJhPjBxteQ5GHHToTYHE3A1w6p7tU6KSoFmWBVbFGjKPisZDbP97"

Bip47AppKit bip47App = new BIP47AppKit(coin, params, dir, seed)

SendRequest notification = bip47App.makeNotificationTransaction(bip47PaymentCode)

Runnable callback = new Runnable() {
      @Override
      public void run() {
         System.out.println("Transaction sent");
      }
  }

Executor executor = Executors.newSingleThreadExecutor();

bip47App.broadcastTransaction(notification.tx).addListener(callback, executor);

bip47App.putPaymenCodeStatusSent(bip47PaymentCode, notification.tx);

BIP47Channel paymentChannel = bip47App.getBip47MetaForPaymentCode(bip47PaymentCode);

Address depositAddress;
if (paymentChannel != null && paymentChannel.isNotificationTransactionSent()) {
   depositAddress = currentWallet().getCurrentOutgoingAddress(paymentChannel);
}

Coin amount = Coin.valueOf(1000);

SendRequest payment = wallet.createSend(depositAddress, amount);

bip47App.broadcastTransaction(payment.tx).addListener(callback, executor);
```

When the wallet creates or receives a bip47 payment for the first time, a .bip47 file is created that contains the payment channels serialized. Every payment channel contains information such as whether the wallet has sent a notification transaction back, a list of deposit addresses seen receiving payments and addresses used for sending payments.

### Listening to BIP47 transactions

This portion of code listens to BIP47 transactions and prints the payment code that sent it.

```
def bip47Listener = new TransactionEventListener() {
    @Override
    public void onTransactionReceived(BIP47AppKit app, Transaction tx) {

        String paymentCode;
        if (wallet.isNotificationTransaction(tx)) {
            paymentCode = app.getPaymentCodeInNotificationTransaction(tx);
            System.out.println("Received notification from payment code: "+ paymentCode);
        } else if (app.isToBIP47Address(transaction)) {
            String depositAddress = app.getAddressOfReceived(tx).toString();
            paymentCode = wallet.getPaymentCodeForAddress(depositAddress);
            System.out.println("Received payment from payment code: " + paymentCode)
        }
    }
}

BIP47AppKit bip47App = new BIP47AppKit(..)
bip47App.addOnReceiveTransactionListener(bip47Listener);
```

</div>
