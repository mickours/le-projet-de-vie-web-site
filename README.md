# Le projet de Vie Libère

Ce site contient une application pricipale:

# L'aventure de l'Orientation

Plateforme éducative d'orientation avec un style Manga, permettant aux élèves de découvrir des métiers et formations à travers des "quêtes" et de construire leur dossier personnel.

## 🚀 Fonctionnalités Clés

- **Navigation Manga** : Interface inspirée des codes de la BD/Manga (Grilles CSS, typographies spécifiques).
- **Quêtes d'Orientation** : Activités filtrables par rôle (élève, parent, pro) et par niveau (6ème à Lycée).
- **Dossier Personnel** : Suivi de progression, prise de notes et génération de dossier imprimable.
- **Administration** : Gestion complète des activités (avec upload de fichiers) et modération des commentaires.

## 🛠️ Prérequis

- [Nix](https://nixos.org/download.html) (recommandé avec support flakes)
- **OU** Python 3.13 + [uv](https://github.com/astral-sh/uv)

## 📦 Installation et Lancement

### 1. Initialisation de l'environnement

**Avec Nix :**
```bash
nix develop
```

**Sans Nix :**
```bash
cd backend
uv sync
```

### 2. Initialisation de la Base de Données (Seeding)
Il est indispensable de peupler la base pour créer les rôles, niveaux et le compte administrateur par défaut.

```bash
cd backend/src
uv run python seed.py
```
*Identifiants admin par défaut : `admin` / `admin123`*

### 3. Lancement du serveur de développement

```bash
cd backend/src
uv run python main.py
```
Le site sera accessible sur : **[http://localhost:8000](http://localhost:8000)**

---

## 🧪 Qualité et Tests

Des scripts à la racine permettent de maintenir la qualité du code :

- **Linting et Formatage** (Ruff) : `./lint.sh`
- **Tests unitaires** (Pytest) : `./test.sh`

---

## 🌐 Déploiement

### Configuration
L'application se configure via des variables d'environnement (ou un fichier `.env`). 
1. Copiez le fichier d'exemple : `cp .env.example .env`
2. Ajustez la `SECRET_KEY` et la `DATABASE_URL` dans le fichier `.env`.

### Production
Pour un guide détaillé sur le déploiement (PostgreSQL, Gunicorn, Nginx), consultez le [**Guide de Mise en Production**](docs/production.md).

Exécution rapide en production :
```bash
cd backend
uv run gunicorn src.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Dossiers importants
- `backend/uploads/` : Contient les fichiers joints aux activités. Assurez-vous que le processus a les droits d'écriture.
- `backend/src/leprojetdevie.db` : Fichier de base de données SQLite. À sauvegarder régulièrement.
