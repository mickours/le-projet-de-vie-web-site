{
  description = "Mon Projet de Vie - Manga-style educational platform";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, utils }:
    utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            python313
            uv
            sqlite
          ];

          shellHook = ''
            echo "Mon Projet de Vie - Dev Environment"
            echo "Python: $(python --version)"
            echo "uv: $(uv --version)"
          '';
        };
      }
    );
}
