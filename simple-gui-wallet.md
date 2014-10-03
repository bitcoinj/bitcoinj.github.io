---
layout: base
title: "Building a simple GUI wallet tutorial"
---

<div markdown="1" id="toc" class="toc"><div markdown="1">

* Table of contents
{:toc}

</div></div>

<div markdown="1" class="toccontent">

# Tutorial: Building a simple GUI wallet

bitcoinj ships with a basic GUI wallet app as part of its source code. It's intended to be copied and used as a basis for any application that wishes to send and receive money. For example if you wanted to make a card game that let you gamble with real bitcoins, this would be a good place to start. 

Although such apps don't have to be a generic consumer wallet, in this tutorial we'll customise the template a little bit by adding a transactions list. A screencast of this tutorial is below: as it involves GUI design work the video may be easier to follow.

<iframe width="680" height="422" src="//www.youtube-nocookie.com/embed/9AK11JsZWVo?rel=0" frameborder="0" allowfullscreen></iframe>

## Step 1. Copy the code, rename the package and explore.

The app lives in the wallettemplate directory of the bitcoinj source code, so copy that directory into a fresh one that isn't inside the bitcoinj folder, and open it up in your IDE of choice. Rename the base package and modify the APP_NAME variable at the top of the `Main` class.

The `Main` class is the entry point of the program. It handles basic setup like initialising JavaFX, bitcoinj, installing a crash handler, and so on. Early on the bitcoinj `Threading` class is configured to run event listeners on the JavaFX UI thread which simplifies things quite considerably (unfortunately there are a handful of exceptions where callbacks don't run on your selected thread, but mostly they respect this setting).

Once bitcoinj is initialised, the `MainController` class is informed that it's ready and the UI is shown. `MainController` is the controller class for the main window and its member variables are largely auto-wired by JavaFX. The `BitcoinUIModel` class exports data from bitcoinj in the form of up to date observable values which can then be bound directly to UI controls.

Tor is also configured and set up here, but it's only used in testnet mode.

## Step 2. Add a transactions list to the UI.

This part is easier explained by the video. Open Scene Builder 2.0 (you can download this from the Oracle website) and replace the "Your content goes here" label with a ListView which has an id of `transactionsList`. In the code, make sure there's a `ListView<Transaction>` member so the widget can be injected. Next, in `BitcoinUIModel` create an `ObservableList` and in the update method, call setAll with the results of `wallet.getTransactionsByTime()`. Finally, use `Bindings.bindContent` to bind this observable list to the list view items collection.

Try running the app and sending some coins to it from the testnet faucet. You should see a big pile of debug data about the contents of the transaction appear in the UI. The problem is, it's using the toString method of `Transaction` to decide what to display, and that's really more appropriate for developers than users.

## Step 3. Customise the presentation of the transactions.

Create a cell factory for the list view that returns `TextFieldListCell` objects. In the `StringConverter` we'll use code like this:

{% highlight java %}
@Override
public String toString(Transaction tx) {
    Coin value = tx.getValue(Main.bitcoin.wallet());
    if (value.isPositive()) {
        return "Incoming payment of " + MonetaryFormat.BTC.format(value);
    } else if (value.isNegative()) {
        Address address = tx.getOutput(0).getAddressFromP2PKHScript(Main.params);
        return "Outbound payment to " + address;
    }
    return "Payment with id " + tx.getHash();
}
{% endhighlight %}

Here we're getting the value of the transaction, defined as the difference it made to our balance. If the difference was positive then it means we received money, so we format the list item showing the amount we received. It may be tempting to try and show a "from address" here, but don't - such information is meaningless to the user and isn't well defined by the protocol.

If the value is negative, it means we sent money. Here showing the address the user sent the money to does have meaning, so let's show it. A real wallet app of course should let the user record their own notes on a transaction, but bitcoinj offers no real support for this today.

If you run the app and send money back to the faucet, you should now see the transactions be shown appropriately in the list.

## Step 4. Bundle the app into a Mac DMG, Windows installer or Linux DEB/RPM

The `javapackager` tool that comes with Java 8 can be used to make native installers that include a JRE, so your users don't have to install Java or even know it's involved. This is good for distribution. Here, we'll make a Mac DMG.

The POM file contains configuration XML for the Maven Shade plugin, which instructs the build tool to create a statically linked JAR that contains all the dependencies of the app outside of the Java platform itself. Running `mvn package` creates such a JAR in the target directory.

We can now run the packager tool as follows:

{% highlight sh %}
jh=$(/usr/libexec/java_home -v 1.8)
$jh/bin/javapackager -deploy -native dmg -srcfiles target/simplewallet.jar -outdir packages -name SimpleWallet -title SimpleWallet -Bmac.CFBundleName=SimpleWallet -Bruntime="$jh/../../" -appclass simplewallet.Main -outfile SimpleWallet
{% endhighlight %}

... to generate a self contained code signed Mac package. A similar procedure can be followed on other platforms to build their own native packages too.

</div>