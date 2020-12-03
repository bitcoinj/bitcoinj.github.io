---
layout: base
title: "How to depend on bitcoinj with Gradle using projects"
---

# How to depend on bitcoinj with Gradle using projects

[Gradle](https://gradle.org/) is a plugin based build system, originally from Hans Dockter. Gradle is mostly replacing the aging Maven and what was left of Ant.

If your project uses Gradle for its build, you can depend on bitcoinj by adding the following snippet to your build.gradle file:

{% highlight xml %}
dependencies {
    compile 'org.bitcoinj:bitcoinj-core:0.15.9'
}
{% endhighlight %}
