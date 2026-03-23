# Déploiement sur NixOS

Ce projet fournit un module NixOS pour faciliter le déploiement.

## Utilisation via Flakes

Ajoutez ce dépôt à vos inputs :

```nix
{
  inputs.mon-projet-de-vie.url = "github:votre-username/votre-repo";
}
```

Puis importez le module dans votre configuration :

```nix
{ inputs, pkgs, ... }: {
  imports = [ inputs.mon-projet-de-vie.nixosModules.default ];

  services.mon-projet-de-vie = {
    enable = true;
    hostName = "mon-aventure.fr"; # Optionnel si Nginx est activé
    
    # Configuration de la base de données
    databaseUrl = "sqlite:////var/lib/mon-projet-de-vie/monprojetdevie.db";
    
    # Fichier contenant la SECRET_KEY (pour ne pas l'exposer dans le store)
    # Format du fichier : SECRET_KEY=votre_cle_tres_secrete
    secretKeyFile = "/run/keys/mon-projet-de-vie.env";
    
    # Configuration Nginx automatique
    nginx = {
      enable = true;
      hostName = "aventure.mon-domaine.fr";
    };
  };
}
```

## Options disponibles

| Option | Description | Défaut |
| :--- | :--- | :--- |
| `enable` | Activer le service | `false` |
| `port` | Port d'écoute du backend | `8000` |
| `databaseUrl` | URL de connexion SQLAlchemy | `sqlite:///...` |
| `secretKeyFile` | Chemin vers un fichier d'environnement pour la SECRET_KEY | `null` |
| `dataDir` | Répertoire pour les données persistantes (BD, uploads) | `/var/lib/mon-projet-de-vie` |
| `nginx.enable` | Activer un reverse proxy Nginx automatique | `false` |
| `nginx.hostName` | Nom de domaine pour le vhost Nginx | `"localhost"` |

## Gestion des données

Le module crée automatiquement un utilisateur `mon-projet-de-vie` et un répertoire dans `/var/lib/mon-projet-de-vie`.
Assurez-vous de sauvegarder ce répertoire régulièrement car il contient :
1. La base de données SQLite.
2. Les documents téléchargés (uploads).
