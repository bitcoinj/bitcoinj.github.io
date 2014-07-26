---
layout: base
title: "Which BIPs are supported by bitcoinj"
---

#Which BIPs are supported by bitcoinj

##Introduction

_Bitcoin improvement proposals_ are the communities way of standardising new extensions and protocols that build on top of Bitcoin. Bitcoinj either implements or provides API's to help you implement many of these standards; below you can see which BIP's are supported:

<table>
<thead>
<tr class="header">
<th align="left">BIP number</th>
<th align="left">Name</th>
<th align="left">Relevant API</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td align="left">11</td>
<td align="left">m-of-n multisig transactions</td>
<td align="left"><a href="http://plan99.net/~mike/bitcoinj/current/com/google/bitcoin/script/ScriptBuilder.html">ScriptBuilder</a></td>
</tr>
<tr class="even">
<td align="left">14</td>
<td align="left">Protocol version and user agent</td>
<td align="left"><a href="http://plan99.net/~mike/bitcoinj/current/com/google/bitcoin/core/PeerGroup.html#setUserAgent(java.lang.String,%20java.lang.String)">PeerGroup.setUserAgent</a></td>
</tr>
<tr class="odd">
<td align="left">16</td>
<td align="left">Pay to script hash (P2SH)</td>
<td align="left"><a href="http://plan99.net/~mike/bitcoinj/current/com/google/bitcoin/core/Address.html">Address</a></td>
</tr>
<tr class="even">
<td align="left">21</td>
<td align="left">Bitcoin URI scheme</td>
<td align="left"><a href="http://plan99.net/~mike/bitcoinj/current/com/google/bitcoin/uri/BitcoinURI.html">BitcoinURI</a></td>
</tr>
<tr class="odd">
<td align="left">31</td>
<td align="left">Ping/pong messages</td>
<td align="left"><a href="http://plan99.net/~mike/bitcoinj/current/com/google/bitcoin/core/Peer.html#ping()">Peer.ping()</a></td>
</tr>
<tr class="even">
<td align="left">35</td>
<td align="left">mempool message</td>
<td align="left">used automatically</td>
</tr>
<tr class="odd">
<td align="left">37</td>
<td align="left">Bloom filtering</td>
<td align="left"><a href="http://plan99.net/~mike/bitcoinj/current/com/google/bitcoin/core/PeerFilterProvider.html">PeerFilterProvider (used automatically)</a></td>
</tr>
<tr class="even">
<td align="left">39</td>
<td align="left">Mnemonic codes for representing private keys</td>
<td align="left"><a href="http://plan99.net/~mike/bitcoinj/current/com/google/bitcoin/crypto/MnemonicCode.html">MnemonicCode</a></td>
</tr>
<tr class="odd">
<td align="left">70, 72</td>
<td align="left">Payment protocol</td>
<td align="left"><a href="http://plan99.net/~mike/bitcoinj/current/com/google/bitcoin/protocols/payments/PaymentSession.html">PaymentSession</a></td>
</tr>
<tr class="even">
<td align="left">38</td>
<td align="left">Encrypted private key serialization</td>
<td align="left"><a href="http://plan99.net/~mike/bitcoinj/current/com/google/bitcoin/crypto/BIP38PrivateKey.html">BIP38PrivateKey</a></td>
</tr>
</tbody>
</table>
