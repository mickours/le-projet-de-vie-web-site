# Mon Projet de Vie - L'Aventure de l'Orientation

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

### Production
Pour un déploiement en production, il est recommandé d'utiliser `uvicorn` derrière un reverse proxy (Nginx/Apache).

1. **Variables d'environnement** : Changez la `SECRET_KEY` dans `backend/src/auth.py` (ou utilisez un fichier `.env`).
2. **Exécution** :
```bash
cd backend/src
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Dossiers importants
- `backend/uploads/` : Contient les fichiers joints aux activités. Assurez-vous que le processus a les droits d'écriture.
- `backend/src/monprojetdevie.db` : Fichier de base de données SQLite. À sauvegarder régulièrement.
