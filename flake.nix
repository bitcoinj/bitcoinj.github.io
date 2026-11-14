{
  description = "Development environment for bitcoinj.github.io Jekyll site";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/release-25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        # Ruby environment with Jekyll and bundler
        rubyEnv = pkgs.ruby_3_3.withPackages (ps: with ps; [
          jekyll
          kramdown-parser-gfm
        ]);
        
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            rubyEnv
            jdk25_headless
          ];

          shellHook = ''
            echo "=== bitcoinj.github.io development environment ==="
            echo ""
            echo "Available commands:"
            echo "  jekyll build                - Build the site to _site/"
            echo "  jekyll serve                - Serve the site locally at http://localhost:4000"
            echo "  jekyll serve --livereload   - Serve with auto-reload on changes"
            echo "  ./scripts/JekyllServer.java - Serve the static site with a Java script"
            echo ""
          '';
        };

        # Package that builds the site
        packages.default = pkgs.stdenv.mkDerivation {
          pname = "bitcoinj-site";
          version = "0.0.1";
          
          src = ./.;
          
          buildInputs = [ rubyEnv ];
          
          buildPhase = ''
            export HOME=$TMPDIR
            jekyll build
          '';
          
          installPhase = ''
            mkdir -p $out
            cp -r _site/* $out/
          '';
        };

        # App for easy site building
        apps.build = {
          type = "app";
          program = "${pkgs.writeShellScript "build-site" ''
            set -e
            export HOME=$TMPDIR
            ${rubyEnv}/bin/jekyll build
            echo "Site built to _site/"
          ''}";
        };

        apps.serve = {
          type = "app";
          program = "${pkgs.writeShellScript "serve-site" ''
            set -e
            export HOME=$TMPDIR
            ${rubyEnv}/bin/jekyll serve --livereload
          ''}";
        };

        apps.tarball = {
          type = "app";
          program = "${pkgs.writeShellScript "create-tarball" ''
            set -e
            export HOME=$TMPDIR
            echo "Building site..."
            ${rubyEnv}/bin/jekyll build
            echo "Creating tarball..."
            ${pkgs.gnutar}/bin/tar -czf bitcoinj-site.tar.gz -C _site .
            echo "Tarball created: bitcoinj-site.tar.gz"
          ''}";
        };
      }
    );
}
