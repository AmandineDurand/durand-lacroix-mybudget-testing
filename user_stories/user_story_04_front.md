### Déconnexion Manuelle et Sécurité de Session

**En tant que** utilisateur connecté,
**Je veux** pouvoir me déconnecter manuellement de l'application,
**Afin de** sécuriser mon compte sur un appareil partagé ou public.

**Parcours Utilisateur & Endpoints Ciblés :**

1. Un bouton "Déconnexion" (ou icône de sortie) est visible dans le header de l'application.
2. Au clic sur ce bouton, une modale de confirmation s'affiche : "Voulez-vous vraiment vous déconnecter ?".
3. Si l'utilisateur confirme, l'application :
   - Efface le token du localStorage/sessionStorage
   - Efface toutes les informations utilisateur stockées localement
   - Redirige vers la page de connexion (`/login`)
4. Un message toast confirme "Vous avez été déconnecté avec succès".

**Critères de Validation :**

- [ ] Le bouton "Déconnexion" est toujours visible dans le header/navbar de toutes les pages protégées.
- [ ] Au clic sur "Déconnexion", une modale de confirmation s'affiche pour éviter les déconnexions accidentelles.
- [ ] La modale propose deux boutons : "Annuler" (ferme la modale) et "Se déconnecter" (confirme l'action).
- [ ] Lors de la confirmation, l'application :
  - Appelle `localStorage.removeItem('auth_token')` (ou `sessionStorage.removeItem`)
  - Appelle `localStorage.removeItem('user_id')` et `localStorage.removeItem('username')`
  - Réinitialise l'état global de l'application (store/context)
- [ ] L'utilisateur est immédiatement redirigé vers `/login` après déconnexion.
- [ ] Une notification toast verte affiche "Déconnexion réussie" après redirection.
- [ ] Si l'utilisateur tente d'accéder à une page protégée après déconnexion (ex: via le bouton "Précédent" du navigateur), il est redirigé vers `/login` (Route Guard actif).
