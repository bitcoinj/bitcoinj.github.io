---
layout: base
title: "How to depend on bitcoinj with Maven using projects"
---

#How to depend on bitcoinj with Maven using projects

[Maven](http://maven.apache.org/) is a plugin based build system from Apache. It supports various other features, like automatically creating a website for your project and resolving dependencies.

If your project uses Maven for its build, you can depend on bitcoinj by adding the following snippet to your pom.xml file in the:

{% highlight xml %}
  <dependencies>
    <dependency>
      <groupId>org.bitcoinj</groupId>
      <artifactId>bitcoinj-core</artifactId>
      <version>0.13.6</version>
      <scope>compile</scope>
    </dependency>
  </dependencies>
{% endhighlight %}

To get the source you can also use git and check out your own copy:

~~~
git clone https://github.com/bitcoinj/bitcoinj.git
cd bitcoinj
git fetch --all
git checkout v0.13.6
mvn install
~~~

This will give you v0.13.6. If PGP is your thing, you can run `git tag -v v0.13.6` to check Andreas Schildbach's signature of the release.

Note: If you are using OpenJDK, you may have to install the supporting OpenJFX package for your operating system distribution. For example, if you are running Ubuntu 15.10, and using `openjdk-8-jdk`, you will need to also install the `openjfx` package. This can be accomplished with a command such as `sudo apt-get install openjfx`.

#Maven security

Maven Central is a very insecure piece of infrastructure. If you're just messing around then this is perhaps not a big deal, but prototypes have a way of turning into real apps and then build security becomes more important. Maven can be made more secure by following these tips.

Firstly, *use Maven 3.2.3 or later*. Starting in September 2014 Maven Central supports SSL, but prior versions did not. That means any dependency download could be trivially backdoored by anyone on your local network, and there are proof-of-concept exploits that actually make this easy. Thus it is ESSENTIAL that you use a Maven that is using SSL by default. This means: download Maven from the Apache website.

Secondly, *do not use Maven from your Linux distribution*. Linux distributors like to tamper with Maven in various ways which can potentially cause problems, so grab the clean upstream version instead of using apt-get.

Thirdly, *use the dependency verifier*. Maven Central is convenient but it does not implement anything more robust than password authentication. This means a bogus JAR being uploaded if a developer account is hacked is quite possible. bitcoinj has a hard-coded list of dependency hashes in its POM, and you can use the same Maven plugin to fix the hashes of your own dependencies (including on bitcoinj):

https://github.com/gary-rowe/BitcoinjEnforcerRules

To check you have the right version of the enforcer plugin, run:

~~~
$ shasum ~/.m2/repository/uk/co/froot/maven/enforcer/digest-enforcer-rules/0.0.1/digest-enforcer-rules-0.0.1.jar
16a9e04f3fe4bb143c42782d07d5faf65b32106f
~~~

and verify the output matches.
