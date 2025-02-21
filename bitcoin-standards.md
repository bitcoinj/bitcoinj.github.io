---
layout: base
title: "Which BIPs are supported by bitcoinj"
---

# Which BIPs are supported by bitcoinj

## Introduction

_Bitcoin improvement proposals_ are the communities way of standardising new extensions and protocols that build on top of Bitcoin. Bitcoinj either implements or provides API's to help you implement many of these standards; below you can see which BIP's are supported:

<table>
<thead>
<tr class="header">
<th align="left">Number</th>
<th align="left">Name</th>
<th align="left">Relevant API</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td align="left">BIP 11</td>
<td align="left">m-of-n multisig transactions</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/script/ScriptBuilder.html">ScriptBuilder</a></td>
</tr>
<tr class="even">
<td align="left">BIP 14</td>
<td align="left">Protocol version and user agent</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/core/PeerGroup.html#setUserAgent-java.lang.String-java.lang.String-java.lang.String-">PeerGroup.setUserAgent()</a></td>
</tr>
<tr class="odd">
<td align="left">BIP 16</td>
<td align="left">Pay to script hash (P2SH)</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/base/LegacyAddress.html">LegacyAddress</a></td>
</tr>
<tr class="even">
<td align="left">BIP 21</td>
<td align="left">Bitcoin URI scheme</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/uri/BitcoinURI.html">BitcoinURI</a></td>
</tr>
<tr class="odd">
<td align="left">BIP 31</td>
<td align="left">Ping/pong messages</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/core/Peer.html#ping--">Peer.ping()</a></td>
</tr>
<tr class="even">
<td align="left">BIP 32</td>
<td align="left">HD wallets</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/wallet/DeterministicKeyChain.html">DeterministicKeyChain</a></td>
</tr>
<tr class="odd">
<td align="left">BIP 35</td>
<td align="left">mempool message</td>
<td align="left">used automatically</td>
</tr>
<tr class="even">
<td align="left">BIP 37</td>
<td align="left">Bloom filtering</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/core/PeerFilterProvider.html">PeerFilterProvider</a> (used automatically)</td>
</tr>
<tr class="odd">
<td align="left">BIP 39</td>
<td align="left">Mnemonic codes for representing private keys</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/crypto/MnemonicCode.html">MnemonicCode</a></td>
</tr>
<tr class="even">
<td align="left">BIPs 70,&nbsp;71,&nbsp;72</td>
<td align="left">Payment protocol</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/protocols/payments/PaymentSession.html">PaymentSession</a></td>
</tr>
<tr class="odd">
<td align="left">BIP 38</td>
<td align="left">Encrypted private key serialization</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/crypto/BIP38PrivateKey.html">BIP38PrivateKey</a></td>
</tr>
<tr class="odd">
<td align="left">BIP 111</td>
<td align="left">NODE_BLOOM service bit</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/core/Services.html#NODE_BLOOM">Services.NODE_BLOOM</a></td>
</tr>
<tr class="odd">
<td align="left">BIP 130</td>
<td align="left">sendheaders message</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/core/SendHeadersMessage.html">SendHeadersMessage</a></td>
</tr>
<tr class="odd">
<td align="left">BIP 133</td>
<td align="left">feefilter message</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/core/FeeFilterMessage.html">FeeFilterMessage</a></td>
</tr>
<tr class="odd">
<td align="left">BIP 141</td>
<td align="left">Segregated Witness (Consensus layer)</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/core/TransactionWitness.html">TransactionWitness</a>, <a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/core/Transaction.html">Transaction</a></td>
</tr>
<tr class="odd">
<td align="left">BIP 143</td>
<td align="left">Transaction Signature Verification for Version 0 Witness Program</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/core/Transaction.html#hashForWitnessSignature-int-org.bitcoinj.script.Script-org.bitcoinj.core.Coin-org.bitcoinj.core.Transaction.SigHash-boolean-">Transaction.hashForWitnessSignature()</a></td>
</tr>
<tr class="odd">
<td align="left">BIP 144</td>
<td align="left">Segregated Witness (Peer Services)</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/core/Peer.html">Peer</a></td>
</tr>
<tr class="odd">
<td align="left">BIP 155</td>
<td align="left">addrv2 message</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/core/AddressV2Message.html">AddressV2Message</a></td>
</tr>
<tr class="odd">
<td align="left">BIP 159</td>
<td align="left">NODE_NETWORK_LIMITED service bit</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/core/Services.html#NODE_NETWORK_LIMITED">Services.NODE_NETWORK_LIMITED</a></td>
</tr>
<tr class="odd">
<td align="left">BIP 173</td>
<td align="left">Base32 address format for native v0-16 witness outputs</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/base/Bech32.html">Bech32</a>, <a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/base/SegwitAddress.html">SegwitAddress</a></td>
</tr>
<tr class="odd">
<td align="left">BIP 325</td>
<td align="left">Signet</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/params/SigNetParams.html">SigNetParams</a></td>
</tr>
<tr class="odd">
<td align="left">BIP 350</td>
<td align="left">Bech32m format for v1+ witness addresses</td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/base/Bech32.html">Bech32</a>, <a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/base/SegwitAddress.html">SegwitAddress</a></td>
</tr>
<tr class="odd">
<td align="left">RFC 6979</td>
<td align="left"><a href="https://tools.ietf.org/html/rfc6979">Deterministic usage of ECDSA</a></td>
<td align="left"><a href="https://bitcoinj.org/javadoc/0.17/org/bitcoinj/crypto/ECKey.html">ECKey</a></td>
</tr>
</tbody>
</table>
