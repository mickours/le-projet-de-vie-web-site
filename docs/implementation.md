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

## 4. Refonte Architecturale : Modernisation et Unification (Frontend/Backend)

### Constat Actuel
Actuellement, le frontend est construit de manière "Vanilla" (HTML, CSS monolithique, et un unique fichier `main.js` gérant tout l'état, la logique et le routage). Bien que fonctionnelle pour un prototype, cette approche devient difficile à maintenir ("bloated"), complique la réutilisation du code, et manque de typage fort. L'interface d'administration manque de standardisation et doit être développée de zéro.

### Technologie Recommandée : Django (+ HTMX)
Pour répondre au besoin d'utiliser un standard reconnu de l'industrie permettant de **fusionner le frontend et le backend**, tout en restant dans l'écosystème Python existant, **Django** est la solution idéale, potentiellement couplé avec **HTMX** pour l'interactivité.

**Pourquoi Django ?**
- **Language Consistency (Python)** : Permet de conserver l'expertise Python et la logique métier, tout en migrant depuis FastAPI de manière fluide.
- **Batteries Included** : Fournit un ORM puissant, un système de templating robuste, l'authentification et les sessions de manière native (contrairement à FastAPI où ces briques sont assembles à la main).
- **Administration Native** : Django offre un panneau d'administration "out-of-the-box" très complet, répondant directement au besoin de modération des commentaires et d'édition des activités sans code supplémentaire côté frontend.
- **Simplification du Frontend** : Le rendu des pages côté serveur (SSR) permet de supprimer presque entièrement la complexité du JavaScript (le fichier `main.js` monolithique) et de conserver un frontend en HTML pur, avec des ajouts d'interactivité via HTMX pour la dynamique de type SPA.
- **Support de SQLite** : Continuité avec le choix de base de données actuel (fichier local SQLite).

### Plan de Conversion (Étape par Étape)

La conversion doit se faire de manière itérative.

#### Phase 1 : Scaffolding (Initialisation Django)
1. Ajouter Django, `django-stubs` (pour le typage MyPy), et les outils de test (`pytest-django`) via l'outil `uv`.
2. Initialiser le projet Django (ex: `django-admin startproject core`).
3. Créer une application Django dédiée (ex: `python manage.py startapp adventure`).

#### Phase 2 : Migration des Modèles de Données
1. Convertir les modèles SQLAlchemy actuels (Activity, Level, Role, Theme, Type, Comment, UserActivity) en Modèles Django (`django.db.models`).
2. Configurer le modèle d'utilisateur personnalisé (si nécessaire) pour étendre `AbstractUser`.
3. Créer et appliquer les migrations (`makemigrations`, `migrate`).

#### Phase 3 : Migration de l'Administration
1. Enregistrer les modèles Django dans `admin.py`.
2. Configurer les options d'affichage et de filtrage pour le panneau d'administration (permettant la modération aisée des activités et commentaires).

#### Phase 4 : Migration de l'Interface Utilisateur (Vues et Templates)
1. Migrer les fichiers statiques (CSS, images) dans les dossiers de `static/` de Django.
2. Découper le `index.html` et `adventure.html` en un template de base (`base.html`) et des sous-templates (ex: `dashboard.html`, `activities.html`, `dossier.html`).
3. Remplacer la logique de rendu JavaScript par des tags de templating Django (`{% for %}`, `{% if %}`).
4. *Optionnel* : Intégrer HTMX pour permettre les filtrages et changements de vue (navigation entre Rôles, Niveaux et Activités) sans rechargement complet de la page.

#### Phase 5 : Remplacement de l'API par des Vues Django
1. Convertir les routes FastAPI (ex: `/activities`, `/dossier`) en vues classiques Django (Class-Based Views ou Function-Based Views) renvoyant des templates HTML rendus, plutôt que du JSON.
2. Migrer la logique d'authentification JWT vers les sessions natives de Django pour la connexion des utilisateurs.

#### Phase 6 : Nettoyage, Typage et Tests
1. Supprimer le code FastAPI résiduel, l'ancien frontend monolithique, et les anciennes dépendances.
2. Assurer la couverture des vues avec `pytest-django`.
3. Renforcer la qualité du code via le typage avec MyPy (`django-stubs`) et `ruff`.

## 5. Remplacement de l'Éditeur de Texte Riche (TinyMCE)

### Constat Actuel
L'interface d'administration personnalisée (`admin.html`) utilise actuellement **TinyMCE** pour la saisie des descriptions des quêtes (Rich Text). Bien que très performant, TinyMCE nécessite désormais une clé d'API cloud pour fonctionner sans afficher de popups d'avertissement gênants. De plus, sa version open-source devient de plus en plus difficile à configurer simplement via CDN sans compte développeur.

### Technologie Recommandée : Quill.js
Pour remplacer TinyMCE par une alternative véritablement Open Source, gratuite et ne nécessitant **aucune clé d'API**, nous recommandons **Quill.js** (License MIT). 

**Pourquoi Quill.js ?**
- **Out of the box** : Fonctionne immédiatement via CDN sans aucune inscription ni clé d'API.
- **Copy/Paste Word** : Quill.js gère nativement le copier-coller depuis MS Word. Son module `clipboard` nettoie les balises HTML invalides générées par Word tout en conservant le formatage essentiel (gras, italique, titres, listes à puces/numérotées, liens).
- **Léger et Moderne** : Très facile à intégrer dans notre architecture Django sans dépendances complexes.
- **Thème "Snow"** : Fournit une barre d'outils propre et claire par défaut, adaptée à notre charte graphique.

### Plan de Migration (Étape par Étape)

#### Étape 1 : Retrait de TinyMCE
1. Dans le fichier `backend/adventure/templates/adventure/admin.html`, supprimer le script CDN de TinyMCE (`https://cdn.tiny.cloud/...`).
2. Supprimer le bloc d'initialisation JavaScript de TinyMCE (`tinymce.init({...})`).
3. Retirer le `<textarea id="tinymce-editor"></textarea>` qui servait de conteneur d'initialisation.

#### Étape 2 : Intégration de Quill.js
1. Ajouter les CDN CSS et JS de Quill.js dans le bloc `{% block extra_js %}` de la page admin :
   - CSS : `https://cdn.quilljs.com/1.3.7/quill.snow.css`
   - JS : `https://cdn.quilljs.com/1.3.7/quill.min.js`
2. Créer le nouveau conteneur pour l'éditeur : `<div id="quill-editor" style="height: 350px;"></div>`.
3. Conserver l'input caché (`<input type="hidden" id="act-desc" name="description">`) qui servira à relayer les données texte riche vers le backend Django lors de la soumission du formulaire.

#### Étape 3 : Initialisation et Configuration
1. Dans la balise `<script>` de la page admin, initialiser Quill avec les options nécessaires pour le formatage des quêtes (notamment les entêtes et listes) :
   ```javascript
   var quill = new Quill('#quill-editor', {
       theme: 'snow',
       modules: {
           toolbar: [
               [{ 'header': [2, 3, 4, false] }], // Pas de H1 dans le contenu
               ['bold', 'italic', 'underline'],
               [{ 'list': 'ordered'}, { 'list': 'bullet' }],
               ['link', 'image'],
               ['clean']
           ]
       }
   });
   ```

#### Étape 4 : Synchronisation des données (Form Submit)
1. Ajouter un événement JavaScript pour synchroniser le contenu de Quill vers l'input caché juste avant la soumission du formulaire, ou écouter les changements de texte :
   ```javascript
   quill.on('text-change', function() {
       document.getElementById('act-desc').value = quill.root.innerHTML;
   });
   ```
2. (Si applicable dans le futur) Lors de l'édition d'une quête existante via cette page (fonction `editActivity()`), injecter le contenu HTML depuis le backend dans l'éditeur Quill :
   ```javascript
   quill.root.innerHTML = activityDescriptionHtml;
   ```

