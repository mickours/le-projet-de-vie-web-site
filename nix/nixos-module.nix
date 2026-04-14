{
  config,
  lib,
  pkgs,
  ...
}:

with lib;

let
  cfg = config.services.le-projet-de-vie;
  # Use the package defined in the flake or call it locally
  # For the module to be self-contained in the repo, we can use callPackage
  backendPackage = pkgs.callPackage ./package.nix { };
in
{
  options.services.le-projet-de-vie = {
    enable = mkEnableOption "L'aventure de l'Orientation service";

    port = mkOption {
      type = types.port;
      default = 8000;
      description = "Port to listen on for the backend.";
    };

    host = mkOption {
      type = types.str;
      default = "127.0.0.1";
      description = "Host to bind the service to.";
    };

    databaseUrl = mkOption {
      type = types.str;
      default = "sqlite:////var/lib/le-projet-de-vie/prod.db";
      description = "Database connection URL (use absolute paths for SQLite).";
    };

    secretKeyFile = mkOption {
      type = types.nullOr types.path;
      default = null;
      description = "Path to a file containing the SECRET_KEY.";
    };

    allowedOrigins = mkOption {
      type = types.listOf types.str;
      default = [ "*" ];
      description = "List of allowed CORS origins.";
    };

    dataDir = mkOption {
      type = types.path;
      default = "/var/lib/le-projet-de-vie";
      description = "Directory for database and uploads.";
    };

    package = mkOption {
      type = types.package;
      default = backendPackage;
      description = "The package to use for the application.";
    };

    nginx = {
      enable = mkEnableOption "Nginx reverse proxy for the service";
      hostName = mkOption {
        type = types.str;
        default = "localhost";
        description = "Hostname for Nginx virtual host.";
      };
    };
  };

  config = mkIf cfg.enable {
    systemd.services.le-projet-de-vie =
      let
        pythonEnv = pkgs.python3.withPackages (p: [
          p.django
          p.gunicorn
          p.whitenoise
        ]);
      in
      {
        description = "L'aventure de l'Orientation Backend Service";
        after = [ "network.target" ];
        wantedBy = [ "multi-user.target" ];

        environment = {
          DATABASE_PATH = "${cfg.dataDir}/db.sqlite3";
          ALLOWED_HOSTS = builtins.concatStringsSep "," cfg.allowedOrigins;
          CSRF_TRUSTED_ORIGINS = builtins.concatStringsSep "," (
            builtins.map (h: "https://" + h) (builtins.filter (h: h != "*") cfg.allowedOrigins)
          );
          STATIC_ROOT = "${cfg.dataDir}/staticfiles";
          DEBUG = "False";
        };

        serviceConfig = {
          # Running gunicorn from the backend source directory
          ExecStart = "${pythonEnv}/bin/gunicorn --workers 4 --bind ${cfg.host}:${toString cfg.port} core.wsgi:application";
          WorkingDirectory = "${cfg.package}/share/le-projet-de-vie";

          StateDirectory = "le-projet-de-vie";
          # Ensure the directories exist, run migrations, collectstatic and seed the database
          ExecStartPre = [
            "+${pkgs.coreutils}/bin/mkdir -p ${cfg.dataDir}/staticfiles"
            "+${pkgs.coreutils}/bin/chown -R le-projet-de-vie:le-projet-de-vie ${cfg.dataDir}"
            "${pythonEnv}/bin/python manage.py migrate --noinput"
            "${pythonEnv}/bin/python manage.py collectstatic --noinput"
            "${pythonEnv}/bin/python manage.py seed"
          ];

          EnvironmentFile = lib.filter (x: x != null) [
            cfg.secretKeyFile
          ];

          User = "le-projet-de-vie";
          Group = "le-projet-de-vie";
          Restart = "always";

          # Security hardening
          ProtectSystem = "full";
          NoNewPrivileges = true;
          PrivateTmp = true;
        };
      };

    users.users.le-projet-de-vie = {
      isSystemUser = true;
      group = "le-projet-de-vie";
      home = cfg.dataDir;
      createHome = true;
      description = "Service user for Le Projet de Vie web site";
    };

    users.groups.le-projet-de-vie = { };

    # Optional Nginx configuration
    services.nginx = mkIf cfg.nginx.enable {
      enable = true;
      virtualHosts."${cfg.nginx.hostName}" = {
        forceSSL = true;
        enableACME = true;
        locations."/" = {
          proxyPass = "http://${cfg.host}:${toString cfg.port}";
          proxyWebsockets = true;
        };
      };
    };
  };
}
