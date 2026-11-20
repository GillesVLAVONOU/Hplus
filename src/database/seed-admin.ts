import * as bcrypt from 'bcrypt';
import dataSource from './data-source/data-source.js';
import { RoleEnum } from '../authentification/enums/role.enum/role.enum.js';
import { UtilisateurPersonnelEntity } from '../personnel/entities/utilisateur-personnel.entity/utilisateur-personnel.entity.js';

async function creerAdministrateurInitial(): Promise<void> {
  const nom = process.env.INITIAL_ADMIN_NOM?.trim();
  const prenom = process.env.INITIAL_ADMIN_PRENOM?.trim();
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const motDePasse = process.env.INITIAL_ADMIN_PASSWORD;

  if (!nom || !prenom || !email || !motDePasse) {
    throw new Error(
      'INITIAL_ADMIN_NOM, INITIAL_ADMIN_PRENOM, INITIAL_ADMIN_EMAIL et INITIAL_ADMIN_PASSWORD sont requis.',
    );
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,128}$/.test(motDePasse)) {
    throw new Error(
      'Le mot de passe initial doit comporter 10 à 128 caractères, une minuscule, une majuscule et un chiffre.',
    );
  }

  await dataSource.initialize();
  try {
    const repository = dataSource.getRepository(UtilisateurPersonnelEntity);
    if (await repository.existsBy({ role: RoleEnum.ADMINISTRATEUR })) {
      throw new Error('Un compte administrateur existe déjà.');
    }
    if (await repository.existsBy({ email })) {
      throw new Error('Cette adresse e-mail est déjà associée à un compte personnel.');
    }
    await repository.save(
      repository.create({
        nom,
        prenom,
        email,
        motDePasseHache: await bcrypt.hash(motDePasse, 12),
        role: RoleEnum.ADMINISTRATEUR,
        actif: true,
      }),
    );
    console.log(`Compte administrateur créé : ${email}`);
  } finally {
    await dataSource.destroy();
  }
}

void creerAdministrateurInitial().catch((erreur: unknown) => {
  console.error('Échec de la création du compte administrateur initial.', erreur);
  process.exitCode = 1;
});
