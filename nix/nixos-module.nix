{
  config,
  lib,
  pkgs,
  ...
}:

with lib;

let
  cfg = config.services.aventure-orientation;
  # Use the package defined in the flake or call it locally
  # For the module to be self-contained in the repo, we can use callPackage
  backendPackage = pkgs.callPackage ./package.nix { };
in
{
  options.services.aventure-orientation = {
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
      default = "sqlite:////var/lib/aventure-orientation/monprojetdevie.db";
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
      default = "/var/lib/aventure-orientation";
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
    systemd.services.aventure-orientation = {
      description = "L'aventure de l'Orientation Backend Service";
      after = [ "network.target" ];
      wantedBy = [ "multi-user.target" ];

      environment = {
        DATABASE_URL = cfg.databaseUrl;
        ALLOWED_ORIGINS = builtins.toJSON cfg.allowedOrigins;
        FRONTEND_PATH = "${cfg.package}/share/aventure-orientation/frontend";
        UPLOADS_PATH = "${cfg.dataDir}/uploads";
      };

      serviceConfig = {
        # We need to make sure the app can find its modules
        # Running gunicorn from the backend source directory
        ExecStart = "${
          pkgs.python3.withPackages (p: [
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
          ])
        }/bin/python -m gunicorn --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind ${cfg.host}:${toString cfg.port} main:app";
        WorkingDirectory = "${cfg.package}/share/aventure-orientation/backend-src";

        StateDirectory = "aventure-orientation";
        # Ensure the uploads directory exists within dataDir
        ExecStartPre = "${pkgs.coreutils}/bin/mkdir -p ${cfg.dataDir}/uploads";

        EnvironmentFile = mkIf (cfg.secretKeyFile != null) cfg.secretKeyFile;
        User = "aventure-orientation";
        Group = "aventure-orientation";
        Restart = "always";

        # Security hardening
        ProtectSystem = "full";
        NoNewPrivileges = true;
        PrivateTmp = true;
      };
    };

    users.users.aventure-orientation = {
      isSystemUser = true;
      group = "aventure-orientation";
      home = cfg.dataDir;
      createHome = true;
      description = "Service user for L'aventure de l'Orientation";
    };

    users.groups.aventure-orientation = { };

    # Optional Nginx configuration
    services.nginx = mkIf cfg.nginx.enable {
      enable = true;
      virtualHosts."${cfg.nginx.hostName}" = {
        locations."/" = {
          proxyPass = "http://${cfg.host}:${toString cfg.port}";
          proxyWebsockets = true;
        };
      };
    };
  };
}
