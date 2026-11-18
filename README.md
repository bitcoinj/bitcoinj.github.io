bitcoinj.github.io
==================

This is the source-code repository for the **bitcoinj** website, published at [bitcoinj.org](https://bitcoinj.org).

## How it works

This site is written in [GitHub-flavored Markdown](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/about-writing-and-formatting-on-github), built using the [Jekyll static site generator](https://jekyllrb.com) and published via [GitHub Pages](https://pages.github.com).

## Building locally in a Nix Shell

The Nix development shell will install Jekyll for building and serving the site and Java 25 (if you want a simple Java-based tool to serve/test the static site.)

1. Run `nix develop`
2. Run `jekyll build`

This will build the site into the `_site` directory.

## Serving the site locally

To serve the site with Jekyll and dynamic reloading:

* `jekyll serve --livereload --incremental`

To run a simple, local Java-based webserver to view the site use:

* `./scripts/JekyllServer.java`

## Building locally without Nix

If you install Jekyll 3.10.0 and Ruby 3.3, you should be able to use the same commands as shown above, but this is untested/unsupported. You should also be able to serve the generated static site with the Java 25 script.

## Building as a Nix Package

* `nix build .#`

This should build the package in `result`.

## Contributing

To report a documentation issue or make a suggestion for improvement use [GitHub Issues](). You can also submit a [pull-request](https://github.com/bitcoinj/bitcoinj.github.io/pulls) for the website.


See also [CONTRIBUTING.adoc](https://github.com/bitcoinj/bitcoinj/blob/master/.github/CONTRIBUTING.adoc) on the main **bitcoinj** source repo.