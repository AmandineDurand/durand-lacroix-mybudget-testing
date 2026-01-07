-- Script d'initialisation de la base de données Budget Personnel

-- Suppression des tables si elles existent déjà
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS budget CASCADE;
DROP TABLE IF EXISTS categorie CASCADE;
DROP TABLE IF EXISTS utilisateur CASCADE;

-- Suppression des types ENUM si ils existent
DROP TYPE IF EXISTS type_transaction;

-- Création du type ENUM pour les transactions
CREATE TYPE type_transaction AS ENUM ('REVENU', 'DEPENSE');

-- Table UTILISATEUR
CREATE TABLE utilisateur (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Table CATEGORIE
CREATE TABLE categorie (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icone VARCHAR(10)
);

-- Table TRANSACTIONS
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    montant DECIMAL(10, 2) NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    type type_transaction NOT NULL,
    date DATE NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    categorie_id INTEGER NOT NULL,
    utilisateur_id INTEGER NOT NULL,
    CONSTRAINT fk_transactions_categorie FOREIGN KEY (categorie_id) 
        REFERENCES categorie(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_utilisateur FOREIGN KEY (utilisateur_id) 
        REFERENCES utilisateur(id) ON DELETE CASCADE,
    CONSTRAINT montant_positif CHECK (montant > 0)
);

-- Table BUDGET
CREATE TABLE budget (
    id SERIAL PRIMARY KEY,
    montant_fixe DECIMAL(10, 2) NOT NULL,
    debut_periode DATE NOT NULL,
    fin_periode DATE NOT NULL,
    categorie_id INTEGER NOT NULL,
    utilisateur_id INTEGER NOT NULL,
    CONSTRAINT fk_budget_categorie FOREIGN KEY (categorie_id) 
        REFERENCES categorie(id) ON DELETE RESTRICT,
    CONSTRAINT fk_budget_utilisateur FOREIGN KEY (utilisateur_id) 
        REFERENCES utilisateur(id) ON DELETE CASCADE,
    CONSTRAINT montant_budget_positif CHECK (montant_fixe > 0),
    CONSTRAINT periode_valide CHECK (fin_periode > debut_periode),
    CONSTRAINT budget_unique_periode UNIQUE (utilisateur_id, categorie_id, debut_periode, fin_periode)
);

-- Insertion des catégories prédéfinies
INSERT INTO categorie (nom, description, icone) VALUES
    ('Alimentation', 'Courses, restaurants, cafés', '🍔'),
    ('Logement', 'Loyer, charges, assurance habitation', '🏠'),
    ('Transports', 'Essence, transports en commun, parking', '🚗'),
    ('Loisirs', 'Sorties, divertissements, hobbies', '🎮'),
    ('Santé', 'Médecin, pharmacie, mutuelle', '⚕️'),
    ('Vêtements', 'Habits, chaussures, accessoires', '👕'),
    ('Éducation', 'Formations, livres, cours', '📚'),
    ('Épargne', 'Placements, économies', '💰'),
    ('Factures', 'Électricité, internet, téléphone', '📱'),
    ('Autres', 'Dépenses diverses non catégorisées', '📦');

INSERT INTO utilisateur (email, mot_de_passe, nom, prenom, date_creation) VALUES 
    ('test@budget.com', 'test_password_hash', 'Test', 'User', CURRENT_TIMESTAMP);

-- Commentaires sur les tables et colonnes
COMMENT ON TABLE utilisateur IS 'Utilisateurs de l''application de gestion de budget';
COMMENT ON TABLE categorie IS 'Catégories prédéfinies pour classifier les transactions';
COMMENT ON TABLE transactions IS 'Enregistrement des revenus et dépenses';
COMMENT ON TABLE budget IS 'Budgets définis par catégorie et période';

COMMENT ON COLUMN utilisateur.mot_de_passe IS 'Hash du mot de passe (bcrypt, argon2, etc.)';
COMMENT ON COLUMN transactions.montant IS 'Montant en euros avec 2 décimales';
COMMENT ON COLUMN budget.montant_fixe IS 'Budget alloué pour la période';

-- Affichage de confirmation
SELECT 'Base de données initialisée avec succès!' AS message;
SELECT 'Catégories créées: ' || COUNT(*) FROM categorie;