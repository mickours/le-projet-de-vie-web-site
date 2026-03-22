# Guide de Mise en Production

Ce document détaille les étapes et les bonnes pratiques pour déployer "Mon Projet de Vie" dans un environnement de production.

## 1. Architecture recommandée

- **Serveur Web / Reverse Proxy** : Nginx ou Caddy (pour gérer le HTTPS/SSL).
- **Serveur d'Application** : Gunicorn avec des workers Uvicorn.
- **Base de Données** : PostgreSQL (recommandé pour la production) ou SQLite (pour de faibles charges).
- **Gestionnaire de processus** : Systemd ou Docker.

## 2. Configuration via Variables d'Environnement

L'application utilise `pydantic-settings` pour lire sa configuration. Vous pouvez définir ces variables directement dans votre environnement ou via un fichier `.env` à la racine du projet.

| Variable | Description | Par défaut |
| :--- | :--- | :--- |
| `DATABASE_URL` | URL de connexion à la base | `sqlite:///...` |
| `SECRET_KEY` | Clé secrète pour les jetons JWT | (clé par défaut) |
| `ALLOWED_ORIGINS` | Liste JSON des origines CORS | `["*"]` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Durée de validité des jetons | `60` |

### Exemple de fichier `.env`
```env
DATABASE_URL=postgresql://user:pass@localhost/monprojetdevie
SECRET_KEY=votre_cle_secrete_tres_longue_et_aleatoire
ALLOWED_ORIGINS=["https://votre-domaine.fr"]
```

## 3. Déploiement avec Gunicorn

En production, n'utilisez pas `uvicorn` directement. Utilisez `gunicorn` pour gérer plusieurs processus.

```bash
cd backend
uv run gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 4. Sécurisation

### HTTPS
Il est impératif d'utiliser HTTPS. Configurez votre reverse proxy (Nginx) pour gérer les certificats (via Let's Encrypt / Certbot).

### Sécurité des fichiers
- Assurez-vous que le dossier `backend/uploads/` a les bonnes permissions (lecture/écriture pour l'utilisateur du serveur).
- Désactivez l'accès direct aux fichiers `.db` via le serveur web.

## 5. Sauvegardes

- **Base de données** : Si vous utilisez SQLite, sauvegardez régulièrement le fichier `.db`. Pour PostgreSQL, utilisez `pg_dump`.
- **Uploads** : Sauvegardez régulièrement le contenu du dossier `backend/uploads/`.

## 6. Monitoring et Logs

FastAPI utilise les logs standards de Python. En production, redirigez ces logs vers un fichier ou un service de centralisation :

```bash
uv run gunicorn main:app ... >> /var/log/monprojetdevie.log 2>&1
```
