{
  description = "L'aventure de l'Orientation - Manga-style educational platform";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, utils }:
    let
      out = utils.lib.eachDefaultSystem (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          packages.default = pkgs.callPackage ./nix/package.nix { };

          devShells.default = pkgs.mkShell {
            buildInputs = with pkgs; [
              python313
              uv
              sqlite
            ];

            shellHook = ''
              echo "L'aventure de l'Orientation - Dev Environment"
              echo "Python: $(python --version)"
              echo "uv: $(uv --version)"
            '';
          };
        }
      );
    in
    out // {
      nixosModules.default = import ./nix/nixos-module.nix;
    };
}
