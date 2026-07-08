![](./assets/image1.jpg){width="1.1616666666666666in" height="1.1616666666666666in"}

> A mes Parents

REMERCIMENTS

> Nous exprimons notre profonde gratitude à toutes les personnes qui ont contribué à la réalisation de ce travail :

-   Au président du jury, pour avoir accepté de présider cette soutenance et pour sa disponibilité.

-   À notre examinateur, qui a bien voulu consacrer son temps à l'évaluation de ce travail.

-   À notre encadreur Dr KAMENI HOMTE Jaurès, pour son accompagnement constant, ses précieux conseils et sa disponibilité tout au long de cette recherche, malgré ses nombreuses responsabilités.

-   Au Révérend Pr FROUISSOU, Recteur de notre université, pour avoir mis à notre disposition les moyens nécessaires à un environnement d'apprentissage optimal.

-   Le Doyen Pr TAMO TATIESTE Thomas pour son soutien et ses précieux conseils durant tout notre parcours ;

-   Au Dr KIATA Ernest, qui demeure pour nous un mentor et un modèle inspirant.

-   À l'ensemble du corps professoral de la Faculté des Technologies de l'Information et de la Communication de l'Université Protestante de Yaoundé, pour la formation de qualité qu'ils nous ont dispensé.

-   Mes remerciements s'adressent également à tout le personnel administratif de l'entreprise qui a accepté de collaborer à ce projet. Leur précieux retours d'expérience ont été essentiels pour comprendre les besoins réels du terrain et développer une solution adaptée a l'entreprise.

-   À mes parents M. TEMATSING Armand et Mme GUEYAP Pascaline pour leur amour, leur encouragement et confiance m'ont donné la force de poursuivre mes objectifs et de réussir. Leur investissement dans mon éducation est inestimable.

-   À mes frère et sœur.

-   À nos amis et camarades de promotion, qui ont rendu ce parcours académique agréable et enrichissant.

RESUME

Dans un contexte où les projets informatiques rencontrent encore des difficultés liées à la collecte, l'analyse et la formalisation des besoins des parties prenantes, la rédaction manuelle des cahiers des charges demeure un processus long, complexe et souvent source d'ambiguïtés entre les acteurs techniques et non techniques. Ce travail porte sur la conception et l'implémentation d'une plateforme intelligente permettant d'automatiser la génération des cahiers des charges à partir des besoins exprimés par les utilisateurs. La solution proposée est une Progressive Web Application (PWA) intégrant un système intelligent basé sur une architecture hybride combinant des services d'intelligence artificielle cloud et un modèle local pour certains traitements nécessitant davantage de confidentialité. Cette approche repose sur un mécanisme d'orchestration d'agents spécialisés dédiés à l'analyse des besoins, la structuration des informations, la génération des exigences fonctionnelles et non fonctionnelles, la production des modèles UML ainsi que l'amélioration de la qualité des documents générés. Le développement de la plateforme a été réalisé suivant la méthodologie Agile Scrum et s'appuie sur une modélisation UML pour la conception et la validation du système. Les résultats obtenus montrent que la solution permet de réduire le temps consacré à l'élaboration des cahiers des charges, d'améliorer la structuration des besoins recueillis et de faciliter la communication entre les différentes parties prenantes d'un projet informatique.

**Mots-clés** : Intelligence artificielle, Cahier des charges, Génération automatique de documents, Progressive Web Application, Système multi-agents, Ingénierie des exigences, UML, Architecture hybride.

ABSTRACT

In a context where software engineering projects still face challenges related to requirements elicitation, analysis, and formalization, the manual production of specifications documents remains a time-consuming and complex process, often leading to ambiguities and misunderstandings between technical and non-technical stakeholders. This study focuses on the design and implementation of an intelligent platform for the automatic generation of software requirements specifications from users' expressed needs. The proposed solution is developed as a Progressive Web Application (PWA) integrating an artificial intelligence-based system supported by a hybrid architecture combining cloud-based AI services and local processing mechanisms to improve flexibility and data confidentiality. The platform relies on an intelligent orchestration approach that coordinates specialized agents responsible for requirements analysis, information structuring, functional and non-functional requirements generation, UML model production, and document quality improvement. The development process follows the Agile Scrum methodology and uses UML modeling techniques for system design and validation. The obtained results demonstrate that the proposed platform reduces the time required to produce requirements documents, improves the organization and consistency of collected information, and facilitates communication between the different stakeholders involved in software projects.

**Keywords:** Artificial Intelligence, Requirements Specification, Progressive Web Application, Automatic Document Generation, Multi-Agent System, Software Engineering, UML, Hybrid Architecture.

TABLE DES MATIERES

> DEDICACE\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...i REMERCIMENTS\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\..... ii RESUME\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\.... iii ABSTRACT\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...iv
>
> TABLE DES MATIERES\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\....v
>
> LISTE DES FIGURES\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\....vii
>
> LISTE DES TABLEAUX\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\....viii
>
> LISTE DES ABREVIATIONS\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\....ix
>
> INTRODUCTION GENERALE\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...1

