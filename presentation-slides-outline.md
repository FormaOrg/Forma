# Slides Finale Projet FORMA

Date limite rappelee:
- depot au plus tard le dimanche 19 avril 2026 avant minuit
- export obligatoire en PDF
- 15 slides maximum
- nom du fichier:
  `Nom1_Nom2_Nom3_Nom4_Nom5_SLIDES.pdf`

Important:
- cette trame est basee sur le depot du projet et sa structure technique
- remplacez les zones entre crochets par vos vraies informations de groupe
- gardez uniquement ce qui correspond reellement a votre rapport et a ce qui a ete realise

## Ligne directrice visuelle Canva

- style recommande: moderne, clair, professionnel
- palette conseillee:
  - bleu fonce `#173B6C`
  - bleu clair `#4DA8DA`
  - blanc casse `#F7F9FC`
  - accent corail `#FF6B4A`
- 1 idee forte par slide
- 3 a 5 puces maximum par slide
- privilegier:
  - captures d'ecran
  - schemas simples
  - icones
  - chronologie
  - architecture en blocs

## Slide 1 - Presentation du projet

Titre:
`FORMA - Plateforme de creation et de gestion de vitrines web`

Contenu:
- Membres du groupe: `[Nom 1] - [Nom 2] - [Nom 3] - [Nom 4] - [Nom 5]`
- Contexte: digitalisation des activites et besoin de presence en ligne rapide
- Idee principale: proposer une plateforme permettant de creer, gerer et publier un site vitrine ou une storefront e-commerce
- Positionnement: centraliser conception, gestion de contenu, catalogue, clients et suivi

Visuel conseille:
- mockup laptop + mobile
- logo/titre au centre

## Slide 2 - Problematique et besoin

Titre:
`Problematique`

Contenu:
- Les petites structures ont besoin d'une presence web rapide sans repartir de zero
- Les solutions existantes peuvent etre complexes, fragmentees ou peu adaptees a un suivi complet du projet
- Le besoin identifie: creer une plateforme simple pour concevoir un espace en ligne, le personnaliser et le gerer efficacement
- Utilite du projet: gagner du temps, structurer la gestion et faciliter la mise en ligne

Visuel conseille:
- bloc "Probleme" vs bloc "Solution"

## Slide 3 - Utilisateurs cibles

Titre:
`Utilisateurs Cibles`

Contenu:
- Entrepreneurs, freelances, petites entreprises et porteurs de projet
- Utilisation dans un contexte de lancement d'activite, de presence marketing ou de vente en ligne
- Valeur apportee:
  - creation rapide d'un projet
  - gestion centralisee
  - publication d'une storefront publique
  - suivi du catalogue, des clients et des ventes

Visuel conseille:
- 3 personas simples avec icones

## Slide 4 - Objectifs du projet

Titre:
`Objectifs`

Contenu:
- Permettre la creation et la gestion de plusieurs projets depuis un meme tableau de bord
- Offrir un editeur visuel pour personnaliser la storefront
- Integrer les fonctionnalites essentielles e-commerce
- Proposer une vitrine publique consultable par les utilisateurs finaux
- Assurer un minimum de validation, de tests et de coherence entre les modules

Visuel conseille:
- 4 cartes objectifs avec icones

## Slide 5 - Etude et reflexion metier

Titre:
`Etude du Besoin`

Contenu:
- Analyse des besoins fonctionnels: authentification, gestion de projets, edition storefront, catalogue, clients, ventes
- Contraintes prises en compte:
  - simplicite d'usage
  - separation frontend/backend
  - evolution future de la plateforme
  - distinction brouillon / publie
- Scenarios principaux:
  - creer un projet
  - personnaliser la storefront
  - publier et consulter la vitrine publique
  - gerer produits, clients et commandes

Visuel conseille:
- parcours utilisateur en 4 etapes

## Slide 6 - Organisation de l'equipe et roles

Titre:
`Organisation de l'Equipe`

Contenu a adapter avec vos vrais noms:
- Product Owner: `[Nom]`
- Scrum Master / coordinateur: `[Nom]`
- Equipe de developpement: `[Noms]`
- Repartition possible des responsabilites:
  - UI/UX et interfaces
  - developpement frontend Angular
  - developpement backend Spring Boot
  - base de donnees
  - tests, validation et documentation

Note orale utile:
- si vous n'avez pas applique Scrum strictement, dites "organisation inspiree d'une demarche Agile"

Visuel conseille:
- tableau 2 colonnes: membre / responsabilites

## Slide 7 - Methode de travail et avancement

Titre:
`Methode et Avancement`

Contenu:
- Organisation iterative par phases avec integration progressive des fonctionnalites
- Utilisation de Git/GitHub pour le suivi du travail collaboratif
- Avancement observe dans le projet:
  - fondations plateforme: authentification, dashboard, gestion de projets
  - extension metier: storefront, catalogue, clients, ventes, analytics
  - ameliorations recentes: collaboration temps reel, presence editeur, corrections WebSocket, deploiement
- Le projet montre une progression concrete jusqu'aux derniers commits du 19 avril 2026

