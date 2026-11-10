# Relance WhatsApp — programme d'envoi (Crea'rt)

Envoie la relance WhatsApp cadencée (mêmes 3 messages et même cadence que `send.js`) depuis le
**numéro SECONDAIRE**, piloté depuis le CRM : page **Relance WhatsApp**.

- Ce programme tourne sur **un ordinateur qui reste allumé** (le tien, ou un petit serveur).
  Vercel ne peut pas le faire : il faut garder WhatsApp ouvert pendant des heures.
- La personne qui a le téléphone secondaire n'a besoin que du CRM : elle voit le QR (ou un code
  à 8 lettres), le scanne, vérifie le numéro connecté, puis clique **Tester** et **Lancer l'envoi**.

⚠️ **Numéro SECONDAIRE uniquement.** C'est de l'automatisation non officielle : même ralentie,
il y a un risque de blocage du numéro.

## Installation (une seule fois)

1. **Supabase** → SQL Editor → coller et lancer
   [`supabase/migrations/20261110_creart_whatsapp_relance.sql`](../supabase/migrations/20261110_creart_whatsapp_relance.sql).
2. **Node.js** (version LTS) : https://nodejs.org. Vérifier avec `node -v`.
3. Dans ce dossier `whatsapp-relance/` :
   - copier `leads.json` ici (il n'est **pas** dans git : données personnelles) ;
   - copier `.env.example` en `.env`, puis y coller :
     - `RELANCE_TOKEN` : CRM → Relance WhatsApp → « Clé du programme d'envoi (admin) » → Afficher → Copier ;
     - `WA_ALLOWED_NUMBER` (conseillé) : le numéro secondaire, ex. `2126XXXXXXXX`.
       Si quelqu'un scanne avec un autre numéro, il est déconnecté aussitôt.
   - `npm install`

## Lancer

```bash
npm start
```

Laisse la fenêtre ouverte et l'ordinateur allumé (pas de mise en veille) pendant tout l'envoi.
Ensuite tout se fait dans le CRM :

1. **Relance WhatsApp** : le QR s'affiche (il change toutes les ~20 s, la page suit toute seule).
   - QR affiché sur un **autre écran** que le téléphone : WhatsApp → Appareils connectés → Connecter un appareil → scanner.
   - CRM ouvert **sur le même téléphone** : « Lier avec un code » → taper le numéro secondaire →
     un code de 8 lettres s'affiche → WhatsApp → Appareils connectés → Connecter un appareil →
     « Connecter avec le numéro de téléphone » → taper le code.
2. Vérifier le **numéro connecté** affiché. Pas le bon ? « Déconnecter ce numéro ».
3. **Tester (sans envoyer)** : liste dans le Journal qui serait contacté, avec la salutation. Rien n'est envoyé.
4. **Lancer l'envoi** : lots de 25, 50–90 s entre deux messages, ~45 min entre les lots.
   **Pause** à tout moment ; « Reprendre l'envoi » repart où on s'est arrêté.

## Bon à savoir

- **Reprise** : la progression est dans `sent.json` (ici). Personne ne reçoit le message deux fois,
  même si on coupe et relance le programme. Pour tout renvoyer un jour : supprimer `sent.json`.
- Un numéro en erreur ou pas sur WhatsApp est noté et sauté ; l'envoi continue.
- Arrêter le programme : `Ctrl+C` (le CRM affiche « Programme arrêté »).
- La session WhatsApp est gardée dans `.wwebjs_auth/` : pas besoin de rescanner à chaque lancement.
  Si elle s'abîme, le programme l'efface tout seul et un nouveau QR s'affiche.
- Un clic dans le CRM pendant que le programme est éteint est ignoré (jamais exécuté plus tard par surprise).
- Les réponses arrivent sur le numéro secondaire → les transférer à la commerciale pour closer.