[**DEDICACE** [i](#_Toc234056265)](file:///C:\Users\Clara\Downloads\Mon%20Memoire%20(1).docx#_Toc234056265)

[CHAPITRE I : PRESENTATION DE L'ENTREPRISE ET ETAT DE L'ART [5](#_Toc234056266)](#_Toc234056266)

[I.1 Présentation de la structure d'accueil [5](#i.1-présentation-de-la-structure-daccueil)](#i.1-présentation-de-la-structure-daccueil)

[I.2 Fiche Signalétique de la structure d'accueil [5](#i.2-fiche-signalétique-de-la-structure-daccueil)](#i.2-fiche-signalétique-de-la-structure-daccueil)

[I.2 Plan de localisation de l'entreprise [6](#i.2-plan-de-localisation-de-lentreprise)](#i.2-plan-de-localisation-de-lentreprise)

[2.1 Contexte et Problématique [7](#contexte-et-problématique)](#contexte-et-problématique)

[2.2 Méthodes traditionnelles d'ingénierie des exigences [8](#méthodes-traditionnelles-dingénierie-des-exigences)](#méthodes-traditionnelles-dingénierie-des-exigences)

[I.3 Analyse Comparative des Solutions Existantes [9](#i.3-analyse-comparative-des-solutions-existantes)](#i.3-analyse-comparative-des-solutions-existantes)

[I.3.1 Générateurs d'Écriture Génériques [9](#i.3.1-générateurs-décriture-génériques)](#i.3.1-générateurs-décriture-génériques)

[I.3.2 Outils Collaboratifs [9](#i.3.2-outils-collaboratifs)](#i.3.2-outils-collaboratifs)

[I.3.3 Tableau Comparatif des Solutions [10](#i.3.3-tableau-comparatif-des-solutions)](#i.3.3-tableau-comparatif-des-solutions)

[I.4 L'Approche Disruptive Multi-Agents [11](#_Toc234056276)](#_Toc234056276)

[I.5 Cadre Juridique et Réglementaire National [12](#i.5-cadre-juridique-et-réglementaire-national)](#i.5-cadre-juridique-et-réglementaire-national)

[Conclusion [13](#conclusion)](#conclusion)

[CHAPITRE II : ANALYSE ET CONCEPTION [14](#_Toc234056279)](#_Toc234056279)

[II.1 Processus de développement [14](#ii.1-processus-de-développement)](#ii.1-processus-de-développement)

[II.1.1 Processus Agile [14](#ii.1.1-processus-agile)](#ii.1.1-processus-agile)

[II.1.2 Langage de modélisation UML [15](#ii.1.2-langage-de-modélisation-uml)](#ii.1.2-langage-de-modélisation-uml)

[II.2 Analyse des besoins [16](#ii.2-analyse-des-besoins)](#ii.2-analyse-des-besoins)

[II.2.1 Description des besoins fonctionnels [16](#ii.2.1-description-des-besoins-fonctionnels)](#ii.2.1-description-des-besoins-fonctionnels)

[II.2.2 Les acteurs du système [17](#ii.2.2-les-acteurs-du-système)](#ii.2.2-les-acteurs-du-système)

[II.2.3 Expression des besoins non fonctionnels [18](#ii.2.3-expression-des-besoins-non-fonctionnels)](#ii.2.3-expression-des-besoins-non-fonctionnels)

[II.3 Diagrammes de cas d'utilisation [19](#ii.3-diagrammes-de-cas-dutilisation)](#ii.3-diagrammes-de-cas-dutilisation)

[II.3.1 Diagramme de génération du cahier des charges [19](#ii.3.1-diagramme-de-génération-du-cahier-des-charges)](#ii.3.1-diagramme-de-génération-du-cahier-des-charges)

[II.3.2 Diagramme de génération des diagrammes [21](#ii.3.2-diagramme-de-génération-des-diagrammes)](#ii.3.2-diagramme-de-génération-des-diagrammes)

[II.3.3 Diagramme de validation du document [24](#ii.3.3-diagramme-de-validation-du-document)](#ii.3.3-diagramme-de-validation-du-document)

[II.3.4 Diagramme d'administration du système [25](#ii.3.4-diagramme-dadministration-du-système)](#ii.3.4-diagramme-dadministration-du-système)

[II.4 Interaction avec le système [28](#ii.4-interaction-avec-le-système)](#ii.4-interaction-avec-le-système)

[II.4.1 Diagrammes de séquence [28](#ii.4.1-diagrammes-de-séquence)](#ii.4.1-diagrammes-de-séquence)

[II.4.1.1 Diagramme de séquence du processus de génération du cahier des charges [28](#ii.4.1.1-diagramme-de-séquence-du-processus-de-génération-du-cahier-des-charges)](#ii.4.1.1-diagramme-de-séquence-du-processus-de-génération-du-cahier-des-charges)

[II.4.1.2 Diagramme de séquence de génération des diagrammes UML [29](#ii.4.1.2-diagramme-de-séquence-de-génération-des-diagrammes-uml)](#ii.4.1.2-diagramme-de-séquence-de-génération-des-diagrammes-uml)

[I.4.1.3 Diagramme de séquence de validation du document [30](#i.4.1.3-diagramme-de-séquence-de-validation-du-document)](#i.4.1.3-diagramme-de-séquence-de-validation-du-document)

[II.4.2 Diagrammes d'activité [31](#ii.4.2-diagrammes-dactivité)](#ii.4.2-diagrammes-dactivité)

[II.4.2.1 Diagramme d'activité de génération du cahier des charges [31](#ii.4.2.1-diagramme-dactivité-de-génération-du-cahier-des-charges)](#ii.4.2.1-diagramme-dactivité-de-génération-du-cahier-des-charges)

[I.4.2.2 Diagramme d'activité de génération des diagrammes UML [32](#i.4.2.2-diagramme-dactivité-de-génération-des-diagrammes-uml)](#i.4.2.2-diagramme-dactivité-de-génération-des-diagrammes-uml)

[II.4.2.3 Diagramme d'activité de validation du document [33](#ii.4.2.3-diagramme-dactivité-de-validation-du-document)](#ii.4.2.3-diagramme-dactivité-de-validation-du-document)

[II.5 Conception [34](#ii.5-conception)](#ii.5-conception)

[II.5.1 Architecture logique de l'application [34](#ii.5.1-architecture-logique-de-lapplication)](#ii.5.1-architecture-logique-de-lapplication)

[II.5.2 Architecture physique de l'application (Trois tiers) [35](#ii.5.2-architecture-physique-de-lapplication-trois-tiers)](#ii.5.2-architecture-physique-de-lapplication-trois-tiers)

[II.6.1 Pipeline CI/CD [39](#ii.6.1-pipeline-cicd)](#ii.6.1-pipeline-cicd)

[II.6.2 Infrastructure as Code (Terraform) [40](#_Toc234056305)](#_Toc234056305)

[Conclusion du chapitre [41](#conclusion-du-chapitre)](#conclusion-du-chapitre)

[CHAPITRE III: IMPLEMENTATION ET PRESENTATION DES RESULTATS [42](#chapitre-iii-implementation-et-presentation-des-resultats)](#chapitre-iii-implementation-et-presentation-des-resultats)

[III.1 Diagramme de déploiement sur AWS [42](#iii.1-diagramme-de-déploiement-sur-aws)](#iii.1-diagramme-de-déploiement-sur-aws)

[III.2 Environnement de développement [44](#iii.2-environnement-de-développement)](#iii.2-environnement-de-développement)

[III.2.1 Environnement matériel [44](#iii.2.1-environnement-matériel)](#iii.2.1-environnement-matériel)

[III.2.2 Environnement logiciel [44](#iii.2.2-environnement-logiciel)](#iii.2.2-environnement-logiciel)

[III.2.3 Langages de programmation utilisés [45](#iii.2.3-langages-de-programmation-utilisés)](#iii.2.3-langages-de-programmation-utilisés)

[III.3 Présentation des résultats [45](#iii.3-présentation-des-résultats)](#iii.3-présentation-des-résultats)

[Perspectives [46](#perspectives)](#perspectives)

[Analyse financière [48](#analyse-financière)](#analyse-financière)

[• Coûts initiaux [48](#coûts-initiaux)](#coûts-initiaux)

[• Coûts de développement [48](#coûts-de-développement)](#coûts-de-développement)

[• Coûts opérationnels [49](#coûts-opérationnels)](#coûts-opérationnels)

> Conclusion Générale\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\.... 49
>
> REFERENCE\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\... 50
>
> ANNEXE\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\...\....51

LISTE DES FIGURES

[Figure 1 Fiche Signalétique de L'Entreprise [5](#_Toc233455234)](#_Toc233455234)

[Figure 2 Plan de localisation de TETRATECH SERVICES SARL [6](#_Toc233455235)](#_Toc233455235)

[Figure 3 **Diagramme de cas d'utilisation -- Génération du cahier des charges** [19](#_Toc233455236)](#_Toc233455236)

[Figure 4 **Diagramme de cas d'utilisation -- Génération des diagrammes** [21](#_Toc233455237)](#_Toc233455237)

[Figure 5 **Diagramme de cas d'utilisation -- Validation du document** [24](#_Toc233455238)](#_Toc233455238)

[Figure 6 **Diagramme de cas d'utilisation -- Administration du système** [26](#_Toc233455239)](#_Toc233455239)

[Figure 7 Diagramme de séquence -- Génération du cahier des charges [27](#_Toc233455240)](#_Toc233455240)

[Figure 8 **Diagramme de séquence -- Génération des diagrammes UML** [28](#_Toc233455241)](#_Toc233455241)

[Figure 9 **Diagramme de séquence -- Validation du document** [29](#_Toc233455242)](#_Toc233455242)

[Figure 10 **Diagramme d'activité -- Génération du cahier des charges** [30](#_Toc233455243)](#_Toc233455243)

[Figure 11 **Diagramme d'activité de génération des diagrammes UML** [31](#_Toc233455244)](#_Toc233455244)

[Figure 12 **Diagramme d'activité de validation du document** [32](#_Toc233455245)](#_Toc233455245)

[Figure 13 **Architecture logique de l'application** [34](#_Toc233455246)](#_Toc233455246)

[Figure 14 **Diagramme de classes** [35](#_Toc233455247)](#_Toc233455247)

[Figure 15 Modèle Logique de Données [37](#_Toc233455248)](#_Toc233455248)

[Figure 16 diagramme de déploiement [42](#_Toc233455249)](#_Toc233455249)

LISTE DES TABLEAUX

[Tableau 1 Comparaison multicritères des solutions existantes [10](#_Toc234056321)](#_Toc234056321)

[Tableau 2 Description du cas d'utilisation « Générer un cahier des charges [20](#_Toc234056322)](#_Toc234056322)

[Tableau 3 Description du cas d'utilisation « Générer un diagramme » [22](#_Toc234056323)](#_Toc234056323)

[Tableau 4 Description du cas d'utilisation « Exporter un diagramme » [22](#_Toc234056324)](#_Toc234056324)

[Tableau 5 **Description du cas d'utilisation « Modifier un diagramme »** [23](#_Toc234056325)](#_Toc234056325)

[Tableau 6 Description du cas d'utilisation « Valider un document » [25](#_Toc234056326)](#_Toc234056326)

[Tableau 7 Description du cas d'utilisation « Administrer la plateforme » [27](#_Toc234056327)](#_Toc234056327)

[Tableau 8 Description des phases du pipeline d'intégration et de déploiement continu (CI/CD) [39](#_Toc234056328)](#_Toc234056328)

[Tableau 9 Avantages de l'Infrastructure as Code (Terraform) [40](#_Toc234056329)](#_Toc234056329)

[Tableau 10 **Environnement matériel** [44](#_Toc234056330)](#_Toc234056330)

[Tableau 11 **Environnement logiciel** [44](#_Toc234056331)](#_Toc234056331)

[Tableau 12 Langages de programmation [45](#_Toc234056332)](#_Toc234056332)

[Tableau 13 Matériels et coûts initiaux [48](#_Toc234056333)](#_Toc234056333)

[Tableau 14 Estimation globale du coût de développement [49](#_Toc234056334)](#_Toc234056334)

LISTE DES ABREVIATIONS

-   **AI** : Artificial Intelligence (Intelligence Artificielle)

-   **API** : Application Programming Interface (Interface de Programmation d'Application)

-   **AWS** : Amazon Web Services

-   **CI/CD** : Continuous Integration / Continuous Deployment (Intégration Continue / Déploiement Continu)

-   **CRUD** : Create, Read, Update, Delete (Créer, Lire, Mettre à jour, Supprimer)

-   **CSS** : Cascading Style Sheets

-   **Docker** : Plateforme de conteneurisation

-   **EC2** : Elastic Compute Cloud

-   **Git** : Système de gestion de versions distribué

-   **GitHub** : Plateforme d'hébergement de code source

-   **GitLab** : Plateforme de gestion de code source et d'intégration continue

-   **HTML** : HyperText Markup Language

-   **HTTP** : HyperText Transfer Protocol

-   **HTTPS** : HyperText Transfer Protocol Secure

-   **IA** : Intelligence Artificielle

-   **JSON** : JavaScript Object Notation

-   **LLM** : Large Language Model (Grand Modèle de Langage)

-   **PDF** : Portable Document Format

-   **PostgreSQL** : Postgre Structured Query Language

-   **PWA** : Progressive Web App

-   **REST** : Representational State Transfer

-   **SaaS** : Software as a Service (Logiciel en tant que Service)

-   **SDK** : Software Development Kit

-   **SMA** : Système Multi-Agents

-   **SQL** : Structured Query Language

-   **UML** : Unified Modeling Language

-   **URL** : Uniform Resource Locator

-   **VS Code** : Visual Studio Code

-   **XML** : eXtensible Markup Language

L'ingénierie des exigences constitue l'une des phases les plus importantes du cycle de vie du développement logiciel. Elle consiste à identifier, analyser, spécifier et valider les besoins des utilisateurs afin de garantir que le système développé répond aux attentes des différentes parties prenantes. Selon la norme ISO/IEC/IEEE 29148:2018, la qualité des exigences influence directement la réussite d'un projet logiciel. En effet, Sommerville souligne que les erreurs introduites durant la phase d'analyse des exigences figurent parmi les principales causes d'échec des projets informatiques et peuvent engendrer des coûts importants lorsqu'elles sont détectées tardivement \[9\]. De même, Pressman et Maxim mettent en évidence l'importance d'une approche rigoureuse de l'ingénierie logicielle afin d'améliorer la qualité et la fiabilité des systèmes développés \[10\].

Au Cameroun, le secteur des technologies de l'information et de la communication connaît une croissance continue, portée par la transformation numérique des entreprises et des administrations. Les entreprises de services du numérique développent de plus en plus de solutions logicielles adaptées aux besoins de leurs clients. Cependant, la rédaction des cahiers des charges reste majoritairement réalisée de manière manuelle. Les réunions de cadrage peuvent être longues et les besoins exprimés par les utilisateurs peuvent être incomplets, ambigus ou mal interprétés, entraînant ainsi des incompréhensions entre les acteurs, des retards dans la réalisation des projets et des dépassements de coûts.

Face à cette problématique, une question fondamentale se pose : **comment concevoir et implémenter une plateforme intelligente capable d'automatiser la génération des cahiers des charges tout en garantissant la qualité, la cohérence et la traçabilité des spécifications produites ?**

Ce travail a pour objectif de contribuer à l'amélioration du processus d'ingénierie des exigences en concevant et implémentant une plateforme intelligente capable de générer automatiquement des cahiers des charges à partir des besoins exprimés par les utilisateurs, tout en facilitant la génération des diagrammes UML associés conformément aux standards de modélisation \[7\].

Pour atteindre cet objectif, ce travail s'articule autour de trois chapitres :\
• Le premier chapitre, intitulé « **Présentation de la structure d'accueil et état de l'art** », présente l'entreprise d'accueil, les concepts liés à l'ingénierie des exigences, les cahiers des charges fonctionnels ainsi que les différentes solutions existantes dans le domaine de la génération automatique de documents de spécification.\
• Le deuxième chapitre, intitulé « **Analyse et conception** », présente l'analyse des besoins fonctionnels et non fonctionnels, la modélisation UML, la conception des données ainsi que l'architecture retenue pour la plateforme.\
• Le troisième chapitre, intitulé « **Implémentation et résultats** », décrit les technologies utilisées, les étapes de réalisation de la plateforme, les interfaces développées ainsi que les résultats obtenus.

Enfin, une conclusion générale récapitule les principaux apports de cette étude et présente les perspectives d'amélioration de la solution proposée.

#  CHAPITRE I : PRESENTATION DE L'ENTREPRISE ET ETAT DE L'ART

> Dans ce chapitre, nous présenterons brièvement la structure de l'entreprise ou de l'établissement d'accueil ainsi que son environnement. Ensuite, nous détaillerons les différentes technologies et systèmes existants dans le domaine de la génération de documents techniques et de l'ingénierie des exigences assistée par intelligence artificielle, en mettant en avant les besoins spécifiques de notre solution.

## I.1 Présentation de la structure d'accueil

Dans le cadre de mon stage académique, j'ai été accueilli au sein de TETRATECH SERVICES SARL, une entreprise de droit camerounais basée à Yaoundé. Spécialisée dans les services techniques et les solutions technologiques, elle intervient notamment dans les domaines des réseaux informatiques, de la maintenance, de l'électricité industrielle et de la vidéosurveillance.

Mon stage s'est déroulé au sein du département informatique, où j'ai participé à la conception et au développement d'une plateforme PWA multi-agents IA destinée à la génération intelligente et à la gestion collaborative de cahiers des charges. Cette expérience m'a permis de mettre en pratique les connaissances acquises en Génie Informatique tout en développant mes compétences en développement web et en intelligence artificielle.

## I.2 [Fiche Signalétique]{.underline} de la structure d'accueil

  ---------------------------------------------------------------------------------
  Raison Sociale              TETRATECH SERVICES SARL
  --------------------------- -----------------------------------------------------
  Adresse                     Yaoundé, MVOG-ADA

  Email                       [tetratechservices25@gmail.com]{.underline}

  Forme Juridique             TETRATECH SERVICES SARL

  Directeur de L'Entreprise   MR NDE CHRISTIAN BLAISE

  Contact                     699.27.72.32 /673.2426.44

  Site Internet               www.tetratech-services.com
  ---------------------------------------------------------------------------------

[]{#_Toc233455234 .anchor}Figure 1 : Fiche Signalétique de L'Entreprise

**TETRATECH -- SERVICES SARL** est une entreprise de droit camerounais spécialisée dans les prestations de services techniques, industriels et informatiques. Elle intervient dans plusieurs domaines d'activité, notamment la fourniture de matériels, le commerce général, le nettoyage industriel, les travaux industriels, la maintenance des systèmes de climatisation, la plomberie, la peinture, la maçonnerie, la chaudronnerie, le calorifuge, ainsi que la configuration et la maintenance des réseaux informatiques. L'entreprise réalise également des travaux d'isolation thermique, de refroidissement par eau glacée et de montage des gaines de ventilation mécanique contrôlée (VMC).

Soucieuse de satisfaire les besoins de sa clientèle, **TETRATECH -- SERVICES SARL** met l'accent sur la qualité de ses prestations, le respect des normes professionnelles et l'innovation. Grâce à son expertise et à son engagement, elle accompagne aussi bien les entreprises publiques que privées dans la réalisation de leurs projets techniques et industriels.

Au fil des années, l'entreprise a développé un portefeuille de partenaires et de clients parmi lesquels figurent **FUTURE ITECH**, **NGUELA HOTEL**, **CABINET TAF SERVICES**, **SMART SERVICES**, **OPTIMA AFRICA SERVICES**, le **Centre Médical Militaire de la Gendarmerie Nationale**, ainsi que les délégations du **MINADER** et du **MINEPIA de Soa**, témoignant ainsi de la confiance accordée à la qualité de ses prestations.

## I.2 [Plan de localisation de l'entreprise]{.underline} 

> ![](./assets/image9.png){width="5.138461286089239in" height="2.673611111111111in"}

[]{#_Toc233455235 .anchor}Figure 2 : Plan de localisation de TETRATECH SERVICES SARL

## 2.1 Contexte et Problématique

L'ingénierie des exigences, communément désignée dans la littérature scientifique sous le terme Requirements Engineering (RE)**,** est une discipline qui consiste à identifier, analyser, spécifier, valider et gérer les besoins des parties prenantes tout au long du cycle de développement d'un système logiciel. Selon la norme ISO/IEC/IEEE 29148:2018, elle constitue une activité essentielle permettant de garantir que les exigences exprimées sont complètes, cohérentes, traçables et conformes aux attentes des utilisateurs **\[13\]**. De même, Sommerville souligne que la qualité des exigences influence directement la réussite d'un projet logiciel et que les erreurs introduites durant cette phase figurent parmi les plus coûteuses à corriger au cours du développement **\[9\]**.

Au Cameroun, le secteur des technologies de l'information et de la communication (TIC) connaît une croissance soutenue, favorisée par les politiques de transformation numérique et l'émergence de nombreuses entreprises spécialisées dans le développement logiciel. Selon l'Agence Nationale des Technologies de l'Information et de la Communication (ANTIC)**,** les entreprises du numérique interviennent aujourd'hui dans plusieurs domaines tels que la santé, l'éducation, la finance, le commerce et l'administration publique **\[14\]**. Cette évolution entraîne une augmentation des projets informatiques nécessitant une formalisation rigoureuse des besoins.

Dans ce contexte, la rédaction des cahiers des charges représente une activité stratégique, car elle constitue un support essentiel de communication entre le client et l'équipe de développement. Toutefois, ce processus demeure largement manuel dans de nombreuses entreprises de services du numérique. Les **r**éunions de cadrage, les échanges informels et l'utilisation d'outils bureautiques classiques rendent la production des spécifications longue, répétitive et sujette aux ambiguïtés. Selon le Standish Group CHAOS Report**,** les problèmes liés à la définition et à la gestion des exigences figurent parmi les principaux facteurs d'échec des projets logiciels **\[15\]**.

Plusieurs facteurs expliquent cette situation. D'une part, les utilisateurs expriment généralement leurs besoins dans un langage métier, tandis que les équipes techniques nécessitent des spécifications précises, structurées et non ambiguës. D'autre part, les outils traditionnellement utilisés ne permettent pas une génération automatique des exigences ni une traçabilité efficace tout au long du projet. Enfin, la gestion des différentes versions du cahier des charges devient complexe lorsque plusieurs parties prenantes interviennent simultanément, augmentant ainsi les risques d'incohérences et d'omissions.

## 2.2 Méthodes traditionnelles d'ingénierie des exigences

Les méthodes traditionnelles d'ingénierie des exigences reposent principalement sur l'utilisation d'outils bureautiques, de documents textuels et d'échanges manuels entre les différentes parties prenantes d'un projet. La collecte des besoins s'effectue généralement à travers des réunions, des entretiens, des courriels ou des documents rédigés avec des logiciels de traitement de texte tels que Microsoft Word. Bien que ces pratiques soient largement adoptées dans les organisations, elles présentent plusieurs limites. Selon Sommerville et Pressman & Maxim, les approches manuelles rendent la formalisation des exigences plus complexe et augmentent les risques d'erreurs dès les premières phases du développement logiciel **\[9\]\[10\]**.

La rédaction manuelle des cahiers des charges est souvent longue et fastidieuse. La structuration des exigences dépend fortement de l'expérience du rédacteur, ce qui peut entraîner des ambiguïtés, des incohérences ou des omissions dans les spécifications. Les échanges d'informations par courriel ou par documents partagés rendent difficile la centralisation des besoins et compliquent leur suivi tout au long du cycle de développement. De plus, la gestion des différentes versions d'un même document peut engendrer des conflits, des pertes d'informations et des difficultés de collaboration entre les acteurs du projet. La norme ISO/IEC/IEEE 29148:2018 recommande la mise en place de mécanismes permettant d'assurer la traçabilité, la cohérence et la gestion des exigences durant tout le cycle de vie d'un système **\[13\]**.

Les enjeux liés à ces limitations sont nombreux. Premièrement, une mauvaise définition des exigences peut conduire à des erreurs de conception, à des retards de développement et à une augmentation des coûts du projet. Deuxièmement, l'absence de mécanismes de collaboration efficaces limite la qualité des échanges entre les clients, les analystes et les équipes techniques. Enfin, le manque d'assistance intelligente dans l'analyse et la formalisation des besoins réduit la qualité des cahiers des charges produites et augmente les risques d'interprétations divergentes. Selon le Standish Group CHAOS Report, les difficultés liées aux exigences figurent parmi les principaux facteurs d'échec des projets logiciels **\[15\]**.

Face à ces contraintes, l'adoption de solutions numériques modernes intégrant des mécanismes collaboratifs et des technologies d'intelligence artificielle apparaît comme une évolution nécessaire. Ces solutions permettent d'améliorer la collecte, l'analyse, la validation et la gestion des exigences tout en renforçant la qualité, la cohérence et la traçabilité des spécifications produites.

## I.3 Analyse Comparative des Solutions Existantes

Face aux limitations des méthodes traditionnelles, plusieurs catégories de solutions ont émergé sur le marché. Cette section propose une analyse critique de ces différentes approches, en mettant en lumière leurs apports respectifs ainsi que leurs lacunes persistantes.

### I.3.1 Générateurs d'Écriture Génériques

L'avènement des grands modèles de langage (LLM) tels que ChatGPT développé par OpenAI, Claude développé par Anthropic, et Gemini développé par Google, a ouvert de nouvelles perspectives pour l'automatisation de la rédaction documentaire (OpenAI, 2025 ; Anthropic, 2025 ; Google AI, 2025). Ces outils généralistes démontrent une capacité remarquable à produire du texte cohérent, structuré et contextuellement adapté. Cependant, leur utilisation directe pour la génération de cahiers des charges techniques présente plusieurs inconvénients majeurs.

Premièrement, ces modèles manquent de vision holistique du document. Ils génèrent du texte de manière séquentielle sans véritable compréhension de l'architecture globale du cahier des charges, ce qui conduit fréquemment à des redondances, des contradictions entre sections et des oublis structurels (OpenAI, 2025). Deuxièmement, ils ne produisent pas nativement de diagrammes UML ni de représentations graphiques formalisées qui constituent des éléments indispensables d'un cahier des charges technique (PlantUML, 2025). Troisièmement, le phénomène d'hallucination, caractéristique des LLM, peut introduire des spécifications fictives, des technologies inexistantes ou des exigences contradictoires qui compromettent la fiabilité du document (Anthropic, 2025 ; Google AI, 2025).

### I.3.2 Outils Collaboratifs

Les plateformes collaboratives telles que Google Docs, Notion et Confluence offrent des fonctionnalités avancées de co-édition en temps réel, de gestion des commentaires et de suivi des versions **\[16\]\[17\]\[18\]**. Ces outils améliorent significativement le processus collaboratif de rédaction mais demeurent des environnements génériques dépourvus d'intelligence métier spécifique à l'ingénierie des exigences. Ils ne guident pas le rédacteur dans la structuration du document, ne vérifient pas automatiquement la cohérence des spécifications et n'intègrent pas de capacités d'aide à la décision fondées sur l'analyse des besoins exprimés **\[9\]\[19\]**.

### I.3.3 Tableau Comparatif des Solutions

Afin de mettre en évidence les limites des solutions existantes et les apports de la plateforme proposée, le Tableau 1 présente une comparaison multicritère des principales solutions actuellement disponibles**.**

[]{#_Toc234056321 .anchor}Tableau 1 Comparaison multicritères des solutions existantes

  ------------------------------------------------------------------------------------
  Critère                       ChatGPT/Claude       Google Docs     Notion
  ----------------------------- -------------------- --------------- -----------------
  Génération IA                 Oui (générique)      Non             Non

  Diagrammes UML                Non                  Non             Non

  Orchestration multi-agents    Non                  Non             Non

  Validation client sécurisée   Non                  Non             Non

  Support LLM local (Ollama)    Non                  Non             Non

  Contrôle qualité intégré      Non                  Non             Non

  Gestion des versions Git      Non                  Limitée         Limitée
  ------------------------------------------------------------------------------------

## I.4 Notre proposition 

L'analyse des solutions existantes présentée dans le Tableau 1 met en évidence plusieurs limites. Les plateformes collaboratives facilitent la rédaction et le partage des documents, mais elles ne disposent pas de fonctionnalités intelligentes adaptées à l'ingénierie des exigences. De même, les assistants conversationnels basés sur les modèles de langage restent généralistes et ne garantissent pas la structuration, la validation et la cohérence des documents techniques générés.

Pour répondre à ces limites, nous proposons une plateforme intelligente de génération automatique de documents techniques reposant sur une architecture multi-agents. Cette approche s'appuie sur plusieurs agents spécialisés coordonnés par un orchestrateur central. L'Agent Planner assure la structuration du document, l'Agent Rédacteur génère le contenu, les Agents UML produisent les diagrammes techniques, l'Agent Tableaux crée les synthèses nécessaires et l'Agent Reviewer effectue le contrôle qualité du document final.

La solution adopte une architecture hybride combinant des modèles d'intelligence artificielle accessibles via des API externes et des modèles locaux exécutés avec Ollama afin de garantir à la fois performance et confidentialité des données. L'utilisation du Vercel AI SDK permet l'intégration de plusieurs fournisseurs de modèles de langage à travers une interface unifiée.

Ainsi, cette plateforme propose une approche spécialisée pour l'ingénierie des exigences en automatisant la génération, la structuration et la validation des documents techniques tout en améliorant la qualité et la fiabilité des productions obtenues.

##  I.5 Cadre Juridique et Réglementaire National

Le développement et le déploiement d'une plateforme de génération de documents impliquant le traitement de données par intelligence artificielle s'inscrivent dans un cadre juridique et réglementaire spécifique au Cameroun, qu'il convient de respecter scrupuleusement.

La Loi n°2010/013 du 21 décembre 2010 régissant les communications électroniques au Cameroun établit le cadre général applicable aux services numériques. Elle définit notamment les obligations des fournisseurs de services en matière de protection des données personnelles et de sécurité des systèmes d'information. Cette loi constitue le texte fondamental encadrant toute activité liée au traitement électronique de données au Cameroun.

De manière plus spécifique, la Loi n°2024/017 du 23 décembre 2024 fixe les modalités de protection des données à caractère personnel au Cameroun. Ce texte, récemment promulgué, transpose dans l'ordre juridique camerounais les principes du Règlement Général sur la Protection des Données (RGPD) européen. Il impose aux responsables du traitement des données à caractère personnel l'obligation de garantir la confidentialité, l'intégrité et la disponibilité des données traitées. Dans le contexte de notre plateforme, cette loi implique que les données d'entreprise des clients (besoins, contraintes, spécifications métier) doivent être traitées avec le plus haut niveau de sécurité, justifiant pleinement l'architecture hybride avec instance locale Ollama.

Il convient également de mentionner la Loi n°2019/422 du 12 juillet 2019 relative à la cybercriminalité, qui encadre les infractions liées aux systèmes d'information et renforce les obligations de sécurité incombant aux opérateurs de services numériques. Cette législation impose la mise en place de mesures techniques et organisationnelles appropriées pour protéger les données contre tout accès non autorisé, toute altération ou destruction.

# Conclusion

Dans ce chapitre, nous avons présenté la structure d'accueil ainsi que le contexte général de l'étude. Nous avons également exposé les concepts fondamentaux de l'ingénierie des exigences des cahiers des charges et des technologies d'intelligence artificielle appliquées à leur génération avant d'analyser les principales solutions existantes en mettant en évidence leurs avantages et leurs limites. Cette étude a permis de constater qu'aucune des solutions analysées ne répond pleinement aux besoins de génération intelligente des cahiers des charges, de production des diagrammes UML et de traçabilité des exigences. Ces constats justifient la conception de la plateforme proposée dans ce travail. Le chapitre suivant sera consacré à l'analyse des besoins et à la conception de la solution retenue.

#  CHAPITRE II : ANALYSE ET CONCEPTION 

> Dans ce chapitre nous présenterons la méthodologie utilisée, nous ferons une analyse détaillée des besoins fonctionnels et enfin nous passerons à la conception de la solution.

la conception de la solution.

## II.1 Processus de développement

### II.1.1 Processus Agile

Le développement de la plateforme intelligente de génération des cahiers des charges a été réalisé selon une approche Agile, en particulier la méthode Scrum. Cette méthode de gestion de projet est fondée sur un processus itératif et incrémental permettant de développer progressivement les différentes fonctionnalités du système tout en prenant en compte les besoins des utilisateurs.

Dans le cadre de notre projet, l'utilisation de Scrum s'est révélée particulièrement adaptée en raison de la nature évolutive des exigences liées à la génération automatique des cahiers des charges et à l'intégration des technologies d'intelligence artificielle. Cette approche favorise la collaboration, la flexibilité et l'amélioration continue du produit.

Les travaux ont été organisés en plusieurs sprints permettant de développer progressivement les différents modules de la plateforme tels que la gestion des utilisateurs, la génération des cahiers des charges, la production des diagrammes et la validation des documents.

Parmi les principales pratiques Scrum utilisées, nous pouvons citer :

-   Les sprints de développement permettant la réalisation progressive des fonctionnalités.

-   Les réunions de suivi afin d'évaluer l'avancement du projet.

-   Les revues de sprint permettant de valider les fonctionnalités développées.

-   L'amélioration continue du produit grâce aux retours obtenus tout au long du développement.

Cette méthodologie a permis d'assurer une meilleure organisation du travail, une adaptation rapide aux changements et une meilleure qualité de la solution développée.

###  II.1.2 Langage de modélisation UML

La modélisation constitue une étape essentielle dans la conception des systèmes informatiques. Elle permet de représenter graphiquement les différents composants du système avant leur implémentation, facilitant ainsi la compréhension, l'analyse et la communication entre les acteurs du projet.

Dans le cadre de notre plateforme intelligente de génération des cahiers des charges, le langage UML (Unified Modeling Language) a été utilisé afin de modéliser les besoins fonctionnels et structurels du système. Ce langage offre plusieurs diagrammes permettant de représenter les interactions entre les utilisateurs et le système ainsi que l'organisation des données.

Les principaux diagrammes utilisés dans ce projet sont :

-   Les diagrammes de cas d'utilisation pour représenter les fonctionnalités offertes aux utilisateurs.

-   Les diagrammes de séquence pour illustrer les échanges entre les acteurs et le système.

-   Les diagrammes d'activité pour décrire les différents processus de traitement.

-   Le diagramme de classes pour représenter la structure des données et les relations entre les différentes entités.

L'utilisation d'UML a ainsi permis d'obtenir une meilleure compréhension du fonctionnement de la plateforme et de faciliter sa conception.

##  II.2 Analyse des besoins

Dans cette partie, nous présentons les besoins fonctionnels et non fonctionnels de la plateforme intelligente de génération des cahiers des charges. Cette analyse permet d'identifier les différentes fonctionnalités attendues par les utilisateurs ainsi que les contraintes techniques et organisationnelles que le système devra respecter afin de garantir son bon fonctionnement.

### II.2.1 Description des besoins fonctionnels

Afin de répondre aux besoins des utilisateurs et de faciliter la rédaction des cahiers des charges, notre solution est organisée autour de plusieurs modules fonctionnels :

● **Module d'authentification :** ce module permet aux utilisateurs de se connecter à la plateforme de manière sécurisée à l'aide de leurs identifiants.

● **Module de gestion des utilisateurs :** il permet à l'administrateur de gérer les comptes utilisateurs, les rôles et les droits d'accès.

● **Module de gestion des projets :** il permet de créer de nouveaux projets, de consulter la liste des projets existants et de suivre leur état

● **Module de génération des cahiers des charges :** ce module constitue le cœur de la plateforme. Il permet de générer automatiquement un cahier des charges à partir des informations et exigences fournies par l'utilisateur.

● **Module de génération des diagrammes :** ce module permet la création automatique des diagrammes UML afin de faciliter la modélisation du système.

● **Module de validation des documents :** il permet au client ou au validateur de consulter le document généré, de le valider ou de demander des modifications.

● **Module d'exportation :** ce module permet d'exporter le cahier des charges généré sous différents formats, notamment PDF et Word.

● **Module d'administration :** il permet la gestion globale de la plateforme, des utilisateurs et des paramètres du système.

### II.2.2 Les acteurs du système

L'analyse fonctionnelle a permis d'identifier quatre acteurs principaux interagissant avec le système. Chaque acteur dispose d'un périmètre fonctionnel spécifique, délimité par des droits d'accès et des responsabilités métiers clairement définis.

**Le Rédacteur** (ou Analyste Fonctionnel)** :** constitue l'utilisateur principal de la plateforme. Il est responsable de la création et de l'édition des cahiers des charges. Il initie les projets, saisit les descriptions de besoins, lance les processus de génération du cahier de charge, révise les contenus produits, et soumet les documents à validation client. Ce profil dispose d'un accès complet au canvas d'édition, aux outils de génération et aux fonctionnalités de gestion de versions.

**Le Validateur :** (ou Client) est la partie prenante externe qui valide le cahier des charges produit. Il accède à la plateforme via un lien sécurisé à usage unique qui le redirige vers un portail en lecture seule. Il peut consulter l'intégralité du document, section par section, et exprime sa décision finale par un clic sur le bouton "Valider" ou "Rejeter". En cas de rejet, il est tenu de saisir obligatoirement un motif détaillé pour chaque section contestée, assurant ainsi une traçabilité complète des corrections demandées.

**L'Administrateur Système :** gère la configuration de la plateforme et des agents IA. Il dispose d'un panneau d'administration dédié lui permettant d'ajuster les paramètres des modèles de langage (température, top-p, pénalité de présence), de définir les budgets maximum de tokens par section, d'activer ou de désactiver les différents agents, de modifier les invites système (system prompts) et de sélectionner les fournisseurs de LLM (cloud ou local).

**Le Super Admin** **:** détient tous les privilèges de l'Administrateur Système auxquels s'ajoutent la gestion des comptes utilisateurs, la configuration des clés API des fournisseurs de LLM, l'accès aux logs système et aux métriques d'utilisation, ainsi que la gestion des sauvegardes et de la maintenance de la base de données.

### II.2.3 Expression des besoins non fonctionnels

Les besoins non fonctionnels définissent les critères de qualité que doit respecter le système afin d'assurer son bon fonctionnement.

-   **Performance** : la plateforme doit générer les cahiers des charges et les diagrammes dans un délai raisonnable.

-   **Sécurité** : le système doit garantir la confidentialité et l'intégrité des données des utilisateurs et des projets.

-   **Disponibilité** : l'application doit être accessible à tout moment afin de permettre aux utilisateurs de travailler sans interruption.

-   **Fiabilité** : la plateforme doit produire des documents cohérents et limiter les erreurs de génération.

-   **Maintenabilité** : le système doit être conçu de manière modulaire afin de faciliter les mises à jour et les évolutions futures.

-   **Ergonomie** : l'interface utilisateur doit être simple, intuitive et facile à prendre en main.

-   **Portabilité** : l'application doit être accessible sur différents navigateurs et différents systèmes d'exploitation.

-   **Scalabilité** : l'architecture doit permettre l'ajout de nouvelles fonctionnalités et la prise en charge d'un nombre croissant d'utilisateurs.

# II.3 Diagrammes de cas d'utilisation

Les diagrammes de cas d'utilisation permettent de représenter les interactions entre les différents acteurs et la plateforme. Ils facilitent la compréhension des fonctionnalités du système ainsi que les responsabilités de chaque utilisateur. Dans notre projet, nous avons retenu plusieurs cas d'utilisation principaux correspondant aux fonctionnalités essentielles de la plateforme.

## II.3.1 Diagramme de génération du cahier des charges

La figure 3 présente le diagramme de cas d'utilisation relatif à la génération automatique du cahier des charges. Ce diagramme illustre les interactions entre le rédacteur et le système lors de la création d'un projet et de la production du document.

![](./assets/image10.png){width="4.0941174540682415in" height="3.3888692038495187in"}

[]{#_Toc233455236 .anchor}Figure 3 : Diagramme **de cas d'utilisation -- Génération du cahier des charges**

Le **Tableau 2** détaille le cas d'utilisation **« Générer un cahier des charges »**, qui constitue l'une des principales fonctionnalités de la plateforme proposée. Il présente de manière structurée les différents éléments associés à cette fonctionnalité, notamment son objectif, les acteurs impliqués, les préconditions, le scénario nominal, les post-conditions ainsi que les exceptions pouvant survenir lors de son exécution. Cette description permet de mieux comprendre le déroulement du processus de génération du cahier des charges et les interactions entre le rédacteur et le système.

[]{#_Toc234056322 .anchor}Tableau 2 : Description du cas d'utilisation « Générer un cahier des charges

+------------------+------------------------------------------------------------------------------------------------------+
| Intitulé         | Générer un cahier des charges                                                                        |
+==================+======================================================================================================+
| Objectif         | Permettre au rédacteur de générer automatiquement un cahier des charges à partir des besoins saisis. |
+------------------+------------------------------------------------------------------------------------------------------+
| Acteur(s)        | Rédacteur                                                                                            |
+------------------+------------------------------------------------------------------------------------------------------+
| Préconditions    | L'utilisateur doit être authentifié et un projet doit être créé.                                    |
+------------------+------------------------------------------------------------------------------------------------------+
| Scénario nominal | • Le rédacteur crée un projet.                                                                       |
|                  |                                                                                                      |
|                  | • Il saisit les besoins et les contraintes.                                                          |
|                  |                                                                                                      |
|                  | • Il lance la génération.                                                                            |
|                  |                                                                                                      |
|                  | • Le système traite les informations.                                                                |
|                  |                                                                                                      |
|                  | • Le cahier des charges est généré.                                                                  |
+------------------+------------------------------------------------------------------------------------------------------+
| Post-condition   | Le document est enregistré dans la base de données.                                                  |
+------------------+------------------------------------------------------------------------------------------------------+
| Exception        | Informations insuffisantes, erreur de génération ou indisponibilité du service IA.                   |
+------------------+------------------------------------------------------------------------------------------------------+

## II.3.2 Diagramme de génération des diagrammes

La figure 4 illustre le processus de génération automatique des diagrammes UML. Cette fonctionnalité permet d'enrichir le cahier des charges en produisant différents diagrammes nécessaires à la modélisation du système.

![](./assets/image11.png){width="4.333333333333333in" height="4.75625in"}[]{#_Toc233455237 .anchor}

Figure 4 : Diagramme **de cas d'utilisation -- Génération des diagrammes**

Le **Tableau 3** détaille le cas d'utilisation **« Générer un diagramme »**. Il présente les principaux éléments associés à cette fonctionnalité, notamment son objectif, les acteurs concernés, les préconditions, le scénario nominal, les post-conditions ainsi que les exceptions pouvant survenir lors de son exécution.

[]{#_Toc234056323 .anchor}Tableau 3 : Description du cas d'utilisation « Générer un diagramme »

  ------------------------------------------------------------------------------------------------------------------------------------
  Intitulé               Générer un diagramme
  ---------------------- -------------------------------------------------------------------------------------------------------------
  **Objectif**           Ce cas permet au rédacteur de générer automatiquement un diagramme UML à partir des informations du projet.

  **Acteur(s)**          Rédacteur

  **Précondition**       • Le rédacteur doit être authentifié.\
                         • Un projet doit exister.\
                         • Les données nécessaires doivent être renseignées.

  **Scénario nominal**   • Le rédacteur ouvre le module de génération des diagrammes.\
                         • Il choisit le type de diagramme à produire.\
                         • Le système analyse les informations du projet.\
                         • Le diagramme est généré automatiquement.\
                         • Le rédacteur visualise le résultat.\
                         • Il peut modifier ou corriger le diagramme.\
                         • Il valide la génération.

  **Post-condition**     Le diagramme est enregistré dans le projet et peut être exporté ou intégré au cahier des charges.

  **Exceptions**         • Projet inexistant.\
                         • Informations insuffisantes.\
                         • Erreur de génération.\
                         • Problème d'enregistrement.
  ------------------------------------------------------------------------------------------------------------------------------------

Le **Tableau 4** détaille le cas d'utilisation **« Exporter un diagramme »**. Il présente les principaux éléments associés à cette fonctionnalité, notamment son objectif, les acteurs impliqués, les préconditions, le scénario nominal, les post-conditions ainsi que les exceptions pouvant survenir lors de son exécution.

[]{#_Toc234056324 .anchor}Tableau 4 Description du cas d'utilisation « Exporter un diagramme »

  -----------------------------------------------------------------------------------------------------------
  Intitulé                  Exporter un diagramme
  ---------------------- -- ---------------------------------------------------------------------------------
  **Objectif**              Permettre au rédacteur d'exporter le diagramme généré dans différents formats.

  **Acteur(s)**             Rédacteur

  **Précondition**          • Un diagramme doit avoir été généré.\
                            • Le rédacteur doit être connecté.

  **Scénario nominal**      • Le rédacteur sélectionne le diagramme.\
                            • Il choisit le format d'exportation (PNG, PDF ou SVG).\
                            • Le système génère le fichier.\
                            • Le diagramme est téléchargé.

  **Post-condition**        Le diagramme est exporté avec succès.

  **Exceptions**            • Diagramme inexistant.\
                            • Erreur d'exportation.\
                            • Format non supporté.
  -----------------------------------------------------------------------------------------------------------

Le **Tableau 5** détaille le cas d'utilisation **« Modifier un diagramme »**. Il présente les principaux éléments associés à cette fonctionnalité, notamment son objectif, les acteurs impliqués, les préconditions, le scénario nominal, les post-conditions ainsi que les exceptions pouvant survenir lors de son exécution.

[]{#_Toc234056325 .anchor}Tableau 5** : Description du cas d'utilisation « Modifier un diagramme »**

+------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Intitulé         | Modifier un diagramme                                                                                                                            |
+==================+==================================================================================================================================================+
| Objectif         | Permettre au rédacteur d'apporter des corrections ou des modifications à un diagramme UML généré afin qu'il corresponde aux besoins du projet. |
+------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Acteur(s)        | Rédacteur                                                                                                                                        |
+------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Préconditions    | • Un diagramme doit exister.• Le diagramme doit être disponible dans le projet.                                                                  |
+------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Scénario nominal | • Le rédacteur sélectionne le diagramme à modifier.                                                                                              |
|                  |                                                                                                                                                  |
|                  | • Il effectue les modifications nécessaires.                                                                                                     |
|                  |                                                                                                                                                  |
|                  | • Il enregistre les changements.                                                                                                                 |
|                  |                                                                                                                                                  |
|                  | • Le système met à jour le diagramme.                                                                                                            |
|                  |                                                                                                                                                  |
|                  | • Le diagramme modifié est affiché.                                                                                                              |
+------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Post-condition   | Le diagramme est mis à jour et enregistré dans le projet.                                                                                        |
+------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+
| Exceptions       | • Diagramme introuvable.                                                                                                                         |
|                  |                                                                                                                                                  |
|                  | • Erreur lors de l'enregistrement des modifications.                                                                                            |
|                  |                                                                                                                                                  |
|                  | • Échec de la mise à jour du diagramme.                                                                                                          |
+------------------+--------------------------------------------------------------------------------------------------------------------------------------------------+

## II.3.3 Diagramme de validation du document

La figure 5 présente le processus de validation du cahier des charges par le client ou le validateur. Cette étape permet d'assurer la conformité du document avant son utilisation définitive.

![](./assets/image12.png){width="6.536317804024497in" height="4.546099081364829in"}[]{#_Toc233455238 .anchor}Figure 5 : Diagramme **de cas d'utilisation -- Validation du document**

Le **Tableau 6** détaille le cas d'utilisation **« Valider un document »**. Il présente les principaux éléments associés à cette fonctionnalité, notamment son objectif, les acteurs impliqués, les préconditions, le scénario nominal, les post-conditions ainsi que les exceptions pouvant survenir lors de son exécution.

Tableau 6Description du cas d'utilisation « Valider un document »

+------------------+---------------------------------------------------------------------+
| Intitulé         | Valider un document                                                 |
+==================+=====================================================================+
| Objectif         | Permettre au client de valider ou de rejeter le cahier des charges. |
+------------------+---------------------------------------------------------------------+
| Acteur(s)        | Validateur                                                          |
+------------------+---------------------------------------------------------------------+
| Préconditions    | Le document doit être disponible et soumis à validation.            |
+------------------+---------------------------------------------------------------------+
| Scénario nominal | • Le client consulte le document.                                   |
|                  |                                                                     |
|                  | • Il analyse son contenu                                            |
|                  |                                                                     |
|                  | • Il valide ou rejette le document.                                 |
|                  |                                                                     |
|                  | • Le système enregistre la décision.                                |
+------------------+---------------------------------------------------------------------+
| Post-condition   | Le statut du document est mis à jour.                               |
+------------------+---------------------------------------------------------------------+
| Exception        | Document indisponible ou problème d'accès.                         |
+------------------+---------------------------------------------------------------------+

## II.3.4 Diagramme d'administration du système

La **Figure 6** présente le diagramme de cas d'utilisation relatif à l'administration du système. Cette fonctionnalité est réservée à l'administrateur, qui assure la gestion des utilisateurs ainsi que la configuration générale de la plateforme afin de garantir son bon fonctionnement.

[]{#_Toc233455239 .anchor}Figure 6 : Diagramme **de cas d'utilisation -- Administration du système**

Le **Tableau 7** détaille le cas d'utilisation **« Administrer la plateforme »**. Il présente les principaux éléments associés à cette fonctionnalité, notamment son objectif, les acteurs impliqués, les préconditions, le scénario nominal, les post-conditions ainsi que les exceptions pouvant survenir lors de son exécution.

[]{#_Toc234056327 .anchor}Tableau 7 : Description du cas d'utilisation « Administrer la plateforme »

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------
  Intitulé           Administrer la plateforme
  ------------------ ---------------------------------------------------------------------------------------------------------------------------------------------
  Objectif           Permettre à l'administrateur de gérer les utilisateurs et de configurer le système afin d'assurer le bon fonctionnement de la plateforme.

  Acteur(s)          Administrateur

  Préconditions      • L'administrateur doit être authentifié.\
                     • Il doit disposer des droits d'administration.

  Scénario nominal   • L'administrateur accède au tableau de bord d'administration.\
                     • Il consulte les informations du système.\
                     • Il gère les comptes utilisateurs.\
                     • Il modifie les paramètres de la plateforme si nécessaire.\
                     • Il enregistre les modifications.\
                     • Le système met à jour les informations.

  Post-condition     Les paramètres du système et les informations administratives sont mis à jour et enregistrés.

  Exceptions         • Droits d'accès insuffisants.\
                     • Erreur lors de l'enregistrement des modifications.\
                     • Indisponibilité du système.
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------

## II.4 Interaction avec le système

Les diagrammes de séquence et les diagrammes d'activité constituent des outils de modélisation permettant de représenter le comportement dynamique du système. Les diagrammes de séquence illustrent les échanges entre les différents acteurs et les composants de la plateforme selon un ordre chronologique, tandis que les diagrammes d'activité décrivent les différentes étapes d'exécution des processus métiers.

### II.4.1 Diagrammes de séquence

#### II.4.1.1 Diagramme de séquence du processus de génération du cahier des charges

La figure 7 présente le scénario de génération d'un cahier des charges au sein de la plateforme intelligente. Ce diagramme de séquence met en évidence les interactions entre le rédacteur, la plateforme et les différents agents d'intelligence artificielle. Il décrit les étapes allant de la création du projet jusqu'à la génération finale du document.

![](./assets/image13.png){width="6.904568022747156in" height="5.566929133858268in"}

[]{#_Toc233455240 .anchor}Figure 7 : Diagramme de séquence -- Génération du cahier des charges

### II.4.1.2 Diagramme de séquence de génération des diagrammes UML

La figure 8 présente le processus de génération automatique des diagrammes UML par la plateforme intelligente. Ce diagramme illustre les interactions entre le rédacteur, la plateforme et l'agent spécialisé dans la production des diagrammes. Les diagrammes générés sont ensuite intégrés au cahier des charges final.

![](./assets/image14.png){width="6.700694444444444in" height="5.464566929133858in"}

[]{#_Toc233455241 .anchor}Figure 8 : Diagramme **de séquence -- Génération des diagrammes UML**

### I.4.1.3 Diagramme de séquence de validation du document

La figure 9 présente le processus de validation du cahier des charges par le client ou le validateur. Ce diagramme illustre les échanges entre le validateur, la plateforme et le rédacteur lors de la consultation du document, de l'ajout des commentaires et de la décision finale de validation ou de rejet.

![](./assets/image15.png){width="6.070866141732283in" height="5.041666666666667in"}

[]{#_Toc233455242 .anchor}Figure 9 : Diagramme **de séquence -- Validation du document**

##  II.4.2 Diagrammes d'activité

Les diagrammes d'activité permettent de représenter le déroulement des différentes opérations réalisées au sein de la plateforme. Ils mettent en évidence l'enchaînement des tâches, les décisions prises ainsi que les flux de contrôle des différents processus.

# II.4.2.1 Diagramme d'activité de génération du cahier des charges

La figure 9 présente le déroulement des activités nécessaires à la génération d'un cahier des charges. Elle illustre les différentes étapes réalisées depuis la création du projet jusqu'à l'exportation du document final.

![](./assets/image16.png){width="6.938311461067366in" height="4.440944881889764in"}

[]{#_Toc233455243 .anchor}Figure 10 **Diagramme d'activité -- Génération du cahier des charges**

### I.4.2.2 Diagramme d'activité de génération des diagrammes UML

La figure 11 illustre le processus de génération automatique des diagrammes UML à partir des informations fournies par le rédacteur. Le système analyse les besoins et produit les différents diagrammes nécessaires à la modélisation.

![](./assets/image17.png){width="5.141732283464567in" height="4.2756944444444445in"}

[]{#_Toc233455244 .anchor}Figure 11 **Diagramme d'activité de génération des diagrammes UML**

### II.4.2.3 Diagramme d'activité de validation du document

La figure 12 présente le processus de validation du cahier des charges par le client ou le validateur. Cette étape permet de confirmer la conformité du document ou de demander des corrections avant son approbation définitive.

![](./assets/image18.png){width="5.083333333333333in" height="4.204166666666667in"}

[]{#_Toc233455245 .anchor}Figure 12 **Diagramme d'activité de validation du document**

# II.5 Conception

La phase de conception constitue une étape fondamentale dans le développement de la plateforme intelligente de génération des cahiers des charges. Elle permet de transformer les besoins fonctionnels et non fonctionnels identifiés lors de l'analyse en une architecture logicielle cohérente, modulaire et évolutive.

Cette étape vise à définir l'organisation des différents composants du système, les interactions entre les utilisateurs et la plateforme, ainsi que la structure des données manipulées. Afin de garantir la maintenabilité, la sécurité et la performance de l'application, une architecture multicouche a été adoptée.

La conception présentée dans cette section comprend l'architecture logique de l'application, l'architecture physique, le diagramme de classes ainsi que le modèle logique des données.

# II.5.1 Architecture logique de l'application

L'architecture logique de la plateforme décrit l'organisation fonctionnelle des différents composants logiciels du système ainsi que leurs interactions. Elle permet de séparer les responsabilités afin de faciliter le développement, la maintenance et l'évolution de l'application.

La plateforme de génération intelligente des cahiers des charges repose sur une architecture multicouche composée de plusieurs niveaux spécialisés.

-   **La couche présentation** représente l'interface utilisateur de la plateforme. Développée sous forme de Progressive Web App (PWA), elle permet aux rédacteurs, validateurs et administrateurs d'interagir avec le système.

-   **La couche métier** assure le traitement des demandes des utilisateurs, la gestion des projets, la génération des cahiers des charges ainsi que la validation des documents.

-   **La couche des agents intelligents** regroupe les différents agents d'intelligence artificielle responsables de l'analyse des besoins, de la rédaction des sections, de la génération des diagrammes UML, du contrôle qualité et de la validation des contenus.

-   **La couche de données** garantit le stockage sécurisé des utilisateurs, des projets, des documents générés, des commentaires et des validations.

Cette architecture favorise la modularité du système et facilite l'intégration de nouveaux services d'intelligence artificielle.

![](./assets/image19.png){width="6.21259842519685in" height="4.1247583114610675in"}

[]{#_Toc233455246 .anchor}Figure 13 : Architecture **logique de l'application**

# II.5.2 Architecture physique de l'application (Trois tiers)

L'architecture physique de la plateforme repose sur le modèle à trois tiers, qui permet de répartir les traitements entre plusieurs couches indépendantes. Cette organisation améliore la sécurité, les performances ainsi que la maintenabilité du système. Les trois couches principales sont les suivantes :

**● Couche présentation :** Elle correspond à l'interface utilisateur accessible via la Progressive Web App. Cette couche permet la saisie des besoins, la consultation des documents générés, la validation des cahiers des charges ainsi que l'administration du système.

**● Couche application** : Cette couche constitue le cœur fonctionnel de la plateforme. Elle regroupe les services métier, les mécanismes de génération des documents ainsi que les agents intelligents chargés du traitement des données.

**● Couche données :** Elle assure le stockage des informations relatives aux utilisateurs, projets, documents, commentaires, validations et historiques. Elle garantit l'intégrité et la sécurité des données manipulées par le système.

Cette architecture nous a permis de structurer efficacement notre projet de fin d'étude. En séparant clairement les différentes couches de l'application, elle a facilité le développement, amélioré la maintenance et renforcé les performances globales de la plateforme. Elle s'est révélée particulièrement adaptée à un environnement complexe intégrant plusieurs agents d'intelligence artificielle, des services cloud et des modèles locaux. Cette organisation assure une gestion optimisée des ressources, une meilleure évolutivité du système ainsi qu'une interaction fluide entre les utilisateurs et les différents composants de la plateforme.

II.5.3 Diagramme de classes

Le diagramme de classes présenté à la figure 14 décrit la structure statique de la plateforme intelligente de génération des cahiers des charges. Il met en évidence les principales entités du système, notamment l'utilisateur, le projet, les exigences, le cahier des charges et les diagrammes UML, ainsi que les relations qui les unissent. Ce diagramme constitue le modèle conceptuel de l'application et sert de référence pour l'implémentation des différentes fonctionnalités de plateforme.

![](./assets/image20.png){width="6.333333333333333in" height="4.965277777777778in"}

Figure 14:[]{#_Toc233455247 .anchor} **Diagramme de classes**

II.5.4 Modèle Logique de Données (MLD)

Le Modèle Logique de Données (MLD) représente la structure des données destinée à être implémentée dans le système de gestion de base de données. Il constitue une étape intermédiaire entre la modélisation conceptuelle et la réalisation physique de la base de données.

Le MLD permet de définir :

-   les tables du système ;

-   les attributs de chaque table ;

-   les clés primaires ;

-   les clés étrangères ;

-   les relations entre les différentes entités.

Dans notre application, le MLD décrit l'organisation des données relatives aux utilisateurs, aux projets, aux cahiers des charges, aux diagrammes UML, aux commentaires et aux validations.Ce modèle joue un rôle essentiel dans la cohérence, la normalisation et l'intégrité des données de la plateforme. Il constitue également une base solide pour l'implémentation de la base de données et l'ensemble des traitements associés.

![](./assets/image21.png){width="6.333035870516185in" height="8.97468394575678in"}[]{#_Toc233455248 .anchor}Figure 15 Modèle Logique de Données

## II.6.1 Pipeline CI/CD

Le pipeline d'intégration et de déploiement continus (CI/CD) représente le mécanisme central d'automatisation du cycle de vie de l'application. Il permet d'enchaîner automatiquement les différentes étapes allant du développement jusqu'à la mise en production. Dans notre plateforme, le pipeline est organisé autour des étapes suivantes :

[]{#_Toc234056328 .anchor}Tableau 9 Description des phases du pipeline d'intégration et de déploiement continu (CI/CD)

+---------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| > Phase                                                 | > Description                                                                                                                                                                                                                                                               |
+=========================================================+=============================================================================================================================================================================================================================================================================+
| **Phase de test du code**                               | Cette étape consiste à exécuter automatiquement les tests unitaires et les tests d'intégration afin de vérifier le bon fonctionnement des modules de la plateforme, notamment les modules de génération de cahiers des charges et d'interaction avec les agents IA.         |
+---------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Phase de vérification des variables d'environnement** | Elle permet de s'assurer que toutes les configurations nécessaires au fonctionnement du système sont correctement définies, notamment les clés d'accès aux modèles d'intelligence artificielle, les paramètres de base de données et les configurations des services cloud. |
+---------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **Phase de build**                                      | Cette étape consiste à compiler l'application et à générer les artefacts nécessaires à son exécution. Dans le cas d'une architecture conteneurisée, elle inclut également la construction des images Docker.                                                                |
+---------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

### 

### II.6.3 Architecture d'intégration des API d'intelligence artificielle

Afin de permettre à la plateforme d'exploiter les capacités de plusieurs modèles d'intelligence artificielle, une architecture d'intégration des API IA a été conçue. Cette architecture définit les différents composants impliqués dans la communication entre l'application, l'orchestrateur multi-agents et les fournisseurs de modèles d'intelligence artificielle.

Elle repose sur une couche d'abstraction permettant d'interfacer plusieurs services IA, notamment les modèles cloud tels que OpenAI, Anthropic et Google Gemini, ainsi que les modèles locaux exécutés via Ollama. Cette approche offre une meilleure flexibilité dans le choix des modèles tout en garantissant la confidentialité des données sensibles.La Figure X présente l'architecture d'intégration des API d'intelligence artificielle proposée.

![](./assets/image22.png){width="6.333333333333333in" height="4.222222222222222in"}

Figure 16 : Architecture **d'intégration des API d'intelligence artificielle**

L'utilisateur interagit avec la plateforme via l'interface applicative. Les requêtes sont ensuite traitées par l'orchestrateur qui sélectionne l'agent approprié et transmet les demandes aux modèles IA disponibles via les API configurées. Les réponses générées sont ensuite exploitées pour produire les différents éléments du document technique.

## Conclusion du chapitre

Dans ce chapitre, nous avons présenté la phase d'analyse et de conception de notre plateforme intelligente de génération des cahiers des charges fonctionnelles. Nous avons mis en évidence les besoins fonctionnels et non fonctionnels du système, identifié les différents acteurs, et modélisé la solution à travers les diagrammes UML.Nous avons également défini l'architecture logique et physique de l'application, basé sur une approche multicouche intégrant des agents d'intelligence artificielle spécialisés. Enfin, nous avons présenté le diagramme de classes ainsi que le modèle logique des données.Le chapitre suivant sera consacré à l'implémentation de la solution et à la présentation des résultats obtenus.

#  CHAPITRE III: IMPLEMENTATION ET PRESENTATION DES RESULTATS

###  III.1 Diagramme de déploiement sur AWS

La figure 15 présente le diagramme de déploiement de l'application sur l'infrastructure AWS. Ce schéma illustre la manière dont les différents composants techniques de la solution (application Odoo, base de données PostgreSQL, services réseau, etc.) sont organisés, configurés et interconnectés dans un environnement cloud sécurisé.

![](./assets/image23.png){width="5.038888888888889in" height="5.0in"}

[]{#_Toc233455249 .anchor}Figure 17 diagramme de déploiement

### III.2 Environnement de développement

Dans cette partie, nous présentons l'environnement matériel, logiciel ainsi que les différentes technologies utilisées pour la réalisation de ce projet.

### III.2.1 Environnement matériel

Le tableau 10 présente l'environnement matériel de travail, notamment les équipements physiques utilisés :

[]{#_Toc234056330 .anchor}Tableau 10 **Environnement matériel**

  -----------------------------------------------------------------------
  Caractéristiques                         Valeur
  ---------------------------------------- ------------------------------
  Marque                                   HP

  Processeur                               Core i7-9600U × 8

  Mémoire RAM                              8 Go

  Fréquence du processeur                  2.80 GHz

  Capacité du disque                       256 Go

  Système d'exploitation                   Windows 11
  -----------------------------------------------------------------------

### III.2.2 Environnement logiciel

Le tableau 11 présente les différents logiciels utilisés pour le développement du projet :

[]{#_Toc234056331 .anchor}Tableau 11 **Environnement logiciel**

  -----------------------------------------------------------------------
  Nom du logiciel / outil   Rôle
  ------------------------- ---------------------------------------------
  PostgreSQL 17             Base de données relationnelle

  Docker                    Conteneurisation des services

  Github action             Intégration et déploiement continu (CI/CD)

  Draw.io                   Modélisation UML

  VS Code / Cursor          Environnement de développement
  -----------------------------------------------------------------------

### III.2.3 Langages de programmation utilisés

Le tableau 12 présente les différents langages utilisés dans le projet :

[]{#_Toc234056332 .anchor}Tableau 12 Langages de programmation

  -----------------------------------------------------------------------
  Langage / Technologie      Rôle
  -------------------------- --------------------------------------------
  Python                     Backend flask(logique métier, modèles)

  TypeScript                 Interfaces dynamiques

  React                      Interfaces utilisateur

  Bash                       Scripts d'automatisation système

  YAML                       Configuration de déploiement
  -----------------------------------------------------------------------

### III.3 Présentation des résultats

Dans cette partie, nous présentons les résultats obtenus à travers l'implémentation de la plateforme.

-   **Page d'accueil :** elle représente l'interface principale de la plateforme et offre une vue d'ensemble des services proposés. La figure 16 l'illustre.

La transformation numérique des organisations s'accompagne d'un besoin croissant de produire des documents de spécification fiables, complets et conformes aux exigences des projets informatiques. Pourtant, la rédaction d'un cahier des charges reste une activité complexe, longue et fortement dépendante des compétences du rédacteur. Les méthodes traditionnelles de rédaction entraînent souvent des incohérences, des omissions et une perte considérable de temps, ce qui peut compromettre la réussite des projets.

Pour apporter une réponse concrète à cette problématique, l'objectif principal de ce projet a été de concevoir et d'implémenter une plateforme intelligente de génération automatique des cahiers des charges, intégrant des agents spécialisés basés sur l'intelligence artificielle. Cette plateforme s'inscrit dans une dynamique de modernisation des processus d'ingénierie logicielle en proposant un outil capable d'assister les analystes, les chefs de projet, les développeurs ainsi que les étudiants dans la rédaction de documents de spécification de qualité.

Pour atteindre cet objectif, une étude approfondie des méthodes traditionnelles de rédaction des cahiers des charges ainsi qu'une analyse des solutions existantes ont d'abord été réalisées. Cette étude a permis d'identifier les limites des approches actuelles et de définir les besoins fonctionnels et non fonctionnels de la plateforme. La conception s'est ensuite appuyée sur le langage UML afin de modéliser l'ensemble du système, tandis que le développement a été réalisé à l'aide de technologies modernes telles que **React**, **Flask**, **PostgreSQL**, **Docker** et des modèles d'intelligence artificielle, suivant une approche de développement progressive et modulaire.

Au final, ce projet a abouti à une plateforme intelligente permettant la création et la gestion des projets, la collecte des besoins fonctionnels et non fonctionnels, la génération automatique des différentes sections du cahier des charges, la production des diagrammes UML ainsi que l'exportation du document final. Les résultats obtenus montrent une amélioration significative du temps de production des cahiers des charges, une meilleure cohérence des documents générés et une réduction des erreurs liées à la rédaction manuelle.

### Perspectives

-   Intégrer des modèles d'intelligence artificielle plus performants afin d'améliorer la qualité et la pertinence des cahiers des charges générées ;

-   Étendre la génération automatique à l'ensemble des diagrammes UML (classes, cas d'utilisation, séquence, activités, composants, déploiement, états, etc.) ;

-   Mettre en place un assistant conversationnel intelligent capable d'accompagner l'utilisateur tout au long de la rédaction des besoins ;

-   Développer des fonctionnalités de collaboration en temps réel entre plusieurs rédacteurs sur un même projet ;

**\[1\]** OpenAI, *Documentation officielle de l'API OpenAI*, \[En ligne\]. Disponible sur : <https://platform.openai.com/docs>. \[Consulté le 15 juin 2026\].

**\[2\]** FastAPI, *Documentation officielle*, \[En ligne\]. Disponible sur : <https://fastapi.tiangolo.com>. \[Consulté le 17 juin 2026\].

**\[3\]** Python Software Foundation, *Python Documentation*, \[En ligne\]. Disponible sur : <https://docs.python.org/3>. \[Consulté le 17 juin 2026\].

**\[4\]** PostgreSQL Global Development Group, *Documentation PostgreSQL*, \[En ligne\]. Disponible sur : <https://www.postgresql.org/docs>. \[Consulté le 18 juin 2026\].

**\[5\]** Docker, *Documentation Docker*, \[En ligne\]. Disponible sur : <https://docs.docker.com>. \[Consulté le 18 juin 2026\].

**\[6\]** GitHub, *GitHub Documentation*, \[En ligne\]. Disponible sur : <https://docs.github.com>. \[Consulté le 20 juin 2026\].

**\[7\]** Object Management Group, *Unified Modeling Language (UML) Version 2.5.1*, \[En ligne\]. Disponible sur : <https://www.omg.org/spec/UML>. \[Consulté le 22 juin 2026\].

**\[8\]** Grady Booch, James Rumbaugh et Ivar Jacobson, *The Unified Modeling Language User Guide*, 2ᵉ édition, Addison-Wesley Professional, 2005.

**\[9\]** Ian Sommerville, *Software Engineering*, 10ᵉ édition, Pearson Education, 2016.

**\[10\]** Roger S. Pressman et Bruce R. Maxim, *Software Engineering: A Practitioner's Approach*, 9ᵉ édition, McGraw-Hill Education, 2019.

**\[11\]** Ken Schwaber et Jeff Sutherland, *The Scrum Guide*, 2020. \[En ligne\]. Disponible sur : <https://scrumguides.org>. \[Consulté le 23 juin 2026\].

**\[12\]** OWASP Foundation, *OWASP Top 10 -- Web Application Security Risks*, \[En ligne\]. Disponible sur : <https://owasp.org/www-project-top-ten>. \[Consulté le 24 juin 2026\].

**13\]** ISO/IEC/IEEE, *ISO/IEC/IEEE 29148:2018 Systems and software engineering --- Life cycle processes --- Requirements engineering*, IEEE, 2018.

**\[14\]** Agence Nationale des Technologies de l'Information et de la Communication (ANTIC), *Rapports et publications sur le développement du numérique au Cameroun*, \[En ligne\]. Disponible sur : <https://www.antic.cm>. \[Consulté le 2026\].

**\[15\]** The Standish Group International, *CHAOS Report: Software Project Success and Failure*, \[En ligne\]. Disponible sur : <https://www.standishgroup.com>. \[Consulté le 2026\].

**16\]** Google Docs, *Google Docs Help -- Collaborate in documents*, \[En ligne\]. Disponible sur : <https://support.google.com/docs>. \[Consulté le 2026\].

**\[17\]** Notion, *Notion Help Center -- Collaboration and document management*, \[En ligne\]. Disponible sur : <https://www.notion.so/help>. \[Consulté le 2026\].

**\[18\]** Confluence, *Atlassian Confluence Documentation -- Collaboration and knowledge management*, \[En ligne\]. Disponible sur : https://support.atlassian.com/confluence. \[Consulté le 2026\].

**\[19\]** Karl Wiegers et Joy Beatty, *Software Requirements*, 3ᵉ édition, Microsoft Press, 2013.

# Analyse financière

Pour évaluer la faisabilité économique de notre plateforme intelligente de génération des cahiers des charges, nous avons estimé les différents coûts nécessaires à son développement et à son exploitation. Cette analyse prend en compte les coûts initiaux, les coûts de développement ainsi que les coûts opérationnels liés au fonctionnement de la plateforme.

Pour notre solution, nous distinguons trois catégories de coûts.

### • Coûts initiaux

Les coûts initiaux correspondent principalement à l'acquisition de l'infrastructure cloud nécessaire à l'hébergement de la plateforme. Ils comprennent également les ressources indispensables au fonctionnement des différents services de l'application. Les estimations de ces dépenses sont présentées dans le tableau 13**.**

[]{#_Toc234056333 .anchor}Tableau 13 Matériels et coûts initiaux

  -------------------------------------------------------------------------
  Nom du composant       Prix unitaire           Quantité   Total
  ---------------------- ----------------------- ---------- ---------------
  Serveur AWS (EC2)      125 000 FCFA / mois     1          125 000 FCFA

  Nom de domaine         15 000 FCFA / an        1          15 000 FCFA

  Certificat SSL         Gratuit                 1          0 FCFA

  PostgreSQL             Gratuit (Open Source)   1          0 FCFA

  Docker                 Gratuit (Open Source)   1          0 FCFA

  FastAPI                Gratuit (Open Source)   1          0 FCFA

  Ollama                 Gratuit                 1          0 FCFA
  -------------------------------------------------------------------------

### 

### • Coûts de développement

Les coûts de développement regroupent les dépenses liées à la conception, à l'implémentation, aux tests de la plateforme, à la connectivité Internet ainsi qu'à l'utilisation éventuelle des modèles d'intelligence artificielle. Cette estimation couvre notamment les frais de connexion Internet, les essais des modèles IA, les outils de développement ainsi que les différents environnements de test.

Nous estimons ces dépenses à **150 000 FCFA**.

### • Coûts opérationnels

Après son déploiement, la plateforme devra fonctionner de manière continue afin d'assurer la génération automatique des cahiers des charges, la communication entre les différents agents intelligents et le stockage sécurisé des projets.

Les principales charges concernent l'hébergement AWS, le stockage des données, les sauvegardes automatiques, la maintenance du serveur ainsi que l'utilisation éventuelle des modèles d'intelligence artificielle. Pour un fonctionnement optimal, un serveur cloud disposant de ressources suffisantes (16 Go de RAM, 8 vCPU et un stockage SSD) est recommandé. Le coût opérationnel est estimé à **250 000 FCFA** par mois.

**Le** tableau 14 présente une estimation globale des coûts de développement et d'exploitation de notre plateforme.

[]{#_Toc234056334 .anchor}Tableau 14 Estimation globale du coût de développement

  -----------------------------------------------------------------------
  Analyse                                             Montant
  --------------------------------------------------- -------------------
  Coûts initiaux                                      140 000 FCFA

  Coûts de développement et de connectivité           150 000 FCFA

  Coûts opérationnels                                 250 000 FCFA

  **TOTAL**                                           **540 000 FCFA**
  -----------------------------------------------------------------------

L'analyse des résultats présentés dans le tableau 14 montre que le coût global de développement de la plateforme est estimé à **540 000 FCFA**. Cette estimation demeure raisonnable compte tenu des fonctionnalités offertes par la solution. L'utilisation de technologies open source telles que FastAPI**,** PostgreSQL**,** Docker**,** Ollama **et** PlantUML permet de réduire considérablement les dépenses liées aux licences logicielles. Les principaux coûts sont essentiellement liés à l'infrastructure cloud, aux ressources de calcul nécessaires à l'exécution des modèles d'intelligence artificielle ainsi qu'à la maintenance de la plateforme. À mesure que le nombre d'utilisateurs augmentera, l'architecture cloud permettra une montée en charge progressive tout en maîtrisant les coûts d'exploitation.