Chronologie suggeree dans Canva:
- Phase 1: cadrage + besoins
- Phase 2: architecture + authentification + dashboard
- Phase 3: modules e-commerce + storefront publique
- Phase 4: editeur visuel + collaboration + stabilisation

Visuel conseille:
- frise chronologique ou mini Gantt

## Slide 8 - Conception du projet

Titre:
`Conception`

Contenu:
- Architecture globale separee en frontend et backend
- Frontend: application Angular avec routes publiques, authentification et espace dashboard
- Backend: architecture microservices Spring Boot
- Principaux modules:
  - utilisateurs/authentification
  - projets/templates
  - commerce/storefront/catalogue
  - analytics
  - billing

Schema conseille:
- Angular Frontend
- API / services
- Base de donnees
- services utilisateurs / projets / commerce / analytics / billing

## Slide 9 - Choix techniques et methodologiques

Titre:
`Choix Techniques`

Contenu:
- Frontend: Angular 20 pour une application SPA structuree et modulaire
- Backend: Spring Boot avec separation par services metier
- Base de donnees: PostgreSQL
- Securite et acces: JWT
- Services complementaires: WebSocket pour la presence temps reel, Cloudinary pour les medias
- Methode: decoupage modulaire et implementation incrementale

Justification concise:
- Angular pour l'organisation des vues et routes
- Spring Boot pour la robustesse cote serveur
- microservices pour mieux separer les responsabilites

## Slide 10 - Aspect IHM / UX

Titre:
`IHM / UX`

Contenu:
- Interface de dashboard pour gerer les projets
- Editeur storefront visuel pour personnaliser les pages
- Parcours public de consultation de storefront et de checkout
- Recherche de simplicite, lisibilite et coherence entre les ecrans
- Importance des apercus visuels et du mode preview

Visuel conseille:
- 2 ou 3 captures:
  - landing page
  - dashboard projet
  - storefront publique ou editeur

## Slide 11 - Realisation

Titre:
`Realisation Effective`

Contenu:
- Fonctionnalites developpees:
  - authentification et gestion de compte
  - dashboard multi-projets
  - gestion storefront e-commerce
  - catalogue produits
  - clients et ventes
  - storefront publique et checkout
  - analytics et billing
- Editeur storefront avec gestion de contenu et preview
- Collaboration temps reel ajoutee sur l'editeur

Important:
- ne gardez que les fonctionnalites effectivement demonstrables

## Slide 12 - Resultats obtenus

Titre:
`Resultats`

Contenu:
- La plateforme permet deja de structurer un projet web/e-commerce de bout en bout
- L'utilisateur peut creer un projet, configurer une storefront et exposer une vue publique
- Les modules de gestion metier sont presents dans l'espace projet
- Le travail aboutit a une base concrete, evolutive et presentable

Visuel conseille:
- slide avant/apres ou synthese en 4 indicateurs

## Slide 13 - Tests et validation

Titre:
`Tests et Validation`

Contenu:
- Tests de bon fonctionnement sur les parcours principaux
- Verification des scenarios critiques:
  - connexion / inscription
  - creation et consultation de projet
  - edition et preview storefront
  - consultation storefront publique
  - gestion catalogue / clients / ventes
- Corrections apportees sur:
  - authentification
  - WebSocket / presence collaborative
  - stabilite de l'editeur
  - livraison email et integration

Visuel conseille:
- tableau simple: scenario / resultat

## Slide 14 - Difficultes rencontrees

Titre:
`Difficultes`

Contenu:
- Coordination entre plusieurs modules frontend et backend
- Gestion d'une architecture multi-services
- Synchronisation en temps reel dans l'editeur
- Stabilite des flux d'authentification et de communication WebSocket
- Arbitrage entre ambition fonctionnelle et temps disponible

Solutions apportees:
- separation plus claire des responsabilites
- corrections iteratives
- validation progressive des parcours
- integration et debug continus

## Slide 15 - Conclusion et perspectives

Titre:
`Conclusion et Perspectives`

Contenu:
- FORMA repond a un besoin concret de creation et de gestion de vitrines web/e-commerce
- Le projet a permis de mettre en place une architecture modulaire et plusieurs fonctionnalites reelles
- Points forts:
  - richesse fonctionnelle
  - organisation modulaire
  - orientation utilisateur
- Limites:
  - certaines parties restent a consolider ou a approfondir
- Perspectives:
  - renforcer les tests
  - finaliser certaines integrations
  - enrichir l'editeur visuel
  - ameliorer deploiement et experience utilisateur

## Captures / visuels a privilegier

Sources utiles deja presentes dans le depot:
- `Frontend/public/assets/Landing Page/...`
- `Frontend/public/assets/Ecommerce Showcase/...`
- `Frontend/public/assets/Templates Gallery/...`
- vues reelles de l'application si vous pouvez faire vos propres captures

Priorite des captures a prendre:
- page d'accueil
- tableau de bord projet
- editeur storefront
- catalogue produits
- storefront publique
- checkout ou page produit

## Conseils oraux

- ne lisez pas les slides
- 30 a 45 secondes maximum par slide
- insistez sur:
  - le besoin
  - l'organisation du groupe
  - ce qui a ete reellement developpe
  - les difficultes et les validations
- si une fonctionnalite est partielle, dites-le clairement mais valorisez ce qui est operationnel
