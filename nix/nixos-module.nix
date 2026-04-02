{
  config,
  lib,
  pkgs,
  ...
}:

with lib;

let
  cfg = config.services.mon-projet-de-vie;
  # Use the package defined in the flake or call it locally
  # For the module to be self-contained in the repo, we can use callPackage
  backendPackage = pkgs.callPackage ./package.nix { };
in
{
  options.services.mon-projet-de-vie = {
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
      default = "sqlite:////var/lib/mon-projet-de-vie/monprojetdevie.db";
      description = "Database connection URL (use absolute paths for SQLite).";
    };

    secretKeyFile = mkOption {
      type = types.nullOr types.path;
      default = null;
      description = "Path to a file containing the SECRET_KEY.";
    };

    tinymceApiKeyFile = mkOption {
      type = types.nullOr types.path;
      default = null;
      description = "Path to a file containing the TINYMCE_API_KEY.";
    };

    allowedOrigins = mkOption {
      type = types.listOf types.str;
      default = [ "*" ];
      description = "List of allowed CORS origins.";
    };

    dataDir = mkOption {
      type = types.path;
      default = "/var/lib/mon-projet-de-vie";
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
    systemd.services.mon-projet-de-vie = let
      pythonEnv = pkgs.python3.withPackages (p: [
        p.uvicorn
        p.gunicorn
        p.fastapi
        p.sqlalchemy
        p.pydantic
        p.pydantic-settings
        p.python-jose
        p.passlib
        p.bcrypt
        p.python-multipart
        p.alembic
        p.httpx
      ]);
    in {
      description = "L'aventure de l'Orientation Backend Service";
      after = [ "network.target" ];
      wantedBy = [ "multi-user.target" ];

      environment = {
        DATABASE_URL = cfg.databaseUrl;
        ALLOWED_ORIGINS = builtins.toJSON cfg.allowedOrigins;
        FRONTEND_PATH = "${cfg.package}/share/mon-projet-de-vie/frontend";
        UPLOADS_PATH = "${cfg.dataDir}/uploads";
      };

      serviceConfig = {
        # We need to make sure the app can find its modules
        # Running gunicorn from the backend source directory
        ExecStart = "${pythonEnv}/bin/python -m gunicorn --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind ${cfg.host}:${toString cfg.port} main:app";
        WorkingDirectory = "${cfg.package}/share/mon-projet-de-vie/backend-src";

        StateDirectory = "mon-projet-de-vie";
        # Ensure the uploads directory exists within dataDir and seed the database
        ExecStartPre = [
          "+${pkgs.coreutils}/bin/mkdir -p ${cfg.dataDir}/uploads"
          "+${pkgs.coreutils}/bin/chown -R mon-projet-de-vie:mon-projet-de-vie ${cfg.dataDir}"
          "${pythonEnv}/bin/python seed.py"
        ];

        EnvironmentFile = let
          envFiles = [
            (mkIf (cfg.secretKeyFile != null) cfg.secretKeyFile)
            (mkIf (cfg.tinymceApiKeyFile != null) cfg.tinymceApiKeyFile)
          ];
        in lib.filter (x: x != null) envFiles;

        User = "mon-projet-de-vie";
        Group = "mon-projet-de-vie";
        Restart = "always";

        # Security hardening
        ProtectSystem = "full";
        NoNewPrivileges = true;
        PrivateTmp = true;
      };
    };

    users.users.mon-projet-de-vie = {
      isSystemUser = true;
      group = "mon-projet-de-vie";
      home = cfg.dataDir;
      createHome = true;
      description = "Service user for L'aventure de l'Orientation";
    };

    users.groups.mon-projet-de-vie = { };

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
