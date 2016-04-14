---
layout: base
title: "Working with the BIP70 payment protocol API"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

# Working with the BIP70 payment protocol API

## Introduction

The _payment protocol_ is the term used to refer to the protocol specified in [BIP 70](https://github.com/bitcoin/bips/blob/master/bip-0070.mediawiki), 71, 72 and 73. The payment protocol is designed add additional features to Bitcoin by replacing the ubiquitous Bitcoin address with small files that can encode more complex parameters. It specifies a format for _payment requests_, _payments_ and _payment acks_ that flow directly between the sender and receiver of funds.

The payment protocol is critical to the development of all kinds of important features for Bitcoin, and as such it's important that you understand what it does how to work with it. This article explains the basic features, and shows some example code for integrating it into a wallet app.

Specifically, version 1 of the protocol provides:

1. A way for a receiver/merchant to request multiple outputs with arbitrary scripts, instead of just a single output of pay-to-key-hash type. Payments can be satisfied with multiple independent transactions, allowing for [merge avoidance](https://medium.com/p/7f95a386692f) based privacy techniques to be implemented in future.
2. Free-text memo fields, so merchants can fill out details of the purchase that could be stored by wallets and users can attach messages in the act of paying.
3. Expiry times, so a payment request that is too old may be treated as invalid. This allows receivers to bound their resource usage on the server side and abandon shopping carts that are never paid for.
4. Issue times, so a payment request knows when it was issued - good for record keeping.
5. A binary cookie-esque field that will be simply echoed back to the server when the payment transactions are submitted, allowing merchants to implement stateless backends.
6. A user-specified refund address.
7. An optional ability to sign all of the above using X.509 digital certificates, thus binding the payment request to some kind of validated identity.

The fact that payment requests can be digitally signed itself enables some very important and useful features. A man in the middle cannot rewrite the outputs to hijack the payment. This is especially important for hardware wallets like the Trezor which assume a compromised host, as otherwise there would be no way for a user to know that the payment they're authorizing is the same as the payment the merchant requested.

Also, the digitally signed payment request and transactions that satisfy it on the block chain, together create a proof of payment that is very much like a receipt. Receipts are useful for dispute mediation and proving a purchase without the merchant having to keep exhaustive databases of every customer they ever had - simply presenting the receipt is sufficient to prove you made a purchase even if the merchant has deleted its data about you.

Protocol buffers are a binary data serialisation format that can be easily extended. Thus, we can easily imagine [many other features that might be added in future](https://bitcointalk.org/index.php?topic=270055.msg2890147#msg2890147).

You can read a [FAQ on the payment protocol which details the rationale behind its design](https://bitcointalk.org/index.php?topic=300809.0).

## Protocol overview

In a normal Bitcoin payment, the process starts with the user either clicking a bitcoin URI or copy and pasting a textual address into their wallet app and manually specifying the amount.

In a payment handled by the payment protocol, the process is initiated in one of two ways:

1. The user clicks a Bitcoin URI that has a new "r" parameter, which contains a (http) URL that resolves to a payment request file.
2. The user opens a payment request file directly.

The user's wallet then parses the payment request data, which is a protocol buffer, and starts the process of requesting confirmation as normal. When clicking a Bitcoin URI, the instructions in the rest of the URI are ignored (they are for backwards compatibility only) and the data found at the given URL takes precedence.

The payment request is made up of an outer "skin" message that contains (optional) signature and certificate data, and an embedded serialization of the inner "core" message that contains the details of the requested payment. The outer `PaymentRequest` message is agnostic as to the kind of digital signature infrastructure used, but currently only an X.509 binding is defined. This is the same system as used in SSL. The inner `PaymentDetails` message is stored in binary form rather than being embedded like a normal protobuf message would be to ensure that signature bytes always match.

Once a satisfying set of Bitcoin transactions are created by the wallet, a `Payment` message is formatted and uploaded to the destination URL specified by `PaymentDetails`, and then a `PaymentACK` message is received by the wallet once the payment is accepted satisfactorily.

## Signing and certificates

The purpose of signed payment requests is to replace a message like this in the users wallet app:

    Pay 10mBTC to 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?

with one like these:

* Pay 10mBTC to satoshin@gmx.com?
* Pay 20mBTC to overstock.com?
* Pay 30mBTC to Michael Hearn?
* Pay 100 BTC to Genius Widgets, Inc of San Francisco, California

... the first form, of course, being the most useless of all as the identity in that case is merely a random number which has no meaning or stability. This leads to the question of where the strings in the other examples came from.

The answer is that they are contained inside a _X.509 digital certificate_ which is itself signed by a _certificate authority_. Despite the name, a CA is merely any entity that signs certificates and the only thing that gives them any authority is the trust of people's software. There is a competitive market for ID verification and the issuance of certificates, meaning you can obtain certificates for very easily verified identities like email addresses or domain names for free. More complex kinds of identity, such as the legal names of people or companies, take more effort to verify and thus must be paid for.

Technically speaking a certificate is just a statement about a public key, thus to request one you must first generate a private key, then a a _certificate signing request_ (CSR) and then select a CA and upload the CSR, along with your desired identity and any info required to verify that. Then the CA delivers back a signed certificate, which can be embedded into a payment request along with any intermediate certificates needed to reach the set of root certs. The private key is then used to sign the `PaymentDetails` message, and now the other users software can verify all this and show the validated ID in the user interface. It also acts as cryptographic proof that you actually issued the given payment request at the specified time.

In practice, the above process of creating keys manually, creating a CSR, uploading it etc is typically automated away for end user email-address certificates: instead any modern web browser that supports HTML5 can be used to step through the process automatically. After visiting a CA that issues free certificates such as [Comodo](http://www.comodo.com/home/email-security/free-email-certificate.php), the user enters the requested email address and clicks button. Their browser then generates a fresh private key and records it. When the user clicks the verification link delivered to their email address, the signing process completes and the certificate is installed in the local key store where it could be used or exported to another device. The whole process is not much different to signing up for a web site.

## The payment protocol API in bitcoinj

In 0.12 the payment protocol support in bitcoinj is limited. It supports everything needed for basic support in wallet apps for signing and consuming payment requests. However, it does not support storing them in the wallet for future reference. Nor does bitcoinj take advantage of the opportunity to submit multiple independent transactions to a recipient for merge avoidance purposes.

Despite that, here's a demo of how we can use the new functionality.

{% highlight java %}
String url = QRCodeScanner.scanFromCamera(.....);
ListenableFuture<PaymentSession> future;
if (url.startsWith("http")) {
    // URL may serve either HTML or a payment request depending on how it's fetched. 
    // Try here to get a payment request.
    future = PaymentSession.createFromUrl(url);
} else if (url.startsWith("bitcoin:")) {
    future = PaymentSession.createFromBitcoinUri(new BitcoinURI(url));
}

PaymentSession session = future.get();    // may throw PaymentRequestException.

String memo = session.getMemo();
Coin amountWanted = session.getValue();

if (session.isExpired()) {
    showUserErrorMessage();
}

PaymentSession.PkiVerificationData identity = null;
try {
    identity = session.verifyPki();
} catch (Exception e) {
    log.error(e);
    // Don't show errors that occur during PKI verification to the user!
    // Just treat such payment requests as if they were unsigned. This way
    // new features and PKI roots can be introduced in future without
    // being disruptive.
}

if (identity != null) {
    showUserConfirmation(identity.domainName, identity.orgName);
} else { 
    showUserConfirmation();
}

// a bit later when the user has confirmed the payment

SendRequest req = session.getSendRequest();
wallet.completeTx(req);  // may throw InsufficientMoneyException
// No refund address specified, no user specified memo field.
ListenableFuture<PaymentSession.Ack> ack = session.sendPayment(ImmutableList.of(req.tx), null, null);
Futures.addCallback(ack, new FutureCallback() {
    @Override public onSuccess(PaymentSession.Ack ack) {
        wallet.commitTx(req.tx);
        displayMessage(ack.getMemo());
    }
});
{% endhighlight %}

## User interface considerations

It's very important that you present payment protocol confirmations in a certain way.

Firstly, if signed PKI data is available, you should indicate that to the user in some visually meaningful way, so they know the string that is presented is an ID verified by a third party. The name of the third party (i.e. the CA) should be visible too, although hiding it by default behind a toggle/slider is acceptable.

Secondly, if signed PKI data is provided but fails to verify, then the payment should be presented in exactly the same way as if the signature data was missing entirely. The experience of opening an incorrectly signed request should never be worse than opening a request that isn't signed at all. This gives us flexibility to introduce new certificate authorities or signing systems in future.

## QR codes

If your app has integrated support for scanning QR codes, you should pay attention to BIP 73. It says that if a wallet app scans a QR code and finds an HTTP URL instead of a Bitcoin URI, it should do an HTTP[S] GET to that URL with a special HTTP header that asks the server for a payment request.

The purpose of this mechanism is so merchants and payment processors can present a QR code that will work on any kind of QR scanner, and if the user doesn't have a wallet with an integrated scanner, a nice HTML invoice page with instructions and a clickable bitcoin link can be presented instead.

## Operating system integration

If writing a wallet app, you should register to handle bitcoin URIs, and you should also register to handle files of type application/bitcoin-paymentrequest with extension .bitcoinpaymentrequest

By doing this, you ensure your app can handle payment requests attached to emails, sent via IM apps and so on.

Ideally, you would also allow the user to create payment requests too. The `PaymentRequest` message can have a pki_type of "none" so it's valid to create such files. For a simple user experience, we suggest:

* On the desktop, allowing the user to drag/drop a payment request file (represent this as an icon). For example, a user could drag it onto an email compose window to attach the payment request to an email vs copy/pasting an address and amount manually. Gmail supports files being dropped onto the editor and other HTML5 apps can also accept drag/dropped data.
* On mobile, allow the user to "share" the payment request file, this will allow the user to send it via chat apps, attach to emails, share via DropBox/Google Drive and so on.

## Testing

Gavin runs a simple payment request generator app here:

   https://bitcoincore.org/~gavin/createpaymentrequest.php

You can use this to test your wallets implementation.

</div>
