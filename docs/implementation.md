# Proposition d'Implémentation Technique

Ce document détaille l'architecture et les choix techniques pour le site "Mon Projet de Vie".

## 1. Stack Technique Réalisée

Suite aux contraintes environnementales (absence de Node.js/npm), la stack a été adaptée :

- **Backend** : Python 3.13 avec **FastAPI** pour sa rapidité et son support natif des types.
- **Frontend** : HTML5, **Vanilla CSS** (pour le style Manga), et JavaScript (Vanilla ou petite bibliothèque si nécessaire).
- **Base de données** : **SQLite** pour la simplicité de mise en œuvre (fichier local).
- **Serveur** : Uvicorn.

## 2. Architecture des Données (Modèle)

### L'Aventure de l'Orientation
- **Activity** : `id`, `title`, `description`, `content_url`, `type_id`, `theme_id`.
- **Level** : `id`, `label` (6ème, 5ème, ...).
- **Role** : `id`, `label` (élève, parent, ...).
- **Theme** : `id`, `label` (Métiers, Formations, ...).
- **Type** : `id`, `label` (Encadrée, Autonomie, Guide).
- **Comment** : `id`, `activity_id`, `user_id`, `content`, `is_moderated`, `created_at`.

### Dossier Personnel
- **User** : `id`, `username`, `password_hash`, `role_id`, `level_id`.
- **UserActivity** : `id`, `user_id`, `activity_id`, `is_completed`, `notes`.

## 3. Fonctionnalités Clés

### Navigation & Filtrage
Le système de navigation (Accueil > Rôles > Niveaux > Activités) sera implémenté via des routes dynamiques et des filtres de base de données.

### Interface Manga
L'aspect "Manga" sera renforcé par :
- Des polices de caractères typées (ex: Comic Neue ou polices spécifiques manga).
- Des mises en page utilisant des grilles rappelant les planches de BD (CSS Grid).
- Des illustrations et icônes thématiques.

### Dossier Personnel & Impression
- Le dossier sera généré dynamiquement en fonction du niveau de l'élève.
- Une feuille de style CSS `@media print` sera mise en place pour garantir un rendu propre lors de l'impression (sans menus, avec optimisation de l'espace).

### Administration
Une interface simple permettant de :
- Créer/Éditer/Supprimer des activités via un formulaire multipart (pour l'upload de fichiers).
- Modérer les commentaires (liste des commentaires en attente avec actions "Approuver" ou "Supprimer").

### État de l'Implémentation

### Initialisation
- [x] Détection des outils système (Python 3.13 disponible).
- [x] Adaptation de la stack technique (FastAPI + SQLite).
- [x] Création de l'environnement virtuel Python (via uv).
- [x] Initialisation du serveur backend de base (FastAPI + SQLAlchemy models).
- [x] Mise en place de la structure frontend (HTML/CSS/JS de base).

